import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(process.env.RUNNER_ENVIRONMENT,'github-hosted');
const out='artifacts/sakaguchi';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const report={stage:'INSPECTION_ONLY',releaseAccepted:false,pages:[]};
try{for(const width of [1440,390]){
 const ctx=await browser.newContext({viewport:{width,height:width===390?844:900},locale:'zh-HK'});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const url='https://class.wanli.ai/classroom/hk-nobel-07-sakaguchi-illustrated-v2';await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(12000);await page.screenshot({path:`${out}/initial-${width}.png`,fullPage:true});
 report.pages.push({width,url:page.url(),title:await page.title(),text:(await page.locator('body').innerText()).slice(0,12000),buttons:await page.locator('button').evaluateAll(es=>es.map(e=>({text:e.innerText,title:e.title,aria:e.getAttribute('aria-label'),testid:e.getAttribute('data-testid')}))),testids:await page.locator('[data-testid]').evaluateAll(es=>[...new Set(es.map(e=>e.getAttribute('data-testid')))]),errors});await ctx.close();
}}finally{await browser.close();await fs.writeFile(out+'/probe.json',JSON.stringify(report,null,2));}console.log(JSON.stringify(report));
