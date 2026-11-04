// Cloud acceptance only: native same-origin HTTP streaming, no Playwright routing.
import http from 'node:http';
import assert from 'node:assert/strict';
const ORIGIN='http://127.0.0.1:3000';
const OMIT=new Set(['host','connection','keep-alive','proxy-authenticate','proxy-authorization','te','trailer','transfer-encoding','upgrade','authorization','cookie','set-cookie','x-forwarded-host','x-forwarded-proto','x-forwarded-for']);

export async function startCandidateGateway(relayUrl){
 assert.equal(process.env.CI,'true');
 const relay=new URL(relayUrl);
 assert.equal(relay.protocol,'http:');assert.equal(relay.hostname,'127.0.0.1');
 assert.ok(/^\d+$/.test(relay.port)&&relay.port!=='3000'&&relay.port!=='3002');
 assert.equal(relay.pathname,'/');assert.equal(relay.search+relay.hash+relay.username+relay.password,'');
 let closed=false;const sockets=new Set(),upstreams=new Set(),reports=[];
 const server=http.createServer((req,res)=>{
  const reply=(status)=>{if(!res.headersSent&&!res.destroyed){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'Acceptance gateway request failed'}))}};
  if(closed)return reply(503);
  if(req.headers.host!=='127.0.0.1:3000'||!req.url?.startsWith('/')||req.url.startsWith('//'))return reply(403);
  const url=new URL(req.url,ORIGIN);if(url.origin!==ORIGIN)return reply(403);
  const chat=req.method==='POST'&&url.pathname==='/api/chat'&&url.search==='';
  const speech=req.method==='POST'&&url.pathname==='/api/learner/speech'&&url.search==='';
  if(!chat&&!speech&&!['GET','HEAD'].includes(req.method))return reply(405);
  if((chat||speech)&&req.headers.origin!==ORIGIN)return reply(403);
  const limit=chat?8*1024*1024:speech?16384:0;
  const length=req.headers['content-length'];
  if(length!==undefined&&(!/^\d+$/.test(length)||Number(length)>limit))return reply(413);
  if(!limit&&req.headers['transfer-encoding'])return reply(413);
  const headers=Object.fromEntries(Object.entries(req.headers).filter(([name])=>!OMIT.has(name)));
  headers.host='127.0.0.1:3000';headers['x-forwarded-host']='127.0.0.1:3000';headers['x-forwarded-proto']='http';
  const row={path:url.pathname,method:req.method,upstream:chat?'fixed-chat-relay':'fixed-candidate',startedAt:Date.now(),requestBytes:0,responseBytes:0};reports.push(row);
  let ended=false,connectTimer,idleTimer;
  const finish=error=>{if(ended)return;ended=true;clearTimeout(connectTimer);clearTimeout(idleTimer);clearTimeout(totalTimer);row.finishedAt=Date.now();if(error)row.error=error};
  const abort=error=>{finish(error);upstream.destroy();if(!res.headersSent)reply(502);else res.destroy()};
  const armIdle=()=>{clearTimeout(idleTimer);idleTimer=setTimeout(()=>abort('Upstream idle timeout'),30000)};
  const upstream=http.request({hostname:'127.0.0.1',port:chat?Number(relay.port):3002,path:chat?'/api/chat':req.url,method:req.method,headers,agent:false},response=>{
   clearTimeout(connectTimer);armIdle();row.status=response.statusCode;
   const responseHeaders=Object.fromEntries(Object.entries(response.headers).filter(([name])=>!OMIT.has(name)));
   res.writeHead(response.statusCode??502,responseHeaders);
   response.on('data',chunk=>{row.responseBytes+=chunk.length;armIdle();if(row.responseBytes>32*1024*1024)abort('Response limit')});
   response.on('end',()=>finish());response.on('error',()=>abort('Upstream response interrupted'));
   response.pipe(res);
  });
  upstreams.add(upstream);upstream.on('close',()=>upstreams.delete(upstream));
  upstream.on('socket',socket=>{connectTimer=setTimeout(()=>abort('Local connect timeout'),5000);socket.once('connect',()=>{clearTimeout(connectTimer);armIdle()})});
  upstream.on('error',()=>abort('Local upstream transport failed'));
  req.on('data',chunk=>{row.requestBytes+=chunk.length;if(row.requestBytes>limit){abort('Request limit');req.destroy()}});
  req.on('aborted',()=>abort('Request body aborted'));req.on('error',()=>abort('Request body interrupted'));
  res.on('close',()=>{if(!res.writableFinished)abort('Client disconnected')});
  const totalTimer=setTimeout(()=>abort('Gateway total timeout'),130000);
  req.pipe(upstream);
 });
 server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket))});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(3000,'127.0.0.1',resolve)});
 let closing;const close=()=>closing??=(async()=>{closed=true;for(const u of upstreams)u.destroy();for(const s of sockets)s.destroy();await new Promise(resolve=>server.close(resolve))})();
 return {url:ORIGIN,reports,close};
}
