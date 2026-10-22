import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restoreState,assess,recordAttempt,canReveal} from './model.mjs';
import {COPY,MINUTES,makePrompt} from './content.mjs';
test('ear: overlap, separated, wrong view, unavailable',()=>{
  const s=initialState();s.view='side';s.earY=0;assert.equal(assess(s,'ear'),'hidden');
  s.earY=-.48;assert.equal(assess(s,'ear'),'separated');
  s.view='front';assert.equal(assess(s,'ear'),'wrong-view');assert.equal(assess(s,'ear',false),'unavailable');
});
test('eye: buried, attached and too far forward are distinct',()=>{
  const s=initialState();s.view='front';s.eyeY=-.43;assert.equal(assess(s,'eye'),'hidden');
  s.eyeY=-.68;assert.equal(assess(s,'eye'),'attached');
  s.eyeY=-.98;assert.equal(assess(s,'eye'),'floating');
});
test('reference requires valid-view attempts, not necessarily right answers',()=>{
  const s=initialState();s.eyeY=-.43;recordAttempt(s,'ear');recordAttempt(s,'eye');assert.equal(canReveal(s),false);
  s.view='side';recordAttempt(s,'ear');s.view='front';recordAttempt(s,'eye');assert.equal(canReveal(s),true);
  s.eyeY=-.68;recordAttempt(s,'eye');assert.equal(s.history.at(-1).result,'attached');assert.equal(s.history.at(-2).result,'hidden');
});
test('bounded records and safe restoration',()=>{
  assert.equal(restoreState({version:2}).step,0);
  const s=restoreState({...initialState(),eyeY:-999,earY:99,lang:'zh-TW',step:99,ownEdit:'true',purpose:'a'.repeat(300),history:[{kind:'oops'}]});
  assert.equal(s.eyeY,-.98);assert.equal(s.earY,.66);assert.equal(s.lang,'zh-HK');assert.equal(s.step,8);
  assert.equal(s.ownEdit,false);assert.equal(s.purpose.length,240);assert.equal(s.history.length,0);
  for(let i=0;i<120;i++)recordAttempt(s,'eye');assert.equal(s.history.length,100);
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify(s))),s);
});
test('all three reading languages have complete, matching content keys and nine stages',()=>{
  const keys=obj=>Object.keys(obj).sort();
  assert.deepEqual(keys(COPY),['en','zh-CN','zh-HK']);
  assert.equal(MINUTES.reduce((a,b)=>a+b,0),30);
  for(const c of Object.values(COPY)){
    assert.deepEqual(keys(c),keys(COPY['zh-HK']));
    assert.deepEqual(keys(c.feedback),keys(COPY['zh-HK'].feedback));
    assert.deepEqual(keys(c.result),keys(COPY['zh-HK'].result));
    assert.equal(c.stages.length,9);assert(c.stages.every(s=>s.length===4&&s.every(t=>t.length>0)));
    assert.match(c.stages[4][3],/16/);assert.match(c.stages[6][3],/6/);
    assert.doesNotMatch(c.stages[4][3],/第 15 分鐘|15 分鐘|15 分钟|minute 15|15 minutes|30 分鐘設計|30 分钟设计/);
  }
});
test('brief uses choices and never silently supplies a final answer',()=>{
  const s=initialState();assert.equal(makePrompt(s),COPY[s.lang].promptMissing);
  s.purpose='test-purpose';s.features='test-features';
  for(const lang of Object.keys(COPY)){
    s.lang=lang;const prompt=makePrompt(s);assert(prompt.includes('test-purpose')&&prompt.includes('test-features'));
    assert(prompt.includes('v01')&&prompt.includes('v02'));
  }
});
