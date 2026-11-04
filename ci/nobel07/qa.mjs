import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
assert.equal(process.env.NOBEL07_CLOUD_QA,'existing-linux-runner');
assert.notEqual(process.getuid(),0);
const root='/course',out='/reports',base='http://127.0.0.1:8127';
const expected=JSON.parse(await fs.readFile('/qa/expected.json','utf8'));
const digest=b=>createHash('sha256').update(b).digest('hex');
for(const [name,want] of Object.entries(expected.files))assert.equal(digest(await fs.readFile(path.join(root,name))),want,name);
const clips=new Map(expected.clips.map(c=>[c.file,c]));assert.equal(clips.size,50);
const report={courseZIP:expected.zipSHA256,startedAt:new Date().toISOString(),execution:'existing Linux self-hosted runner; static authored course only; no production connection',cases:[],audio:[],intentionalStops:[],consoleErrors:[],pageErrors:[],failedRequests:[],externalRequests:[],serverRequests:[],pass:false,limitations:['No human listening or speaker-output measurement.','Observed media state/progress is not verification of pronunciation or spoken content.','No OpenMAIC platform import, AI discussion, or publication tested.']};
await fs.mkdir(out,{recursive:true});
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,base);let name=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html';
  if(name==='favicon.ico'){res.writeHead(204);res.end();return;}
  assert.equal(url.origin,base);assert.ok(!name.split('/').includes('..'));assert.ok(Object.hasOwn(expected.files,name));assert.ok(['GET','HEAD'].includes(req.method));
  const bytes=await fs.readFile(path.join(root,name));const type=name.endsWith('.mp3')?'audio/mpeg':name.endsWith('.jpg')?'image/jpeg':'text/html; charset=utf-8';
  let first=0,last=bytes.length-1,status=200;const range=req.headers.range;
  if(range){const m=/^bytes=(\d+)-(\d*)$/.exec(range);assert.ok(m);first=Number(m[1]);last=m[2]?Math.min(Number(m[2]),last):last;if(first>last){res.writeHead(416,{'Content-Range':'bytes */'+bytes.length});res.end();return;}status=206;}
  const headers={'Content-Type':type,'Content-Length':String(last-first+1),'Cache-Control':'no-store','Accept-Ranges':'bytes'};if(status===206)headers['Content-Range']=`bytes ${first}-${last}/${bytes.length}`;
  report.serverRequests.push({at:Date.now(),name,status,first,last});res.writeHead(status,headers);res.end(req.method==='HEAD'?undefined:bytes.subarray(first,last+1));
 }catch(error){res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');report.serverRequests.push({at:Date.now(),error:String(error.message)});}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(8127,'127.0.0.1',resolve);});
let browser;
async function writeReport(){await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
try{
 browser=await chromium.launch({headless:true,chromiumSandbox:true,ignoreDefaultArgs:['--mute-audio'],timeout:45000});report.browserVersion=browser.version();
 for(const viewport of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},serviceWorkers:'block'});
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===base)return route.continue();report.externalRequests.push({url:u.href});return route.abort('blockedbyclient');});
  await context.addInitScript(()=>{window.__nobel07MediaEvents=[];for(const type of ['loadstart','loadedmetadata','canplay','playing','pause','waiting','stalled','suspend','ended','error','emptied','abort'])document.addEventListener(type,event=>{const a=event.target;if(!(a instanceof HTMLMediaElement))return;const log=window.__nobel07MediaEvents;log.push({at:Date.now(),performanceNow:performance.now(),visibility:document.visibilityState,type,src:a.currentSrc||a.src,time:a.currentTime,duration:a.duration,paused:a.paused,ended:a.ended,ready:a.readyState,error:a.error?.code||null});if(log.length>500)log.shift();},true);});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push({viewport:viewport.name,text:m.text()});});page.on('pageerror',e=>report.pageErrors.push({viewport:viewport.name,message:e.message}));
  page.on('requestfailed',request=>report.failedRequests.push({viewport:viewport.name,at:Date.now(),url:request.url(),resource:request.resourceType(),error:request.failure()?.errorText}));
  await page.goto(base,{waitUntil:'networkidle'});assert.equal(await page.locator('.slide').count(),1);
  async function snapshot(){return page.locator('#narration').evaluate(a=>({wallTime:Date.now(),performanceNow:performance.now(),visibility:document.visibilityState,src:a.currentSrc||a.src,time:a.currentTime,duration:a.duration,paused:a.paused,ended:a.ended,muted:a.muted,volume:a.volume,rate:a.playbackRate,ready:a.readyState,networkState:a.networkState,seeking:a.seeking,loop:a.loop,buffered:Array.from({length:a.buffered.length},(_,i)=>[a.buffered.start(i),a.buffered.end(i)]),error:a.error?{code:a.error.code,message:a.error.message}:null}));}
  async function stop(){const s=await snapshot();report.intentionalStops.push({at:Date.now(),url:s.src,viewport:viewport.name,action:'Stop audio button'});await page.locator('#stop-audio').click();await page.waitForFunction(()=>{const a=document.getElementById('narration');return a.paused&&!a.getAttribute('src');});}
  async function navigate(n){let old=Number((await page.locator('#counter').textContent()).split('/')[0]);while(old!==n){await page.locator(old<n?'#next':'#prev').click();old=Number((await page.locator('#counter').textContent()).split('/')[0]);}assert.equal(old,n);}
  async function layout(){const d=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,inner:innerWidth}));assert.ok(d.doc<=d.inner+1&&d.body<=d.inner+1,'Horizontal overflow '+JSON.stringify(d));}
  async function play(button,file,full=false){
   const clip=clips.get(file);assert.ok(clip,'Unknown audio '+file);const startedAt=Date.now();
   const responsePromise=page.waitForResponse(r=>new URL(r.url()).pathname==='/'+file&&[200,206].includes(r.status()),{timeout:15000});
   await button.click();const response=await responsePromise;assert.match(response.headers()['content-type']||'',/^audio\/mpeg/);
   await page.waitForFunction(file=>{const a=document.getElementById('narration');return a.currentSrc.endsWith('/'+file)&&a.currentTime>=.35&&!a.paused&&!a.muted&&a.volume>0&&a.playbackRate===1&&a.readyState>=2&&!a.error;},file,{timeout:15000});
   const progressed=await snapshot();assert.ok(Math.abs(progressed.duration-clip.durationSeconds)<.25,'Duration mismatch');
   const record={viewport:viewport.name,reading:await page.locator('#reading').inputValue(),voice:await page.locator('#voice').inputValue(),file,expectedSHA256:clip.sha256,status:response.status(),contentType:response.headers()['content-type'],startedAt,progressed,fullCompletionRequired:full,stopMode:full?'native ended':'explicit UI stop after progress',checkPassed:false,samples:[]};report.audio.push(record);
   let timer;
   try{
    if(full){timer=setInterval(()=>{void snapshot().then(value=>record.samples.push({at:Date.now(),...value})).catch(()=>{});},1000);await page.waitForFunction(()=>{const a=document.getElementById('narration');return a.ended&&a.currentTime>=a.duration-.1&&!a.error;},null,{timeout:Math.ceil((clip.durationSeconds+15)*1000)});}
    record.final=await snapshot();assert.equal(record.final.error,null);assert.equal(record.final.rate,1);assert.equal(record.final.muted,false);if(full)assert.equal(record.final.ended,true);
    await stop();record.checkPassed=true;
   }catch(error){record.failureSnapshot=await snapshot().catch(()=>null);record.mediaEvents=await page.evaluate(()=>window.__nobel07MediaEvents).catch(()=>[]);throw error;}finally{if(timer)clearInterval(timer);}
  }
  for(const reading of ['zh-Hant','zh-Hans']){
   await page.locator('#reading').selectOption(reading);assert.equal(await page.locator('html').getAttribute('lang'),reading);
   for(let n=1;n<=12;n++){
    await navigate(n);assert.equal(await page.locator('.slide h1').innerText(),expected.reading[reading][n-1].h1);assert.ok(!(await page.locator('body').innerText()).includes('阪口'));await layout();
    for(const voice of ['zh-CN','yue-HK']){
     await page.locator('#voice').selectOption(voice);
     const full=viewport.name==='desktop'&&reading==='zh-Hant'&&[1,6,12].includes(n);
     await play(page.locator('#play-page'),`audio/${voice}/page-${String(n).padStart(2,'0')}.mp3`,full);
     report.cases.push({kind:'page-language-voice',viewport:viewport.name,reading,voice,page:n,pass:true});
     if(n===2){
      for(const choice of ['A','B']){
       await page.locator(`[data-vote="${choice}"]`).click();assert.equal(await page.locator(`[data-vote="${choice}"]`).getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#vote-feedback').innerText(),expected.voteFeedback[reading][choice==='A'?0:1]);
       await play(page.locator('[data-read-vote]'),`audio/${voice}/vote-${choice.toLowerCase()}.mp3`);
      }
     }
     if(n===11){
      for(let q=0;q<3;q++){
       const field=page.locator('fieldset').nth(q);await play(field.locator('.clip-button').first(),`audio/${voice}/q-${q+1}.mp3`);
       const options=field.locator('[data-feedback]');for(let a=0;a<await options.count();a++){
        await options.nth(a).click();assert.equal(await options.nth(a).getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#feedback-'+q).innerText(),expected.reading[reading][10].feedback[String(q)][a]);
        await play(field.locator('[data-read-feedback]'),`audio/${voice}/q-${q+1}-${String.fromCharCode(97+a)}.mp3`);
       }
      }
      const other=reading==='zh-Hant'?'zh-Hans':'zh-Hant';await page.locator('#reading').selectOption(other);
      for(let q=0;q<3;q++){const buttons=page.locator('fieldset').nth(q).locator('[data-feedback]');const last=await buttons.count()-1;assert.equal(await buttons.nth(last).getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#feedback-'+q).innerText(),expected.reading[other][10].feedback[String(q)][last]);}
      await page.locator('#reading').selectOption(reading);
     }
    }
    if([1,5,11].includes(n))await page.screenshot({path:path.join(out,`${viewport.name}-${reading}-page-${n}.png`),fullPage:true});
   }
  }
  // Explicitly interrupt active narration through the real voice and page controls.
  await navigate(3);await page.locator('#voice').selectOption('zh-CN');await page.locator('#play-page').click();await page.waitForFunction(()=>document.getElementById('narration').currentTime>.35);
  const beforeReading=await snapshot();const otherReading=(await page.locator('#reading').inputValue())==='zh-Hant'?'zh-Hans':'zh-Hant';await page.locator('#reading').selectOption(otherReading);await page.waitForFunction(previous=>document.getElementById('narration').currentTime>previous+.25,beforeReading.time);const afterReading=await snapshot();assert.equal(afterReading.src,beforeReading.src);assert.equal(afterReading.paused,false);assert.equal(await page.locator('#voice').inputValue(),'zh-CN');report.cases.push({kind:'reading-change-preserves-active-audio',viewport:viewport.name,before:beforeReading,after:afterReading,pass:true});
  report.intentionalStops.push({at:Date.now(),url:(await snapshot()).src,viewport:viewport.name,action:'Voice selector'});await page.locator('#voice').selectOption('yue-HK');await page.waitForFunction(()=>{const a=document.getElementById('narration');return a.paused&&!a.getAttribute('src');});
  await page.locator('#play-page').click();await page.waitForFunction(()=>document.getElementById('narration').currentTime>.35);report.intentionalStops.push({at:Date.now(),url:(await snapshot()).src,viewport:viewport.name,action:'Next page'});await page.locator('#next').click();await page.waitForFunction(()=>{const a=document.getElementById('narration');return a.paused&&!a.getAttribute('src');});
  await context.close();report.cases.push({kind:'active-voice-and-navigation-stop',viewport:viewport.name,pass:true});await writeReport();
 }
 assert.equal(report.cases.filter(c=>c.kind==='page-language-voice').length,96);
 assert.ok(report.audio.every(a=>a.checkPassed));const seen=new Set(report.audio.map(a=>a.file));assert.deepEqual([...seen].sort(),[...clips.keys()].sort());
 assert.equal(report.audio.filter(a=>a.fullCompletionRequired&&a.final.ended).length,6);
 for(const failure of report.failedRequests)failure.intentionalMediaAbort=failure.error==='net::ERR_ABORTED'&&failure.resource==='media'&&report.intentionalStops.some(s=>s.url===failure.url&&s.viewport===failure.viewport&&failure.at>=s.at-100&&failure.at<=s.at+3000);
 assert.deepEqual(report.failedRequests.filter(f=>!f.intentionalMediaAbort),[]);assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.externalRequests,[]);
 report.pass=true;report.uniqueAudioFilesObserved=seen.size;report.audioPlaybackCount=report.audio.length;
}catch(error){report.error=String(error.stack||error);process.exitCode=1;}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));report.finishedAt=new Date().toISOString();await writeReport();console.log(JSON.stringify({pass:report.pass,error:report.error,cases:report.cases.length,audioPlays:report.audio.length,uniqueAudio:report.uniqueAudioFilesObserved}));}
