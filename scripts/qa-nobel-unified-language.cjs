const { chromium } = require('@playwright/test');
const fs = require('fs'), path = require('path'), assert = require('assert/strict'), http = require('http'), https = require('https');
const bases = ['01-kagan-illustrated-v2','02-soai-illustrated-v2','03-halzen-illustrated-v2','04-deisseroth-illustrated-v2','05-hegemann-illustrated-v2','06-nagel-illustrated-v2','07-sakaguchi-illustrated-v2','08-hassabis-illustrated-v1'].map(x=>'hk-nobel-'+x);
const seed = JSON.parse(fs.readFileSync('e2e/fixtures/nobel-interaction/hk-nobel-02-soai-lecture-v4.json'));
let serveLifecycle = false;
function course(id) {
  const c = structuredClone(seed.classroom || seed), cn = id.endsWith('-mandarin');
  c.id = c.stage.id = id;
  c.stage.name = 'Synthetic paired language test';
  c.scenes = [1,2,3].map(order=>({ ...c.scenes[0], id:id+'-scene-'+order, stageId:id, outlineId:id+'-outline-'+order, order,
    title:(cn?'Mandarin':'Cantonese')+' page '+order, type:'interactive',
    content:{type:'interactive',html:'<!doctype html><html><body>Language navigation fixture</body></html>'},
    actions:[{id:id+'-speech-'+order,type:'speech',text:cn?'普通話測試。':'粵語測試。',audioId:'/api/classroom-media/'+id+'/voice.wav',audioUrl:'/api/classroom-media/'+id+'/voice.wav'}],
  }));
  if (serveLifecycle && id === bases[0]) {
    // This old ordinary-lecture seed intentionally has no discussion action.
    // Define the native synthetic action explicitly, as in qa-discussion-context.
    c.scenes[0].actions = [{id:'language-lifecycle-discussion',type:'discussion',agentId:'default-1',topic:'Synthetic lifecycle',prompt:'Synthetic test only'}];
  }
  c.outlines = c.scenes.map(s=>({id:s.outlineId,order:s.order,title:s.title,type:'interactive',description:'synthetic fixture'}));
  return c;
}
function wav() {
  const size=16000*2*12,b=Buffer.alloc(44+size);b.write('RIFF');b.writeUInt32LE(36+size,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(16000,24);b.writeUInt32LE(32000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(size,40);return b;
}
(async()=>{
  const upstream=process.env.LEARNER_QA_BASE_URL||process.env.PRIVATE_BASE;
  const report={revision:process.env.GITHUB_SHA||process.env.CANDIDATE_REVISION,syntheticCourses:true,syntheticAudio:true,modelCalls:0,requests:[],runs:[],directEntries:[],lifecycleRuns:[],syntheticChatRequests:[],errors:[],pass:false};
  const proxy=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://qa').pathname;
    if (/^\/api\/chat(?:\/pi)?$/.test(pathname) && serveLifecycle) {
      const chunks=[];req.on('data',b=>chunks.push(b));req.on('end',()=>{
        const body=JSON.parse(Buffer.concat(chunks).toString()),agentId=body.config?.agentIds?.[0]||'default-1';
        const row={startedAt:Date.now(),closedAt:null,bytes:0,synthetic:true};report.syntheticChatRequests.push(row);
        res.writeHead(200,{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-cache'});
        const send=e=>{const wire='data: '+JSON.stringify(e)+'\n\n';row.bytes+=Buffer.byteLength(wire);res.write(wire)};
        send({type:'agent_start',data:{agentId,agentName:'Synthetic teacher',messageId:'lifecycle',agentAvatar:'',agentColor:'#123456'}});
        send({type:'text_delta',data:{messageId:'lifecycle',content:'Synthetic open stream.'}});
        const timer=setInterval(()=>res.write(': heartbeat\n\n'),500);
        res.on('close',()=>{clearInterval(timer);row.closedAt=Date.now()});
      });return;
    }
    const url=new URL(req.url,upstream),client=url.protocol==='https:'?https:http;
    const q=client.request(url,{method:req.method,headers:{...req.headers,host:url.host}},out=>{res.writeHead(out.statusCode,out.headers);out.pipe(res)});
    q.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end()});res.on('close',()=>{if(!res.writableEnded)q.destroy()});req.pipe(q);
  });
  await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+proxy.address().port;
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  let activePage;
  try {
    for(const phone of [false,true]) {
      const ctx=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1280,height:800},isMobile:phone,hasTouch:phone});
      await ctx.addInitScript(()=>{if(window!==window.top)return;localStorage.setItem('locale',localStorage.getItem('locale')||'ja-JP');window.__languageMedia=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__languageMedia.push({source:this.currentSrc||this.src,event:'play'});return play.apply(this,args)};});
      const page=await ctx.newPage();activePage=page;page.on('pageerror',error=>report.errors.push(String(error)));
      await ctx.route('**/api/classroom?id=*',async route=>{
        const id=new URL(route.request().url()).searchParams.get('id');
        if(bases.some(b=>id===b||id===b+'-mandarin')){report.requests.push({id});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,classroom:course(id)})})}
        return route.continue();
      });
      await ctx.route('**/api/classroom-media/*/voice.wav',route=>route.fulfill({status:200,contentType:'audio/wav',body:wav()}));
      await ctx.route(/\/api\/(?:chat(?:\/pi)?|transcription|learner\/speech)(?:\?|$)/,route=>{if(serveLifecycle&&/\/api\/chat(?:\/pi)?$/.test(new URL(route.request().url()).pathname))return route.continue();report.modelCalls++;return route.abort()});
      const choose=async(name)=>{await page.getByRole('button',{name:/^(語言與講解|语言与讲解|Language and narration)$/}).click();await page.getByRole('menuitem',{name,exact:true}).click()};
      const at=async(id,title)=>{await page.waitForURL(u=>u.pathname==='/classroom/'+id&&!u.searchParams.has('nobelScene'),{timeout:60000});await page.getByRole('heading',{name:title,exact:true}).waitFor({timeout:60000});};
      // Direct Mandarin entry must defeat a previously stored unsupported UI.
      await page.goto(base+'/classroom/'+bases[0]+'-mandarin',{waitUntil:'domcontentloaded'});
      await at(bases[0]+'-mandarin','Mandarin page 1');
      await page.waitForFunction(()=>localStorage.getItem('locale')==='zh-CN');
      assert.equal((await page.evaluate(()=>window.__languageMedia)).length,0,'direct entry autoplayed');
      report.directEntries.push({viewport:phone?'phone':'desktop',initialLocale:'ja-JP',mandarinAligned:true,noAutoplay:true});
      // Keep a real native discussion SSE open, then change language. The
      // local synthetic upstream must see the old connection close.
      serveLifecycle=true;
      await page.goto(base+'/classroom/'+bases[0],{waitUntil:'domcontentloaded'});
      await at(bases[0],'Cantonese page 1');
      const mute=page.getByRole('button',{name:'Mute',exact:true}).first();if(await mute.count())await mute.click();
      await page.getByRole('button',{name:'Play',exact:true}).first().click();
      await page.getByRole('button',{name:/^(加入討論|加入讨论|Join discussion|Join Discussion)$/}).click();
      await page.getByRole('button',{name:/^(結束討論|结束讨论|End discussion|End Discussion)$/}).waitFor({timeout:30000});
      for(let n=0;n<100&&!report.syntheticChatRequests.at(-1)?.bytes;n++)await page.waitForTimeout(50);
      const connection=report.syntheticChatRequests.at(-1);assert.ok(connection?.bytes>0&&!connection.closedAt);
      await choose('简体中文');await at(bases[0]+'-mandarin','Mandarin page 1');
      for(let n=0;n<50&&!connection.closedAt;n++)await page.waitForTimeout(100);
      assert.ok(connection.closedAt,'old native SSE did not close after counterpart navigation');
      assert.equal((await page.evaluate(()=>window.__languageMedia)).length,0,'language switch autoplayed');
      report.lifecycleRuns.push({viewport:phone?'phone':'desktop',oldNativeSSEClosed:true,documentReplaced:true,noTargetAutoplay:true,connection});
      serveLifecycle=false;
      const unmute=page.getByRole('button',{name:'Unmute',exact:true}).first();if(await unmute.count())await unmute.click();
      for(const id of bases){
        await page.goto(base+'/classroom/'+id,{waitUntil:'domcontentloaded'});
        await at(id,'Cantonese page 1');
        await page.getByRole('button',{name:'Next scene',exact:true}).first().click();
        await page.getByRole('heading',{name:'Cantonese page 2',exact:true}).waitFor();
        const oldPlay=page.getByRole('button',{name:'Play',exact:true}).first();if(await oldPlay.count())await oldPlay.click();
        await page.waitForFunction(id=>window.__languageMedia.some(x=>x.source.includes('/'+id+'/voice.wav')),id);
        await choose('简体中文');await at(id+'-mandarin','Mandarin page 2');
        assert.equal((await page.evaluate(()=>window.__languageMedia)).length,0,'counterpart autoplayed');
        assert.equal(await page.evaluate(()=>localStorage.getItem('locale')),'zh-CN');
        await page.getByRole('button',{name:'Play',exact:true}).first().click();
        await page.waitForFunction(id=>window.__languageMedia.some(x=>x.source.includes('/'+id+'/voice.wav')),id+'-mandarin');
        const cnMedia=await page.evaluate(()=>window.__languageMedia);
        assert.ok(cnMedia.every(x=>x.source.includes('/'+id+'-mandarin/')));
        const before=page.url();
        await page.getByRole('button',{name:'语言与讲解',exact:true}).click();
        await page.getByText('UI only · Mandarin narration',{exact:true}).waitFor();
        await page.getByRole('menuitem',{name:'English',exact:true}).click();
        assert.equal(page.url(),before);assert.equal(await page.evaluate(()=>localStorage.getItem('locale')),'en-US');
        const beforeEnglishPlay=(await page.evaluate(()=>window.__languageMedia)).length;
        const pause=page.getByRole('button',{name:'Pause',exact:true}).first();if(await pause.count())await pause.click();
        await page.getByRole('button',{name:'Play',exact:true}).first().click();
        await page.waitForFunction(n=>window.__languageMedia.length>n,beforeEnglishPlay);
        const englishMedia=await page.evaluate(()=>window.__languageMedia);
        assert.ok(englishMedia.every(x=>x.source.includes('/'+id+'-mandarin/')),'English changed narration');
        await choose('繁體中文');await at(id,'Cantonese page 2');
        assert.equal(await page.evaluate(()=>localStorage.getItem('locale')),'zh-TW');
        const play=page.getByRole('button',{name:'Play',exact:true}).first();if(await play.count())await play.click();
        await page.waitForFunction(id=>window.__languageMedia.some(x=>x.source.includes('/'+id+'/voice.wav')),id);
        const yueMedia=await page.evaluate(()=>window.__languageMedia);assert.ok(yueMedia.every(x=>x.source.includes('/'+id+'/')));
        const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(layout.scroll<=layout.width+1,'horizontal overflow');
        report.runs.push({layout,viewport:phone?'phone':'desktop',id,sceneOrderPreserved:2,mandarinUIAndAudio:true,cantoneseUIAndAudio:true,englishUIOnly:true,oneTimeSceneHintConsumed:true,targetNoAutoplay:true,englishMedia,cnMedia,yueMedia,pass:true});
      }
      await ctx.close();
    }
    assert.equal(report.errors.length,0);assert.equal(report.modelCalls,0);assert.equal(report.runs.length,16);assert.equal(report.lifecycleRuns.length,2);report.pass=true;
  }catch(error){report.failure=String(error);process.exitCode=1;if(activePage&&!activePage.isClosed()){report.failureUI=await activePage.locator('body').innerText().catch(()=>null);fs.mkdirSync('artifacts/learner-image-qa',{recursive:true});await activePage.screenshot({path:'artifacts/learner-image-qa/unified-language-failure.png',fullPage:true}).catch(()=>{})}}finally{await browser.close();proxy.closeAllConnections();await new Promise(resolve=>proxy.close(resolve));http.globalAgent.destroy();https.globalAgent.destroy();fs.mkdirSync('artifacts/learner-image-qa',{recursive:true});fs.writeFileSync('artifacts/learner-image-qa/unified-language.json',JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,failure:report.failure,runs:report.runs.length,modelCalls:report.modelCalls,errors:report.errors}));}
})();
