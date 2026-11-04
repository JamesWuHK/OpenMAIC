// Acceptance-only relay. No credentials, provider selection or production writes.
import http from 'node:http';
import https from 'node:https';
import {createHash} from 'node:crypto';
import {StringDecoder} from 'node:string_decoder';
const CID='hk-nobel-07-sakaguchi-lecture-v1';
const ORIGIN='http://127.0.0.1:3000';
const MAX_BODY=8*1024*1024, MAX_RESPONSE=6*1024*1024;
const redact=s=>String(s??'').replace(/sk[-_][A-Za-z0-9_-]{8,}/g,'[REDACTED]').slice(0,500);
export async function startRealChatRelay(){
 if(process.env.CI!=='true')throw new Error('Cloud acceptance only');
 let closed=false,count=0,currentCase=null;
 const caseCounts=new Map(),activeRequests=new Set();
 const reports=[],sockets=new Set(),upstreams=new Set();
 const server=http.createServer(async(req,res)=>{
  const cors={'Access-Control-Allow-Origin':ORIGIN,'Vary':'Origin','Cache-Control':'no-store'};
  const reply=(status,message)=>{if(!res.headersSent&&!res.destroyed){res.writeHead(status,{...cors,'Content-Type':'application/json'});res.end(JSON.stringify({error:message}))}};
  if(closed)return reply(503,'Acceptance relay closed');
  if(req.url!=='/api/chat'||req.headers.origin!==ORIGIN)return reply(403,'Acceptance route or origin denied');
  if(req.method==='OPTIONS'){
   if(req.headers['access-control-request-method']!=='POST'||(req.headers['access-control-request-headers']??'').toLowerCase().split(',').some(s=>s.trim()&&s.trim()!=='content-type'))return reply(403,'Preflight denied');
   res.writeHead(204,{...cors,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type'});return res.end();
  }
  if(req.method!=='POST'||!/^application\/json(?:;|$)/i.test(req.headers['content-type']??''))return reply(405,'JSON POST required');
  if(!currentCase)return reply(409,'Acceptance case not started');
  if(count>=9||caseCounts.get(currentCase)>=3)return reply(429,'Acceptance request budget exhausted');
  caseCounts.set(currentCase,caseCounts.get(currentCase)+1);
  const entry={case:currentCase,number:++count,startedAt:Date.now(),events:[],upstreamBytes:0,chunks:0};reports.push(entry);activeRequests.add(entry);
  res.once('finish',()=>activeRequests.delete(entry));res.once('close',()=>activeRequests.delete(entry));
  let raw;
  const bodyTimer=setTimeout(()=>{entry.error="Request body timeout";req.destroy();res.destroy()},15000);
  try{
   const parts=[];let size=0;
   for await(const part of req){size+=part.length;if(size>MAX_BODY)throw new Error('Request size limit');parts.push(part)}
   raw=Buffer.concat(parts);const body=JSON.parse(raw.toString('utf8'));
   if(body.storeState?.stage?.id!==CID||(body.apiKey!==undefined&&body.apiKey!=='')||['baseUrl','model','providerType'].some(k=>Object.hasOwn(body,k)))throw new Error('Course or credential boundary');
   entry.requestSHA256=createHash('sha256').update(raw).digest('hex');entry.requestBytes=raw.length;
  }catch{clearTimeout(bodyTimer);entry.error='Request boundary rejected';return reply(400,entry.error)}
  clearTimeout(bodyTimer);
  if(closed){entry.error="Relay closed before upstream";return reply(503,entry.error)}
  let finished=false,connectTimer,idleTimer,totalTimer;
  const decoder=new StringDecoder('utf8');let lines='';
  const keepEvents=text=>{
   lines+=text;if(lines.length>1024*1024)throw new Error('SSE line limit');
   let end;
   while((end=lines.indexOf('\n'))>=0){
    const line=lines.slice(0,end).replace(/\r$/,'');lines=lines.slice(end+1);
    if(!line.startsWith('data: '))continue;
    let event;try{event=JSON.parse(line.slice(6))}catch{continue}
    const data=event.data??{};
    if(event.type==='agent_start')entry.events.push({type:event.type,data:{agentId:data.agentId,agentName:data.agentName,messageId:data.messageId}});
    if(event.type==='agent_end')entry.events.push({type:event.type,data:{agentId:data.agentId,messageId:data.messageId}});
    if(event.type==='text_delta')entry.events.push({type:event.type,data:{messageId:data.messageId,content:data.content}});
    if(event.type==='done')entry.events.push({type:event.type,data:{totalAgents:data.totalAgents,totalActions:data.totalActions,agentHadContent:data.agentHadContent}});
    if(event.type==='cue_user')entry.events.push({type:event.type,data:{fromAgentId:data.fromAgentId}});
    if(event.type==='error')entry.events.push({type:event.type,data:{error:redact(data.error??data.message)}});
   }
  };
  const finish=(error)=>{
   if(finished)return;finished=true;clearTimeout(connectTimer);clearTimeout(idleTimer);clearTimeout(totalTimer);entry.finishedAt=Date.now();if(error)entry.error=error;
  };
  const armIdle=()=>{clearTimeout(idleTimer);idleTimer=setTimeout(()=>{finish('Upstream read timeout');upstream.destroy();res.destroy()},30000)};
  const upstream=https.request({hostname:'class.wanli.ai',port:443,path:'/api/chat',method:'POST',agent:false,rejectUnauthorized:true,headers:{'Content-Type':'application/json','Content-Length':raw.length,'Accept':'text/event-stream','Accept-Encoding':'identity','User-Agent':'Wanli-Nobel07-synthetic-acceptance'}},response=>{
   entry.httpStatus=response.statusCode;
   if(response.statusCode>=300&&response.statusCode<400){response.destroy();finish('Upstream redirect rejected');reply(502,entry.error);upstream.destroy();return}
   if(response.headers['content-encoding']&&response.headers['content-encoding']!=='identity'){response.destroy();finish('Encoded SSE rejected');reply(502,entry.error);upstream.destroy();return}
   if(response.statusCode<200||response.statusCode>=300){response.destroy();finish('Upstream HTTP '+response.statusCode);reply(response.statusCode??502,entry.error);upstream.destroy();return}
   if(!/^text\/event-stream(?:;|$)/i.test(response.headers['content-type']??'')){response.destroy();finish('Non-SSE success response rejected');reply(502,entry.error);upstream.destroy();return}
   res.writeHead(response.statusCode,{...cors,'Content-Type':response.headers['content-type']});armIdle();
   response.on('data',chunk=>{
    entry.chunks++;entry.upstreamBytes+=chunk.length;entry.firstChunkAt??=Date.now();entry.lastChunkAt=Date.now();armIdle();
    if(entry.upstreamBytes>MAX_RESPONSE){finish('Upstream response size limit');upstream.destroy();res.destroy();return}
    try{keepEvents(decoder.write(chunk))}catch{finish('SSE parse limit');upstream.destroy();res.destroy()}
   });
   response.on('end',()=>{try{keepEvents(decoder.end()+'\n')}catch{entry.error='SSE ending parse limit'}finish()});
   response.on('error',()=>{finish('Upstream response interrupted');res.destroy()});
   response.pipe(res);
  });
  upstreams.add(upstream);upstream.on('close',()=>upstreams.delete(upstream));
  upstream.on('socket',socket=>{connectTimer=setTimeout(()=>{finish('TLS connect timeout');upstream.destroy();reply(504,entry.error)},15000);socket.once('secureConnect',()=>{clearTimeout(connectTimer);armIdle()})});
  upstream.on('error',error=>{finish('Upstream transport '+redact(error.code));if(!res.headersSent)reply(502,entry.error);else res.destroy()});
  totalTimer=setTimeout(()=>{finish('Upstream total timeout');upstream.destroy();if(!res.headersSent)reply(504,entry.error);else res.destroy()},Math.max(1,120000-(Date.now()-entry.startedAt)));
  res.on('close',()=>{if(!finished)finish('Client disconnected');upstream.destroy()});
  upstream.end(raw);
 });
 server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket))});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const address=server.address();if(!address||address.address!=='127.0.0.1')throw new Error('Relay binding boundary');
 let closing;
 const close=()=>closing??=(async()=>{closed=true;clearTimeout(deadline);for(const request of upstreams)request.destroy();for(const socket of sockets)socket.destroy();await new Promise(resolve=>server.close(resolve))})();
 const deadline=setTimeout(()=>{void close()},15*60*1000);deadline.unref();
 const beginCase=id=>{if(!['D-teacher','M-assistant','D-student'].includes(id)||caseCounts.has(id)||upstreams.size||activeRequests.size)throw new Error('Acceptance case boundary');currentCase=id;caseCounts.set(id,0)};
 return {url:`http://127.0.0.1:${address.port}`,reports,beginCase,close};
}
