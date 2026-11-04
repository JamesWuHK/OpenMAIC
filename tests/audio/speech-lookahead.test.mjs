import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSpeechLookahead} from '../../lib/audio/speech-lookahead.ts';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};

test('one next clip warms during playback and is consumed without a duplicate request',async()=>{
 const calls=[];const cache=createSpeechLookahead({key:x=>x,load:async(item)=>{calls.push(item);return item+' audio';}});
 cache.warm('next');cache.warm('next');await tick();
 assert.deepEqual(calls,['next']);assert.equal(await cache.read('next',new AbortController().signal),'next audio');
 assert.deepEqual(calls,['next']);
});
test('superseded queued clip is aborted and cannot become the new clip',async()=>{
 const calls=[];const cache=createSpeechLookahead({key:x=>x,load:async(item,signal)=>{calls.push([item,signal]);return item;}});
 cache.warm('old');await tick();cache.warm('new');await tick();
 assert.equal(calls[0][1].aborted,true);assert.equal(await cache.read('new',new AbortController().signal),'new');
});
test('cleanup prevents queued work from starting and rejects late results even if loader ignores abort',async()=>{
 const work=deferred();let calls=0;
 const cache=createSpeechLookahead({key:x=>x,load:async()=>{calls++;return work.promise;}});
 cache.warm('not-started');cache.clear();await tick();assert.equal(calls,0);
 cache.warm('old');await tick();const read=cache.read('old',new AbortController().signal);
 cache.clear();
 assert.equal(await Promise.race([read.then(()=>false,error=>error.name==='AbortError'),tick().then(()=>false)]),true);
 work.resolve('stale audio');await assert.rejects(read,{name:'AbortError'});
});
test('caller abort settles immediately while loader ignores cancellation',async()=>{
 const work=deferred();const cache=createSpeechLookahead({key:x=>x,load:()=>work.promise});
 const controller=new AbortController();const read=cache.read('clip',controller.signal);await tick();
 controller.abort();await assert.rejects(read,{name:'AbortError'});work.resolve('late');await tick();
});
test('prefetch failure is preserved for the actual consumer without unhandled rejection',async()=>{
 const failure=new Error('real TTS failure');const cache=createSpeechLookahead({key:x=>x,load:async()=>{throw failure;}});
 cache.warm('clip');await tick();await assert.rejects(cache.read('clip',new AbortController().signal),error=>error===failure);
});
