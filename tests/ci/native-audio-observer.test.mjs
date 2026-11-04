import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installNativeAudioObserver,summarizeNativeLatency,assessNativeLatency} from '../../scripts/qa/native-audio-observer.mjs';

function fixture() {
 class Media extends EventTarget {
  src='data:audio/mp3;base64,calibration'; currentTime=0; playbackRate=1;
  paused=false; muted=false; volume=1; readyState=4; ended=false; error=null;
  play(){return Promise.resolve();}
  emit(type){this.dispatchEvent(new Event(type));}
 }
 let clock=1000;const state={audio:[],speech:[],chat:[],actions:[]};
 const sources=new Map([['data:audio/mp3;base64,calibration',{index:0,agentId:'teacher'}]]);
 installNativeAudioObserver(state,sources,Media,()=>clock++);
 return {state,a:new Media()};
}
test('completion freezes valid evidence when src is cleared and emits error4',async()=>{
 const {state,a}=fixture();await a.play();a.emit('playing');a.currentTime=.3;a.emit('timeupdate');
 a.ended=true;a.emit('ended');const completed=structuredClone(state.audio[0]);
 a.src='';a.currentTime=0;a.error={code:4};a.emit('error');a.emit('timeupdate');
 assert.deepEqual(state.audio[0],completed);assert.equal(completed.advanced,true);assert.equal(completed.ended,true);
});
test('fluency fails closed on missing metrics or slow sound; user think time is excluded',()=>{
 const good={actions:[{kind:'join',firstTextMs:500,firstSoundMs:1500}],gaps:[{ms:800,sameRole:true,crossesUserAction:false},{ms:40000,sameRole:false,crossesUserAction:true}]};
 assert.equal(assessNativeLatency(good,false).passed,true);
 assert.equal(assessNativeLatency(good,true).passed,false);
 assert.equal(assessNativeLatency({...good,actions:[{kind:'join',firstTextMs:500,firstSoundMs:9000}]},false).passed,false);
 assert.equal(assessNativeLatency({...good,actions:[]},false).passed,false);
});
test('real error before completion remains a failure',async()=>{
 const {state,a}=fixture();await a.play();a.error={code:4};a.emit('error');
 assert.equal(state.audio[0].error,4);assert.equal(state.audio[0].ended,false);
});
test('source replacement before completion never looks like successful playback',async()=>{
 const {state,a}=fixture();await a.play();a.emit('playing');
 a.src='data:audio/mp3;base64,other';a.emit('playing');a.emit('ended');
 assert.equal(state.audio[0].error,'source-replaced-before-completion');assert.equal(state.audio[0].ended,false);
});
test('same-source replay creates new evidence, pause/resume keeps one segment',async()=>{
 const {state,a}=fixture();await a.play();a.emit('playing');a.paused=true;a.emit('pause');
 await a.play();a.paused=false;a.emit('playing');assert.equal(state.audio.length,1);
 assert.equal(state.audio[0].pausedIntervals.length,1);
 a.ended=true;a.emit('ended');a.ended=false;a.currentTime=0;await a.play();a.emit('playing');
 assert.equal(state.audio.length,2);assert.equal(state.audio[1].ended,false);
});
test('latency separates user think time, headers, first text, sound, and TTS',()=>{
 const state={actions:[{kind:'join',at:100},{kind:'followup',at:2000}],
 chat:[{requestedAt:110,at:120,firstTextAt:300,completedAt:400},{requestedAt:2010,at:2020,firstTextAt:2100,completedAt:2150}],
 speech:[{index:0,agentId:'a',requestedAt:300,readyAt:500}],
 audio:[{source:'generated',speechIndex:0,agentId:'a',firstAudibleAt:510,endedAt:1000},
 {source:'generated',speechIndex:1,agentId:'b',firstAudibleAt:2300,endedAt:2500}]};
 const latency=summarizeNativeLatency(state);
 assert.equal(latency.actions[0].firstTextMs,200);assert.equal(latency.actions[0].firstSoundMs,410);
 assert.equal(latency.actions[1].firstTextMs,100);assert.equal(latency.actions[1].firstSoundMs,300);
 assert.equal(latency.gaps[0].crossesUserAction,true);assert.equal(latency.speech[0].responseMs,200);
 assert.equal(latency.chats[0].headersMs,10);assert.equal(latency.chats[0].firstTextMs,190);
});
