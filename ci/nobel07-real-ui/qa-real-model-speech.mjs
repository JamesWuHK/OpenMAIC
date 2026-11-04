// DRAFT: real candidate UI + fixed production chat backend + candidate speech.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
import {startRealChatRelay} from './real-chat-relay.mjs';
import {normalizeSpeechText as normalize} from './speech-text-equivalence.mjs';
import {assertChatBoundaries} from './assert-chat-boundaries.mjs';
import {startCandidateGateway} from './candidate-gateway.mjs';
assert.equal(process.env.CI,'true');
const base='http://127.0.0.1:3000',cid='hk-nobel-07-sakaguchi-lecture-v1';
const out='artifacts/nobel07-real-ui';await fs.mkdir(out,{recursive:true});
const fixture=JSON.parse(await fs.readFile('data/classrooms/'+cid+'.json','utf8'));
assert.equal(createHash('sha256').update(await fs.readFile('data/classrooms/'+cid+'.json')).digest('hex'),'2a5d774804f67bb07811b4b64ad5613c979dfd822f5b58b2981cd0a9b5e56a86');
const cases=[
 {id:'D-teacher',viewport:{width:1440,height:900},reading:'zh-Hant',voice:'yue-HK',page:2,role:'teacher',question:'請諾獎故事老師用廣東話、兩三句商場保安的比方，解釋免疫系統為甚麼也需要約束，並說明這只是比方。'},
 {id:'M-assistant',viewport:{width:390,height:844},reading:'zh-Hans',voice:'zh-CN',page:4,role:'assistant',question:'请证据小助手用广东话两三句话解释：小鼠研究是否等于已经能治好所有自身免疫病？请直接解释，不出题。'},
 {id:'D-student',viewport:{width:1440,height:900},reading:'zh-Hans',voice:'yue-HK',page:9,role:'student',question:'请好奇同学用广东话提出一个关于本课的科学疑问，不扮演真实病人。'}
];
const report={pass:false,cases:[],consoleErrors:[],pageErrors:[],limitations:['Only the three stated cases, not every viewport/language/role combination.','Actual candidate UI + production chat backend + candidate speech route.','Dynamic speech checked for Cantonese only; no Mandarin dynamic speech, human listening, Safari or physical-phone acceptance.']};
let browser,relay,gateway,currentPage,aborted=false;
const signalHandler=()=>{aborted=true;void relay?.close().catch(()=>{});void gateway?.close().catch(()=>{});void browser?.close().catch(()=>{})};
process.on('SIGTERM',signalHandler);process.on('SIGINT',signalHandler);
try{
 relay=await startRealChatRelay();gateway=await startCandidateGateway(relay.url);browser=await chromium.launch({headless:true,chromiumSandbox:true});
 for(const spec of cases){
  if(aborted)throw Error('Acceptance cancelled');relay.beginCase(spec.id);
  const result={...spec,tts:[],requestFailures:[],intentionalStops:[],pass:false};report.cases.push(result);
  const initialConsoleErrorCount=report.consoleErrors.length,initialPageErrorCount=report.pageErrors.length;
  const context=await browser.newContext({viewport:spec.viewport});
  await context.addInitScript(()=>{
   const NativeAudio=window.Audio;window.__qaDynamicAudio=[];window.__qaAudioHashes=[];const active=new Set();let serial=0;
   function ObservedAudio(...args){
    const audio=Reflect.construct(NativeAudio,args);const number=++serial;let row,currentSource;
    const observe=kind=>{
     const source=audio.currentSrc||audio.src;if(!source?.startsWith('data:audio/'))return;
     if(!row||currentSource!==source){currentSource=source;row={element:number,maxTime:0,ended:0,errors:[],overlap:false,rate:audio.playbackRate,volume:audio.volume,muted:audio.muted};window.__qaDynamicAudio.push(row);const own=row;window.__qaAudioHashes.push(crypto.subtle.digest('SHA-256',new TextEncoder().encode(source)).then(b=>{own.sourceSHA256=Array.from(new Uint8Array(b)).map(n=>n.toString(16).padStart(2,'0')).join('')}))}
     row.maxTime=Math.max(row.maxTime,audio.currentTime);row.rate=audio.playbackRate;row.volume=audio.volume;row.muted=audio.muted;
     if(kind==='playing'){active.add(audio);row.overlap ||= active.size>1}
     if(kind==='ended'){row.ended++;active.delete(audio)}
     if(kind==='pause'||kind==='error')active.delete(audio);
     if(kind==='error')row.errors.push(audio.error?.code??'unknown');
    };
    for(const kind of ['playing','timeupdate','ended','pause','error'])audio.addEventListener(kind,()=>observe(kind));return audio;
   }
   ObservedAudio.prototype=NativeAudio.prototype;Object.setPrototypeOf(ObservedAudio,NativeAudio);window.Audio=ObservedAudio;
  });
  const page=await context.newPage();currentPage=page;
  page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())});page.on('pageerror',e=>report.pageErrors.push(String(e)));
  let pendingSpeech=0;const speechJobs=[];
  page.on('requestfailed',r=>result.requestFailures.push({url:r.url(),path:new URL(r.url()).pathname,resource:r.resourceType(),at:Date.now(),error:r.failure()?.errorText}));
  page.on('request',r=>{if(new URL(r.url()).pathname==='/api/learner/speech')pendingSpeech++});
  page.on('response',response=>{
   if(new URL(response.url()).pathname!=='/api/learner/speech')return;
   const job=(async()=>{const body=response.request().postDataJSON();const record={classroomId:body.classroomId,agentId:body.agentId,text:body.text,status:response.status()};result.tts.push(record);
    try{const data=await response.json();if(!response.ok()||typeof data.base64!=='string'||!data.base64)throw Error('Speech response invalid');const url=`data:audio/${data.format||'mp3'};base64,${data.base64}`;record.sourceSHA256=createHash('sha256').update(url).digest('hex');record.audioSHA256=createHash('sha256').update(Buffer.from(data.base64,'base64')).digest('hex');record.bytes=Buffer.from(data.base64,'base64').length}catch(error){record.error=String(error.message)}finally{pendingSpeech--}})();speechJobs.push(job);
  });
  await page.goto(base+'/classroom/'+cid);const toolbar=page.getByTestId('lecture-toolbar');await toolbar.waitFor({timeout:60000});
  await toolbar.getByRole('button',{name:/^(目錄|目录|Contents)$/}).click();await page.getByRole('dialog').getByRole('button').nth(spec.page).click();await page.getByRole('dialog').waitFor({state:'hidden'});
  const host=page.locator(`iframe[title="Interactive Scene nobel07-sakaguchi-page-${String(spec.page).padStart(2,'0')}"]:visible`);await host.waitFor();const frame=await(await host.elementHandle()).contentFrame();await frame.locator('#reading').selectOption(spec.reading);await frame.locator('#voice').selectOption(spec.voice);
  await frame.locator('#play-page').click();await frame.waitForFunction(()=>{const a=document.getElementById('narration');return !a.paused&&a.currentTime>.35});
  result.intentionalStops.push({url:await frame.evaluate(()=>document.getElementById('narration').currentSrc),at:Date.now(),action:'open discussion'});
  await toolbar.getByRole('button',{name:/^(課堂提問|提问讨论|Ask and discuss)$/}).click();await frame.waitForFunction(()=>{const a=document.getElementById('narration');return a.paused&&!a.getAttribute('src')});
  await frame.evaluate(()=>{window.__qaStaticReplayCount=0;document.getElementById('narration').addEventListener('play',()=>window.__qaStaticReplayCount++)});
  const input=page.getByTestId('roundtable-non-presentation-input-stage').getByRole('textbox');await input.fill(spec.question);await input.press('Enter');
  const started=Date.now();let quietSince=0;
  while(true){
   if(aborted)throw Error('Acceptance cancelled');assert.ok(Date.now()-started<180000,'Real UI answer/speech did not finish');
   assert.equal(report.consoleErrors.length,initialConsoleErrorCount,'New browser console error during case');
   assert.equal(report.pageErrors.length,initialPageErrorCount,'New browser page error during case');
   const entries=relay.reports.filter(r=>r.case===spec.id);result.chat=entries;if(entries.some(e=>e.error))throw Error('Real chat transport failed');if(result.tts.some(t=>t.error))throw Error('Real speech failed');
   await page.evaluate(()=>Promise.allSettled(window.__qaAudioHashes));const audio=await page.evaluate(()=>window.__qaDynamicAudio);result.audio=audio;
   const allEnded=result.tts.length>0&&result.tts.every(t=>audio.filter(a=>a.sourceSHA256===t.sourceSHA256).reduce((sum,a)=>sum+a.ended,0)>=result.tts.filter(x=>x.sourceSHA256===t.sourceSHA256).length);
   const last=entries.at(-1);
   const sessionTerminated=last?.events.some(e=>e.type==='cue_user'||(e.type==='done'&&e.data.totalAgents===0));
   const uiIdle=await page.getByTestId('roundtable-non-presentation-input-stage').getAttribute('aria-busy')==='false';
   if(entries.length&&entries.every(e=>e.finishedAt&&e.events.some(v=>v.type==='done'))&&sessionTerminated&&uiIdle&&pendingSpeech===0&&allEnded){quietSince||=Date.now();if(Date.now()-quietSince>=1500){result.audio=audio;result.chat=entries;result.sessionTerminated=true;result.uiStreamingStopped=true;break}}else quietSince=0;
   await delay(100);
  }
  await Promise.all(speechJobs);assertChatBoundaries(result.chat);const expectedAgent=fixture.stage.generatedAgentConfigs.find(a=>a.role===spec.role);
  const events=result.chat.flatMap(e=>e.events),speakers=new Map();for(const e of events)if(e.type==='agent_start')speakers.set(e.data.messageId,e.data.agentId);
  const actualRoles=new Set([...speakers.values()].map(id=>fixture.stage.generatedAgentConfigs.find(a=>a.id===id)?.role));assert.ok(actualRoles.has(spec.role),'Expected role never answered through UI');
  result.renderedMessages=[];result.messageSpeechCoverage=[];
  for(const agentId of new Set(speakers.values())){
   const agent=fixture.stage.generatedAgentConfigs.find(a=>a.id===agentId);assert.ok(agent,'Unregistered responding agent');
   const messages=[...speakers].filter(([,id])=>id===agentId).map(([id])=>({messageId:id,text:events.filter(e=>e.type==='text_delta'&&e.data.messageId===id).map(e=>e.data.content??'').join('')})).filter(m=>normalize(m.text));
   if(!messages.length)continue;
   const transcript=[],bubble=[];const names=page.getByText(agent.name,{exact:true});
   for(let i=0;i<await names.count();i++){
    const name=names.nth(i);if(!await name.isVisible())continue;const parent=name.locator('xpath=..');
    const isMessage=await parent.evaluate(element=>element.classList.contains('flex-1')&&element.classList.contains('min-w-0'));
    if(isMessage){await parent.scrollIntoViewIfNeeded();const full=await parent.innerText();assert.ok(full.startsWith(agent.name));transcript.push(full.slice(agent.name.length).trim())}
    else{const paragraph=parent.locator('xpath=..').locator(':scope > p.whitespace-pre-wrap');if(await paragraph.count()&&await paragraph.first().isVisible())bubble.push(await paragraph.first().innerText())}
   }
   const actual=transcript.length?transcript:bubble;assert.equal(actual.length,messages.length,'Complete rendered role message count differs from real SSE');
   for(let i=0;i<messages.length;i++){assert.equal(normalize(actual[i]),normalize(messages[i].text),'Final full visible message differs from SSE');result.renderedMessages.push({agentId,messageId:messages[i].messageId,text:actual[i],observedAt:Date.now(),source:transcript.length?'visible-transcript':'visible-live-bubble'})}
   const spoken=result.tts.map((value,index)=>({...value,index})).filter(t=>t.agentId===agentId);let cursor=0;
   for(const message of messages){let text='',indices=[];const expectedText=normalize(message.text);while(text.length<expectedText.length&&cursor<spoken.length){const segment=spoken[cursor++];text+=normalize(segment.text);indices.push(segment.index);assert.ok(expectedText.startsWith(text),'Speech crossed message boundary or mismatched content')}assert.equal(text,expectedText,'Complete reply not covered by same-role speech');result.messageSpeechCoverage.push({agentId,messageId:message.messageId,ttsRequestIndices:indices,attribution:'derived from ordered exact text matching; request body has no messageId'})}
   assert.equal(cursor,spoken.length,'Extra same-role speech beyond rendered messages');
  }
  assert.ok(result.renderedMessages.some(m=>m.agentId===expectedAgent.id&&normalize(m.text)),'Target role has no complete visible answer');
  for(const t of result.tts){assert.equal(t.classroomId,cid);assert.ok(speakersHasAgent(t.agentId));assert.ok(t.bytes>0);assert.equal(t.status,200)}
  function speakersHasAgent(id){return [...speakers.values()].includes(id)}
  for(const audio of result.audio){assert.deepEqual(audio.errors,[]);assert.equal(audio.overlap,false);assert.equal(audio.muted,false);assert.ok(audio.volume>0&&audio.maxTime>=.35&&audio.ended>0);assert.equal(audio.rate,1)}
  assert.ok(events.filter(e=>e.type==='done').every(e=>e.data.totalActions===0),'Unexpected whiteboard/other action');
  assert.equal(new Set(result.chat.map(e=>e.requestSHA256)).size,result.chat.length,'Duplicate same chat POST');
  assert.equal(await frame.evaluate(()=>window.__qaStaticReplayCount),0,'Static narration replayed during discussion');
  await page.screenshot({path:out+'/'+spec.id+'.png',fullPage:true});
  await toolbar.getByRole('button',{name:/^(課堂提問|提问讨论|Ask and discuss)$/}).click();
  await frame.waitForFunction(()=>{const a=document.getElementById('narration');return a.paused&&!a.getAttribute('src')});
  await toolbar.getByRole('button',{name:/^(播放講解|播放讲解|Play narration)$/}).click();
  await frame.waitForFunction(()=>{const a=document.getElementById('narration');return !a.paused&&a.currentTime>.35});
  result.intentionalStops.push({url:await frame.evaluate(()=>document.getElementById('narration').currentSrc),at:Date.now(),action:'close isolated context'});
  await context.close();
  for(const failure of result.requestFailures)failure.intentionalMediaAbort=failure.resource==='media'&&failure.error==='net::ERR_ABORTED'&&result.intentionalStops.some(stop=>stop.url===failure.url&&failure.at>=stop.at-100&&failure.at<=stop.at+3000);
  assert.deepEqual(result.requestFailures.filter(f=>!f.intentionalMediaAbort),[]);
  result.pass=true;
 }
 assert.equal(report.cases.length,3);assert.ok(report.cases.every(c=>c.pass));assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.consoleErrors,[]);assert.equal(aborted,false,'Acceptance cancelled');report.pass=true;
}catch(error){report.error=String(error.stack??error);if(report.cases.length)report.cases.at(-1).pass=false;await currentPage?.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});process.exitCode=1}
finally{
 const cleanup=await Promise.allSettled([Promise.resolve().then(()=>relay?.close()),Promise.resolve().then(()=>gateway?.close()),Promise.resolve().then(()=>browser?.close())]);
 report.transportRequests=relay?.reports??[];
 report.gatewayRequests=gateway?.reports??[];
 report.cleanup=cleanup.map((value,index)=>({target:['relay','gateway','browser'][index],status:value.status,error:value.status==='rejected'?String(value.reason):undefined}));
 report.fullReleaseAccepted=false;report.unverifiedRequiredCoverage=['Dynamic speech interrupted by scene or voice switches has not been exercised by these three completion cases.'];
 if(aborted||cleanup.some(c=>c.status==='rejected')){report.pass=false;process.exitCode=1;report.cancelled=aborted}
 await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');
 if(aborted){report.pass=false;report.cancelled=true;process.exitCode=1;await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n')}
 process.removeListener('SIGTERM',signalHandler);process.removeListener('SIGINT',signalHandler);
 console.log(JSON.stringify({pass:report.pass,fullReleaseAccepted:false,cases:report.cases.length,error:report.error}));
}
