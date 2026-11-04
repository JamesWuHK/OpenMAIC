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
await new Promise(r=>server.listen(8127,'127.0.0.1',r));let browser,lastPage,lastFrame;
const save=()=>fs.writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');
try{
 const proof=JSON.parse(await fs.readFile('/qa/closure-proof.json','utf8'));
 const priorRaw=await fs.readFile('/qa/prior-run-report.json'),receiptRaw=await fs.readFile('/qa/prior-run-receipt.json');
 assert.equal(sha(priorRaw),proof.priorReportSHA256);assert.equal(sha(receiptRaw),proof.priorReceiptSHA256);
 assert.equal(sha(await fs.readFile('/qa/expected.json')),proof.expectedJSONSHA256);assert.equal(sha(await fs.readFile('/qa/nobel-narration.ts')),proof.storeSHA256);assert.equal(expected.zipSHA256,proof.courseZipSHA256);
 const prior=JSON.parse(priorRaw),receipt=JSON.parse(receiptRaw);assert.equal(prior.pass,false);assert.equal(receipt.pass,false);assert.equal(receipt.githubSHA,proof.priorSource);assert.equal(receipt.inputManifestSHA256,proof.priorInputManifestSHA256);assert.equal(receipt.imageId,proof.priorBrowserImageId);assert.deepEqual(receipt.cleanupErrors,[]);
 const matrix=prior.cases.filter(c=>c.kind==='page-language-voice');assert.equal(matrix.length,96);assert.ok(matrix.every(c=>c.pass===true));
 const keys=new Set(matrix.map(c=>JSON.stringify([c.viewport,c.reading,c.voice,c.page])));assert.equal(keys.size,96);
 for(const v of ['desktop','mobile'])for(const reading of ['zh-Hant','zh-Hans'])for(const voice of ['zh-CN','yue-HK'])for(let n=1;n<=12;n++)assert.ok(keys.has(JSON.stringify([v,reading,voice,n])));
 assert.equal(prior.audio.length,200);assert.equal(new Set(prior.audio.map(a=>a.file)).size,50);
 for(const a of prior.audio){const clip=clips.get(a.file);assert.ok(clip);assert.equal(a.expectedSHA256,clip.sha256);assert.equal(clip.sha256,expected.files[a.file]);assert.equal(a.checkPassed,true);assert.ok([200,206].includes(a.status));assert.equal(a.progressed.paused,false);assert.equal(a.progressed.muted,false);assert.equal(a.progressed.rate,1);assert.equal(a.progressed.error,null);assert.ok(a.progressed.time>=.35);}
 for(const file of clips.keys()){const rows=prior.audio.filter(a=>a.file===file);assert.equal(rows.length,4);assert.equal(new Set(rows.map(a=>a.viewport+'/'+a.reading)).size,4);}
 const ends=prior.audio.filter(a=>a.fullCompletionRequired);assert.equal(ends.length,6);for(const a of ends){assert.equal(a.final.ended,true);assert.ok(a.final.time>=a.final.duration-.1);assert.equal(a.final.error,null);}
 for(const name of ['consoleErrors','pageErrors','failedRequests','externalRequests'])assert.deepEqual(prior[name],[]);
 report.limitations.push('Matrix 96, audio 200 and six natural ends are reused from the pinned prior run of the exact unchanged course; this run performs only targeted closure tests.');report.cases=prior.cases;report.audio=prior.audio;report.newClipStarts=[];report.reusedEvidence={...proof,priorRunError:prior.error};
 browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});assert.equal(browser.version(),prior.browserVersion);report.browserVersion=browser.version();
 for(const viewport of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});const page=await context.newPage();lastPage=page;
  page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())});page.on('pageerror',e=>report.pageErrors.push(String(e)));page.on('requestfailed',r=>report.failedRequests.push({url:r.url(),error:r.failure()?.errorText,resource:r.resourceType(),at:Date.now(),viewport:viewport.name}));page.on('request',r=>{if(new URL(r.url()).origin!==base)report.externalRequests.push(r.url())});
  await page.goto(base);for(let n=0;n<2;n++)await page.locator('#next').click();
  const handle=await page.locator('iframe[title="nobel07-sakaguchi-page-03"]:visible').elementHandle();const frame=await handle.contentFrame();lastFrame=frame;
  await frame.waitForFunction(()=>typeof nativeActive!=='undefined'&&nativeActive&&!nativeBlocked);
  await frame.locator('#voice').selectOption('zh-CN');const file='audio/zh-CN/page-03.mp3';const responsePromise=page.waitForResponse(r=>new URL(r.url()).pathname===prefix+file&&[200,206].includes(r.status()));await page.locator('#play').click();const response=await responsePromise;assert.match(response.headers()['content-type'],/^audio\/mpeg/);
  await frame.waitForFunction(()=>{const a=document.getElementById('narration');return a.currentTime>=.35&&!a.paused&&!a.muted&&a.volume>0&&a.playbackRate===1&&!a.error},null,{timeout:15000});
  const before=await frame.evaluate(()=>new Promise(resolve=>{window.__closurePlayCount=0;window.__closurePlay=()=>window.__closurePlayCount++;const a=document.getElementById('narration');a.addEventListener('play',window.__closurePlay);window.__closureRAF=0;window.__closureRAFRunning=true;const tick=()=>{window.__closureRAF++;if(window.__closureRAFRunning)requestAnimationFrame(tick)};requestAnimationFrame(tick);requestAnimationFrame(()=>requestAnimationFrame(()=>resolve({src:a.currentSrc,time:a.currentTime,paused:a.paused,rate:a.playbackRate,muted:a.muted,raf:window.__closureRAF})))}));
  report.newClipStarts.push({viewport:viewport.name,file,status:response.status(),before,expectedSHA256:clips.get(file).sha256});
  const start=Date.now();report.intentionalStops.push({url:before.src,at:start,viewport:viewport.name,action:'Hide old frame through native next button'});await page.locator('#next').click();
  // Hidden frames may stop RAF: poll the same real condition with a timer.
  await frame.waitForFunction(()=>{const a=document.getElementById('narration');return !nativeActive&&a.paused&&!a.getAttribute('src')},null,{polling:100,timeout:5000});
  const stoppedAfterMs=Date.now()-start;assert.ok(stoppedAfterMs<=5000);assert.equal(frame.isDetached(),false);assert.equal(await page.locator('iframe[title="nobel07-sakaguchi-page-03"]').getAttribute('hidden'),'');
  const hiddenProof=await frame.evaluate(()=>new Promise(resolve=>{const a=document.getElementById('narration');let bad=false,samples=0;const start=performance.now(),rafBefore=window.__closureRAF;const timer=setInterval(()=>{samples++;bad ||= nativeActive||!a.paused||a.currentTime>0||!!a.getAttribute('src');if(performance.now()-start>=1000){clearInterval(timer);a.removeEventListener('play',window.__closurePlay);window.__closureRAFRunning=false;resolve({bad,played:window.__closurePlayCount,samples,observedMs:performance.now()-start,rafBefore,rafAfter:window.__closureRAF,paused:a.paused,srcAttribute:a.getAttribute('src'),time:a.currentTime,active:nativeActive,error:a.error?.code??null})}},50)}));
  assert.equal(hiddenProof.bad,false);assert.equal(hiddenProof.played,0);assert.equal(hiddenProof.error,null);report.cases.push({kind:'targeted-hidden-iframe-stop',viewport:viewport.name,stoppedAfterMs,...hiddenProof,pass:true});
  const activeHandle=await page.locator('iframe[title="nobel07-sakaguchi-page-04"]:visible').elementHandle();const active=await activeHandle.contentFrame();lastFrame=active;await active.waitForFunction(()=>typeof nativeActive!=='undefined'&&nativeActive);
  const sourceProof=await page.evaluate(()=>new Promise(resolve=>{const before={voice:window.nobel07Snapshot.voice,reading:window.nobel07Snapshot.reading};const barrier=e=>{if(e.source===window&&e.data?.type==='nobel07-closure-barrier'){window.removeEventListener('message',barrier);resolve({before,after:{voice:window.nobel07Snapshot.voice,reading:window.nobel07Snapshot.reading}})}};window.addEventListener('message',barrier);window.postMessage({type:'nobel:narration-preferences',sceneId:'nobel07-sakaguchi-page-04',voice:'yue-HK',reading:'zh-Hans'},'*');window.postMessage({type:'nobel07-closure-barrier'},'*')}));
  assert.deepEqual(sourceProof.after,sourceProof.before);assert.equal(await active.locator('#voice').inputValue(),sourceProof.before.voice);assert.equal(await active.locator('#reading').inputValue(),sourceProof.before.reading);report.cases.push({kind:'targeted-wrong-source-rejected',viewport:viewport.name,...sourceProof,pass:true});
  await page.screenshot({path:`${out}/${viewport.name}-closure.png`,fullPage:true});await context.close();
 }
 assert.equal(report.cases.filter(c=>c.kind==='targeted-hidden-iframe-stop'&&c.pass).length,2);assert.equal(report.cases.filter(c=>c.kind==='targeted-wrong-source-rejected'&&c.pass).length,2);
 for(const f of report.failedRequests)f.intentionalMediaAbort=f.resource==='media'&&f.error==='net::ERR_ABORTED'&&report.intentionalStops.some(s=>s.url===f.url&&s.viewport===f.viewport&&f.at>=s.at-100&&f.at<=s.at+3000);
 assert.deepEqual(report.failedRequests.filter(f=>!f.intentionalMediaAbort),[]);assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.externalRequests,[]);
 report.pass=true;report.verdict='PASS_COMPOSITE_SAME_COURSE_HASH_WITH_TARGETED_RECHECK';report.uniqueAudioFilesObserved=50;
}catch(e){report.error=String(e.stack||e);report.failureSnapshot=await lastFrame?.evaluate(()=>{const a=document.getElementById('narration');return{active:typeof nativeActive==='undefined'?null:nativeActive,blocked:typeof nativeBlocked==='undefined'?null:nativeBlocked,src:a?.currentSrc,srcAttribute:a?.getAttribute('src'),time:a?.currentTime,paused:a?.paused,error:a?.error?.code}}).catch(()=>null);process.exitCode=1}
finally{await browser?.close();await new Promise(r=>server.close(r));await save();console.log(JSON.stringify({pass:report.pass,verdict:report.verdict,error:report.error,cases:report.cases.length,reusedAudioChecks:report.audio.length,newClipStarts:report.newClipStarts?.length}))}
