import {chromium} from '/qa/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { frozenClassroomMediaPaths } from './frozen-media-paths.mjs';
const base=process.env.QA_ORIGIN||'http://127.0.0.1:8127';
const mode=process.argv[2]||'ui';
const id=process.argv[3]||'hk-nobel-01-kagan-discussion-v1';
const mobile=process.argv[4]==='mobile';
const out='/task/evidence';fs.mkdirSync(out,{recursive:true});
const data=JSON.parse(fs.readFileSync('/task/candidate/classrooms/'+id+'.json'));
const record={id,base,mode,mobile,image:JSON.parse(fs.readFileSync('/task/preview.json')).image,courseSHA256:crypto.createHash('sha256').update(fs.readFileSync('/task/candidate/classrooms/'+id+'.json')).digest('hex'),startedAt:new Date().toISOString(),chat:[],speech:[],pageErrors:[],consoleErrors:[],pass:false};
record.acceptanceMatrix=process.env.QA_MATRIX||'full';
record.followupRequired=mode==='discussion'&&process.env.QA_FOLLOWUP==='1';
record.pauseResumeRequired=mode==='discussion'&&process.env.QA_PAUSE_RESUME==='1';
record.qaSHA256=crypto.createHash('sha256').update(fs.readFileSync('/task/qa.mjs')).digest('hex');
const b=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
let p;
try{
 const c=await b.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},...(mobile?{isMobile:true,hasTouch:true}:{})});
 if(process.env.QA_MEDIA_ORIGIN){
  assert.equal(process.env.QA_MEDIA_ORIGIN,'https://class.wanli.ai');
  record.mediaProxyOrigin=process.env.QA_MEDIA_ORIGIN;
  record.mediaProxyRequests=0;
  const classroomMediaPaths=frozenClassroomMediaPaths(data);
  record.frozenMediaPathCount=classroomMediaPaths.size;
  const proxyMedia=async(route,pathname)=>{
   assert(pathname.startsWith('/learner/runtime/')||classroomMediaPaths.has(pathname),'Only frozen public media may use the proxy');
   const response=await route.fetch({url:record.mediaProxyOrigin+pathname});
   assert([200,206].includes(response.status()),'Public narration/media unavailable: '+pathname);
   record.mediaProxyRequests++;
   await route.fulfill({response});
  };
  await c.route('**/learner/runtime/**',route=>proxyMedia(route,new URL(route.request().url()).pathname));
  await c.route('**/api/classroom-media/**',route=>proxyMedia(route,new URL(route.request().url()).pathname));
  await c.route('**/_next/image?**',async route=>{
   const source=new URL(route.request().url()).searchParams.get('url');
   if(source?.startsWith('/learner/runtime/')||classroomMediaPaths.has(source))return proxyMedia(route,source);
   return route.continue();
  });
 }
 await c.addInitScript(()=>{
  const state={audio:[],speech:[],chat:[]};window.__nativeQA=state;
  const sources=new Map(),fetchNative=window.fetch;
  window.fetch=async(...args)=>{
   const r=await fetchNative(...args);const url=String(args[0]?.url||args[0]);
   if(url.includes('/api/chat')){
    const row={status:r.status,at:Date.now(),replies:[],errors:[],done:false,reading:true};state.chat.push(row);
    // Decode in the browser Fetch API. CDP misdecodes charset-less SSE as Latin-1.
    r.clone().text().then(raw=>{const messages=new Map();
     for(const line of raw.split('\n').filter(x=>x.startsWith('data: '))){try{const e=JSON.parse(line.slice(6));
      if(e.type==='agent_start')messages.set(e.data.messageId,{messageId:e.data.messageId,agentId:e.data.agentId,name:e.data.agentName,text:''});
      if(e.type==='text_delta'){const m=messages.get(e.data.messageId);if(m)m.text+=e.data.content||e.data.delta||'';}
      if(e.type==='error')row.errors.push(e.data);if(e.type==='done')row.done=true;
     }catch(e){row.errors.push(String(e));}}
     row.replies=[...messages.values()].filter(m=>m.text.trim());
    }).catch(e=>row.errors.push(String(e))).finally(()=>row.reading=false);
   }
   if(url.includes('/api/learner/speech')){
    let request={};try{request=JSON.parse(args[1]?.body||'{}')}catch{}
    const row={agentId:request.agentId,text:request.text,status:r.status,index:state.speech.length};state.speech.push(row);
    if(r.ok){const d=await r.clone().json();if(d.base64)sources.set(`data:audio/${d.format||'mp3'};base64,${d.base64}`,row);}
   }return r;
  };
  (function installAudioObserver(state,sources){
 const observed=new WeakMap();
 const play=HTMLMediaElement.prototype.play;
 HTMLMediaElement.prototype.play=function(){
  // currentSrc can still describe the previous clip until native play starts.
  const src=this.src||this.currentSrc;
  const speech=sources.get(src),previous=observed.get(this);
  if(speech){window.__nativeQAMedia??=[];window.__nativeQAMedia[speech.index]=this;}
  if(!previous||previous.src!==src||previous.row.speechIndex!==(speech?.index??null)){
   if(previous)for(const [event,listener] of previous.listeners)this.removeEventListener(event,listener);
   const row={agentId:speech?.agentId||null,speechIndex:speech?.index??null,source:src.startsWith('data:')?'generated':'narration',mediaPath:src.startsWith('data:')?null:new URL(src,location.href).pathname,ended:false,error:null,advanced:false,audible:false,first:null,last:0,rate:this.playbackRate};
   state.audio.push(row);
   const sample=()=>{
    row.last=this.currentTime;row.rate=this.playbackRate;
    if(!this.paused&&!this.muted&&this.volume>0&&this.readyState>=2){
     row.audible=true;row.first??=this.currentTime;row.advanced||=this.currentTime>row.first+.15;
    }
   };
   const listeners=[['playing',sample],['timeupdate',sample],['ended',()=>{sample();row.ended=true;}],['error',()=>{row.error=this.error?.code||true;}]];
   for(const [event,listener] of listeners)this.addEventListener(event,listener);
   observed.set(this,{src,row,listeners});
  }
  return play.call(this);
 };
})(state,sources);
 });
 p=await c.newPage();p.setDefaultTimeout(30000);
 const servedResponse=await p.request.get(base+'/api/classroom?id='+id);
 assert.equal(servedResponse.status(),200);
 const served=(await servedResponse.json()).classroom;
 assert.deepEqual(served,data,'Served classroom differs from frozen candidate');
 record.servedCourseMatches=true;
 const legacyMapping=JSON.parse(fs.readFileSync('/task/payload/manifest.json')).mapping;
 const legacyEntries=Object.entries(legacyMapping).filter(([,target])=>target===id);
 assert.equal(legacyEntries.length,1,'Expected one approved legacy mapping');
 const legacy=await p.request.get(base+'/classroom/'+encodeURIComponent(legacyEntries[0][0]),{maxRedirects:0});
 record.legacyRedirect={from:legacyEntries[0][0],status:legacy.status(),location:legacy.headers().location};
 assert([200,307].includes(record.legacyRedirect.status),'Legacy page failed before navigation');
 if(record.legacyRedirect.status===307)assert.equal(new URL(record.legacyRedirect.location,base).href,base+'/classroom/'+id);

 record.previewRun=JSON.parse(fs.readFileSync('/task/preview.json'));
 assert.equal(record.previewRun.image,record.image);
 assert.match(process.env.QA_EXPECTED_IMAGE_SOURCE||'',/^[a-f0-9]{40}$/);
 assert.equal(record.previewRun.source,process.env.QA_EXPECTED_IMAGE_SOURCE);
 assert.equal(record.previewRun.origin,base);
 if(base.startsWith('http://127.0.0.1:8127'))assert.equal(record.previewRun.origin,base);
 p.on('pageerror',e=>record.pageErrors.push(e.message));
 p.on('console',m=>{if(m.type()==='error')record.consoleErrors.push(m.text())});
 await p.goto(base+'/classroom/'+encodeURIComponent(legacyEntries[0][0]),{waitUntil:'domcontentloaded',timeout:60000});
 await p.waitForURL(base+'/classroom/'+id,{waitUntil:'domcontentloaded',timeout:30000});
 record.legacyBrowserNavigationPassed=true;
 console.log(JSON.stringify({step:'navigated',id,mode,mobile,at:Date.now()}));
 await p.locator('iframe[title^="Interactive Scene"]').first().waitFor({state:'visible',timeout:60000});
 console.log(JSON.stringify({step:'classroom-visible',id,at:Date.now()}));
 record.initialText=(await p.locator('body').innerText()).slice(-4000);
 record.avatars=await p.locator('img').evaluateAll(es=>es.map(e=>e.alt));
 const inputButton=p.locator('button:not([role="tab"]):has(svg.lucide-message-square)').filter({visible:true}).last();
 record.layout=await p.evaluate(()=>({height:innerHeight,width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
 assert(record.layout.scrollWidth<=record.layout.width+1,'Horizontal overflow');
 for(const agent of data.stage.generatedAgentConfigs)assert(record.avatars.includes(agent.name),'Missing role avatar '+agent.name);
 assert.equal(await p.locator('a[href*="github.com"]').count(),0,'Author repository link visible');
 if(mode==='ui'){
  await inputButton.click();
  console.log(JSON.stringify({step:'input-button-clicked',id,at:Date.now()}));
  await p.getByPlaceholder('輸入你的訊息...',{exact:true}).waitFor({state:'visible'});
  const inputBox=await p.getByPlaceholder('輸入你的訊息...',{exact:true}).boundingBox();
  assert(inputBox&&inputBox.x>=0&&inputBox.y>=0&&inputBox.x+inputBox.width<=record.layout.width+1&&inputBox.y+inputBox.height<=record.layout.height+1,'Input outside viewport');
  await p.getByRole('button',{name:'繁',exact:true}).click();
  record.languages=await p.getByRole('menuitem').allTextContents();
  for(const language of ['繁體中文','简体中文','English'])assert(record.languages.some(x=>x.includes(language)),'Missing reading language');
  await p.keyboard.press('Escape');
  await p.screenshot({path:out+'/'+id+'-'+(mobile?'mobile':'desktop')+'-ui.png'});
 }else{
  // Navigate through the actual sidebar, then play the authored speech.
  const target=data.scenes.find(s=>s.actions.some(a=>a.type==='discussion'));
  await p.getByRole('button',{name:'Toggle sidebar',exact:true}).click();
  await p.getByTestId('scene-list').getByTestId('scene-item').filter({hasText:target.title}).click();
  const confirm=p.getByRole('button',{name:/確認|確定/});if(await confirm.isVisible().catch(()=>false))await confirm.click();
  // The desktop sidebar remains visible; close it using its actual control.
  await p.getByRole('button',{name:'Toggle sidebar',exact:true}).click();
  await p.getByRole('button',{name:'Play',exact:true}).click();
  const join=p.getByRole('button',{name:'加入討論',exact:true});
  await join.waitFor({state:'visible',timeout:120000});record.nativeInvitation=true;
  await join.click();record.joinedAt=Date.now();
  // Reveal the real chat transcript; model/audio requests are never mocked.
  const toggle=p.getByRole('button',{name:'Toggle chat',exact:true});if(await toggle.isVisible())await toggle.click();
  if(record.pauseResumeRequired){
   await p.waitForFunction(()=>window.__nativeQAMedia?.some(a=>a&&!a.paused&&!a.ended&&a.currentTime>.2&&a.duration-a.currentTime>2),{},{timeout:120000});
   const active=await p.evaluate(()=>window.__nativeQAMedia.findLastIndex(a=>a&&!a.paused&&!a.ended&&a.duration-a.currentTime>2));
   assert(active>=0,'No generated clip available for actual pause/resume');
   const bubble=p.locator('[class~="group/bubble"]').filter({visible:true}).last();
   await bubble.click();
   await p.waitForFunction(index=>window.__nativeQAMedia[index].paused,active,{timeout:5000});
   const pausedAt=await p.evaluate(index=>window.__nativeQAMedia[index].currentTime,active);
   await p.waitForTimeout(1000);
   const held=await p.evaluate(index=>({paused:window.__nativeQAMedia[index].paused,time:window.__nativeQAMedia[index].currentTime}),active);
   assert(held.paused&&Math.abs(held.time-pausedAt)<.15,'Pause did not hold the actual generated audio');
   await bubble.click();
   await p.waitForFunction(({index,time})=>{const a=window.__nativeQAMedia[index];return a&&!a.paused&&a.currentTime>time+.15},{index:active,time:pausedAt},{timeout:10000});
   record.pauseResumePassed=true;
   record.pauseResume={speechIndex:active,pausedAt,heldAt:held.time};
  }
  let stableSince=null;
  for(let i=0;i<150;i++){
   await p.waitForTimeout(2000);
   const text=await p.locator('body').innerText();
   const browserState=await p.evaluate(()=>window.__nativeQA);
   record.chat=browserState.chat;
   const replies=record.chat.flatMap(x=>x.replies);
   const audio=await p.evaluate(()=>window.__nativeQA.audio);
   if(i%10===0)console.log(JSON.stringify({progress:id,elapsed:Math.round((Date.now()-record.joinedAt)/1000),requests:record.chat.length,replies:replies.length,audio:audio.filter(x=>x.agentId).map(x=>({agent:x.agentId,ended:x.ended,error:x.error}))}));
   assert(!audio.some(x=>x.error),'Actual media playback failed during discussion');
   if(replies.length>=2&&record.chat.every(x=>!x.reading)&&text.includes('輪到你發言了')&&audio.filter(x=>x.source==='generated').length===browserState.speech.length&&audio.filter(x=>x.source==='generated').every(x=>x.ended)){stableSince??=Date.now();if(Date.now()-stableSince>5000)break}else stableSince=null;
  }
  record.transcript=(await p.locator('body').innerText()).slice(-16000);
  record.audio=await p.evaluate(()=>window.__nativeQA.audio);
  record.chat=await p.evaluate(()=>window.__nativeQA.chat);
  record.speech=await p.evaluate(()=>window.__nativeQA.speech);
  record.generatedReplies=record.chat.flatMap(x=>x.replies);
  const visible=record.transcript.replace(/\s/g,'');
  record.allGeneratedTextVisible=record.generatedReplies.every(r=>visible.includes(r.text.replace(/\s/g,'')));
  assert(record.generatedReplies.length>=2,'No multi-role reply');
  assert(new Set(record.generatedReplies.map(r=>r.agentId)).size>=2,'Only one role spoke');
  assert(record.allGeneratedTextVisible,'Generated text did not fully reach visible transcript');
  assert(record.chat.every(x=>x.status===200&&x.done&&!x.errors.length),'Chat protocol error');
  assert(record.speech.length&&record.speech.every(x=>x.status===200),'Speech request failed');
  const generatedAudio=record.audio.filter(x=>x.source==='generated');
  assert(generatedAudio.length===record.speech.length&&generatedAudio.length>0,'Generated speech/playback count mismatch');
  for(const speech of record.speech)assert(generatedAudio.some(a=>a.speechIndex===speech.index&&a.agentId===speech.agentId&&a.audible&&a.advanced&&a.ended&&!a.error),'Missing completed speech clip '+speech.index);
  const spokenCharacters=text=>text.replace(/[^\p{L}\p{N}]/gu,'');
  for(const reply of record.generatedReplies){
   const spoken=record.speech.filter(s=>s.agentId===reply.agentId).map(s=>s.text).join('');
   assert(spokenCharacters(spoken).includes(spokenCharacters(reply.text)),'Reply text not fully covered by same-role speech');
  }
  assert(!record.audio.some(x=>x.error),'Media playback error');
  assert(record.audio.every(x=>x.rate===1),'Playback speed altered');
  if(process.env.QA_FOLLOWUP==='1'){
   record.initialGeneratedReplies=record.generatedReplies;
   const prior=record.chat.length;
   const priorSpeech=record.speech.length;
   await inputButton.click();
   const input=p.getByPlaceholder('輸入你的訊息...',{exact:true});
   record.followupQuestion='請用本課一個例子，再講清楚哪些是已知、哪些仍需實驗證實？';
   await input.fill(record.followupQuestion);await input.press('Enter');
   for(let i=0;i<150;i++){
    await p.waitForTimeout(2000);const state=await p.evaluate(()=>window.__nativeQA);
    const fresh=state.chat.slice(prior);const audio=state.audio.filter(x=>x.source==='generated');
    if(fresh.some(x=>x.replies.length)&&fresh.every(x=>!x.reading)&&audio.length===state.speech.length&&audio.every(x=>x.ended)&& (await p.locator('body').innerText()).includes('輪到你發言了'))break;
   }
   const state=await p.evaluate(()=>window.__nativeQA);
   record.chat=state.chat;record.audio=state.audio;record.speech=state.speech;
   record.followupReplies=state.chat.slice(prior).flatMap(x=>x.replies);
   record.followupSpeech=state.speech.slice(priorSpeech);
   record.transcript=await p.locator('body').innerText();
   assert(record.followupReplies.length>0,'Learner follow-up produced no reply');
   assert(record.followupSpeech.length>0,'Learner follow-up produced no new speech');
   assert(record.followupReplies.every(r=>record.transcript.replace(/\s/g,'').includes(r.text.replace(/\s/g,''))),'Follow-up reply not fully displayed');
   assert(state.chat.every(x=>x.status===200&&x.done&&!x.errors.length),'Follow-up protocol failed');
   for(const s of state.speech)assert(s.status===200&&state.audio.some(a=>a.speechIndex===s.index&&a.agentId===s.agentId&&a.audible&&a.advanced&&a.ended&&!a.error),'Follow-up speech missing or unfinished');
   for(const reply of record.followupReplies)assert(spokenCharacters(record.followupSpeech.filter(s=>s.agentId===reply.agentId).map(s=>s.text).join('')).includes(spokenCharacters(reply.text)),'Follow-up text not fully covered by fresh same-role speech');
   record.followupPassed=true;
  }
  await p.screenshot({path:out+'/'+id+'-'+(mobile?'mobile':'desktop')+'-discussion.png'});
  const stop=p.getByRole('button',{name:/結束討論|結束問答/}).first();await stop.click();await stop.waitFor({state:'hidden'});record.stoppedThroughUI=true;
 }
 assert(!record.pageErrors.length,'Browser page error');
 record.pass=true;
}catch(e){record.error=e.stack||String(e);if(p){record.failureText=(await p.locator('body').innerText().catch(()=>'' )).slice(-12000);const state=await p.evaluate(()=>window.__nativeQA||{}).catch(()=>({}));record.audio=state.audio||[];record.chat=state.chat||[];record.speech=state.speech||[];await p.screenshot({path:out+'/'+id+'-'+mode+'-failure.png'}).catch(()=>{});}}
finally{record.finishedAt=new Date().toISOString();fs.writeFileSync(out+'/'+id+'-'+(mobile?'mobile':'desktop')+'-'+mode+'.json',JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({id,mode,mobile,pass:record.pass,error:record.error,generatedReplies:record.generatedReplies?.length,sourceSHA256:record.courseSHA256}));await b.close()}
if(!record.pass)process.exitCode=1;
