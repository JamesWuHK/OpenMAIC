import {test} from 'node:test';
import assert from 'node:assert/strict';
import {knownNobelMisconceptions} from '../../scripts/qa/nobel-known-misconception.mjs';
const id='hk-nobel-01-kagan-discussion-v1';
test('the actual rejected directional smell/drug claims cannot pass QA unnoticed',()=>{
 const text='薄荷味係左手手性，葛縷子味係右手手性。左手可能較安全或有效，右手可能無效或有副作用，所以分子形狀決定藥物或香料嘅性質。';
 assert.equal(knownNobelMisconceptions(id,[{text,agentId:'teacher'}]).length,4);
});
test('corrective boundary is allowed; unchanged other lessons retain their review scope',()=>{
 assert.deepEqual(knownNobelMisconceptions(id,[{text:'不能單憑左右方向判斷藥物是否安全，需要具體實驗及臨床證據。'}]),[]);
 assert.deepEqual(knownNobelMisconceptions('other',[{text:'左手可能較安全或有效'}]),[]);
});
