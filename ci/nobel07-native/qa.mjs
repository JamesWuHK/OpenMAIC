import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {chromium} from 'playwright';
assert.equal(process.env.NOBEL07_CLOUD_QA,'existing-linux-runner');assert.notEqual(process.getuid(),0);
const root='/course',out='/reports',base='http://127.0.0.1:8127',expected=JSON.parse(await fs.readFile('/qa/expected.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');for(const [name,want] of Object.entries(expected.files))assert.equal(sha(await fs.readFile(path.join(root,name))),want);
await build({entryPoints:['/qa/host-entry.js'],outfile:'/tmp/host.js',bundle:true,format:'esm',platform:'browser'});
const prefix='/api/classroom-media/'+expected.courseId+'/';const clips=new Map(expected.clips.map(c=>[c.file,c]));
const report={pass:false,cases:[],audio:[],consoleErrors:[],pageErrors:[],failedRequests:[],externalRequests:[],serverRequests:[],intentionalStops:[],limitations:['Sandboxed native-adapter harness uses the actual narration store and generated twelve iframe scenes. It is not the React/OpenMAIC application or a production deployment.','No actual AI discussion/reply or same-role generated speech tested. Discussion button exercises the narration block only.','No human listening, physical phone, Safari or pronunciation acceptance.']};
const host='<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0}header{height:88px}button{padding:10px}iframe[hidden]{display:none}</style><header><button id="previous">上一页</button><span id="number"></span><button id="next">下一页</button><button id="play">播放／暂停</button><button id="discussion" aria-pressed="false">讨论</button><output id="playing"></output><details><summary>讲稿</summary><p id="script"></p></details></header><main id="frames"></main><script type="module" src="/host.js"></script></html>';
const server=http.createServer(async(req,res)=>{try{
 let name=decodeURIComponent(new URL(req.url,base).pathname);if(name==='/favicon.ico'){res.writeHead(204).end();return}
 let bytes,type;if(name==='/'){bytes=Buffer.from(host);type='text/html; charset=utf-8'}else if(name==='/host.js'){bytes=await fs.readFile('/tmp/host.js');type='text/javascript'}else{if(name.startsWith(prefix))name=name.slice(prefix.length);else name=name.replace(/^\//,'');assert.ok(Object.hasOwn(expected.files,name));bytes=await fs.readFile(path.join(root,name));type=name.endsWith('.mp3')?'audio/mpeg':name.endsWith('.jpg')?'image/jpeg':'application/json'}
 let first=0,last=bytes.length-1,status=200;if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);assert.ok(m);first=+m[1];last=m[2]?Math.min(+m[2],last):last;assert.ok(first<=last);status=206}
 const headers={'Content-Type':type,'Content-Length':last-first+1,'Cache-Control':'no-store','Accept-Ranges':'bytes'};if(status===206)headers['Content-Range']=`bytes ${first}-${last}/${bytes.length}`;
 report.serverRequests.push({name,status});res.writeHead(status,headers);res.end(bytes.subarray(first,last+1));
 }catch(e){report.serverRequests.push({error:String(e)});res.writeHead(404).end('Not found')}});
await new Promise(r=>server.listen(8127,'127.0.0.1',r));let browser;
const save=()=>fs.writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');
try{
 browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});report.browserVersion=browser.version();
 for(const viewport of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});const page=await context.newPage();
  page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())});page.on('pageerror',e=>report.pageErrors.push(String(e)));page.on('requestfailed',r=>report.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));page.on('request',r=>{if(new URL(r.url()).origin!==base)report.externalRequests.push(r.url())});
  await page.goto(base);let frame;
  async function navigate(n){let current=Number(await page.locator('#number').textContent());while(current!==n){await page.locator(n>current?'#next':'#previous').click();current=Number(await page.locator('#number').textContent())}await page.locator('iframe:not([hidden])').waitFor();frame=await (await page.locator('iframe:not([hidden])').elementHandle()).contentFrame();await frame.locator('#reading').waitFor();await frame.waitForFunction(()=>nativeActive);}
  async function snap(){return frame.evaluate(()=>{const a=document.getElementById('narration');return{src:a.currentSrc,time:a.currentTime,duration:a.duration,paused:a.paused,ended:a.ended,muted:a.muted,rate:a.playbackRate,error:a.error?.code??null}})}
  async function stop(){await frame.locator('#stop-audio').click();await frame.waitForFunction(()=>document.getElementById('narration').paused)}
  async function play(button,file,full=false){
   const clip=clips.get(file);assert.ok(clip);const responsePromise=page.waitForResponse(r=>new URL(r.url()).pathname===prefix+file&&[200,206].includes(r.status()));await button.click();const response=await responsePromise;assert.match(response.headers()['content-type'],/^audio\/mpeg/);
   await frame.waitForFunction(file=>{const a=document.getElementById('narration');return a.currentSrc.endsWith('/'+file)&&a.currentTime>=.35&&!a.paused&&!a.muted&&a.volume>0&&a.playbackRate===1&&!a.error},file,{timeout:15000});
   const record={viewport:viewport.name,file,reading:await frame.locator('#reading').inputValue(),voice:await frame.locator('#voice').inputValue(),expectedSHA256:clip.sha256,status:response.status(),progressed:await snap(),fullCompletionRequired:full,checkPassed:false};report.audio.push(record);
   if(full)await frame.waitForFunction(()=>{const a=document.getElementById('narration');return a.ended&&a.currentTime>=a.duration-.1&&!a.error},null,{timeout:Math.ceil((clip.durationSeconds+15)*1000)});
   record.final=await snap();assert.equal(record.final.error,null);if(full)assert.equal(record.final.ended,true);await stop();record.checkPassed=true;
  }
  await navigate(1);await page.locator('#play').click();await frame.waitForFunction(()=>document.getElementById('narration').currentTime>.35&&!document.getElementById('narration').paused,null,{timeout:15000});await stop();report.cases.push({kind:'fresh-frame-parent-play-button',viewport:viewport.name,pass:true});
  for(const reading of ['zh-Hant','zh-Hans'])for(let n=1;n<=12;n++){
   await navigate(n);await frame.locator('#reading').selectOption(reading);await frame.waitForFunction(x=>document.documentElement.lang===x,reading);assert.equal(await frame.locator('.slide h1').innerText(),expected.reading[reading][n-1].h1);
   assert.ok(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   for(const voice of ['zh-CN','yue-HK']){
    await frame.locator('#voice').selectOption(voice);await page.waitForFunction(()=>document.querySelector('#script').textContent.length>0);
    await play(frame.locator('#play-page'),`audio/${voice}/page-${String(n).padStart(2,'0')}.mp3`,viewport.name==='desktop'&&reading==='zh-Hant'&&[1,6,12].includes(n));
    assert.equal(await page.locator('#script').textContent(),await frame.locator('#spoken-text').textContent());report.cases.push({kind:'page-language-voice',viewport:viewport.name,reading,voice,page:n,pass:true});
    if(n===2)for(const choice of ['A','B']){await frame.locator(`[data-vote="${choice}"]`).click();assert.equal(await frame.locator('#vote-feedback').textContent(),expected.voteFeedback[reading][choice==='A'?0:1]);await play(frame.locator('[data-read-vote]'),`audio/${voice}/vote-${choice.toLowerCase()}.mp3`)}
    if(n===11)for(let q=0;q<3;q++){const field=frame.locator('fieldset').nth(q);await play(field.locator('.clip-button').first(),`audio/${voice}/q-${q+1}.mp3`);const buttons=field.locator('[data-feedback]');for(let a=0;a<await buttons.count();a++){await buttons.nth(a).click();assert.equal(await frame.locator('#feedback-'+q).textContent(),expected.reading[reading][10].feedback[String(q)][a]);await play(field.locator('[data-read-feedback]'),`audio/${voice}/q-${q+1}-${String.fromCharCode(97+a)}.mp3`)}}
   }
   if([1,5,11].includes(n))await page.screenshot({path:`${out}/${viewport.name}-${reading}-${n}.png`,fullPage:true});
  }
  // Eviction/reload preserves actual answers and reading/voice preferences via the host store.
  await navigate(11);await frame.locator('fieldset').first().locator('[data-feedback]').nth(1).click();await navigate(2);await navigate(11);assert.equal(await frame.locator('fieldset').first().locator('[data-feedback]').nth(1).getAttribute('aria-pressed'),'true');assert.equal(await frame.locator('#reading').inputValue(),'zh-Hans');assert.equal(await frame.locator('#voice').inputValue(),'yue-HK');report.cases.push({kind:'LRU-answer-and-preference-restore',viewport:viewport.name,pass:true});
  await navigate(3);await page.locator('#play').click();await frame.waitForFunction(()=>document.getElementById('narration').currentTime>.35);assert.equal(await page.locator('#playing').textContent(),'true');
  const before=await snap();await frame.locator('#reading').selectOption('zh-Hant');await frame.waitForFunction(t=>document.getElementById('narration').currentTime>t+.25,before.time);assert.equal((await snap()).src,before.src);report.cases.push({kind:'reading-preserves-audio',viewport:viewport.name,pass:true});
  await page.locator('#discussion').click();await frame.waitForFunction(()=>document.getElementById('narration').paused&&!document.getElementById('narration').getAttribute('src'));await frame.locator('#play-page').click();await page.locator('#play').click();assert.equal((await snap()).paused,true);assert.equal(await page.locator('#playing').textContent(),'false');await page.locator('#discussion').click();report.cases.push({kind:'discussion-stops-and-blocks-both-controls',viewport:viewport.name,pass:true});
  await page.locator('#play').click();await frame.waitForFunction(()=>document.getElementById('narration').currentTime>.35);await frame.locator('#voice').selectOption('zh-CN');assert.equal((await snap()).paused,true);await page.waitForFunction(()=>document.querySelector('#script').textContent.includes('免疫'));
  await page.locator('#play').click();await frame.waitForFunction(()=>document.getElementById('narration').currentTime>.35);const old=frame;await page.locator('#next').click();await old.waitForFunction(()=>document.getElementById('narration').paused&&!document.getElementById('narration').getAttribute('src'));report.cases.push({kind:'voice-and-keepalive-scene-stop',viewport:viewport.name,pass:true});
  // A parent-window spoof has the wrong MessageEvent.source and cannot set the voice.
  await navigate(4);const sourceProof=await page.evaluate(()=>new Promise(resolve=>{
   const before={voice:window.nobel07Snapshot.voice,reading:window.nobel07Snapshot.reading};
   const barrier=event=>{if(event.source===window&&event.data?.type==='nobel07-test-barrier'){window.removeEventListener('message',barrier);resolve({before,after:{voice:window.nobel07Snapshot.voice,reading:window.nobel07Snapshot.reading}})}};
   window.addEventListener('message',barrier);window.postMessage({type:'nobel:narration-preferences',sceneId:'nobel07-sakaguchi-page-04',voice:'yue-HK',reading:'zh-Hans'},'*');window.postMessage({type:'nobel07-test-barrier'},'*');
  }));assert.deepEqual(sourceProof.after,sourceProof.before);assert.equal(await frame.locator('#voice').inputValue(),sourceProof.before.voice);assert.equal(await frame.locator('#reading').inputValue(),sourceProof.before.reading);report.cases.push({kind:'wrong-source-preference-rejected',viewport:viewport.name,...sourceProof,pass:true});
  await context.close();await save();
 }
 assert.equal(report.cases.filter(c=>c.kind==='page-language-voice').length,96);assert.equal(report.audio.length,200);assert.ok(report.audio.every(a=>a.checkPassed));const seen=new Set(report.audio.map(a=>a.file));assert.deepEqual([...seen].sort(),[...clips.keys()].sort());assert.equal(report.audio.filter(a=>a.fullCompletionRequired&&a.final.ended).length,6);assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.externalRequests,[]);assert.deepEqual(report.failedRequests,[]);
 report.pass=true;report.uniqueAudioFilesObserved=seen.size;
}catch(e){report.error=String(e.stack||e);process.exitCode=1}finally{await browser?.close();await new Promise(r=>server.close(r));await save();console.log(JSON.stringify({pass:report.pass,error:report.error,cases:report.cases.length,audio:report.audio.length}))}
