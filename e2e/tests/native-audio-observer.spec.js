import {test,expect} from '@playwright/test';
import {installNativeAudioObserver} from '../../scripts/qa/native-audio-observer.mjs';

// Synthetic observer calibration only: real browser audio, zero inference/TTS.
// This is deliberately separate from native course acceptance.
function tone() {
 const samples=4000,b=Buffer.alloc(44+samples*2);
 b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);
 b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(8000,24);b.writeUInt32LE(16000,28);
 b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples*2,40);
 for(let i=0;i<samples;i++)b.writeInt16LE(Math.round(6000*Math.sin(2*Math.PI*440*i/8000)),44+i*2);
 return 'data:audio/wav;base64,'+b.toString('base64');
}
test('calibrate completed, reused, invalid and replaced real audio sources',async({page})=>{
 await page.goto('about:blank');
 await page.addScriptTag({content:`globalThis.installObserver = ${installNativeAudioObserver.toString()};`});
 await page.setContent('<button id="run">Calibrate audio observer</button>');
 await page.evaluate(src=>{
  document.querySelector('#run').onclick=()=>{globalThis.calibrationResult=(async()=>{
  const state={audio:[]};globalThis.installObserver(state,new Map([[src,{index:0,agentId:'calibration'}]]));
  const a=new Audio(src);
  const waitError=media=>new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('Expected actual media error was not observed')),5000);
   media.addEventListener('error',()=>{clearTimeout(timer);resolve(media.error?.code);},{once:true});
  });
  const playToEnd=async()=>{const done=new Promise(resolve=>a.addEventListener('ended',resolve,{once:true}));await a.play();await done;};
  await playToEnd();const completed=structuredClone(state.audio[0]);
  const cleared=waitError(a);a.src='';a.load();const clearedError=await cleared;
  const preserved=JSON.stringify(completed)===JSON.stringify(state.audio[0]);
  a.src=src;await playToEnd();
  const bad=new Audio('data:audio/wav;base64,bm90LWF1ZGlv');
  const failed=waitError(bad);
  await bad.play().catch(()=>{});await failed;
  const replaced=new Audio(src);await replaced.play();
  const replacement=waitError(replaced);
  replaced.src='data:audio/wav;base64,bm90LWF1ZGlv';replaced.load();await replacement;
  const cleanup=new Audio(src);let cleanupSnapshot;
  // Install the application handler BEFORE play installs the observer. Its
  // immediate cleanup must not run before capture-phase completion recording.
  cleanup.onended=()=>{cleanupSnapshot=structuredClone(state.audio.at(-1));cleanup.src='';cleanup.load();};
  const cleanupError=waitError(cleanup);await cleanup.play();const cleanupCode=await cleanupError;
  const cleanupPreserved=JSON.stringify(cleanupSnapshot)===JSON.stringify(state.audio.at(-1));
  return {state,preserved,clearedError,cleanupPreserved,cleanupCode,cleanupSnapshot};
  })();};
 },tone());
 await page.click('#run');
 const result=await page.evaluate(()=>globalThis.calibrationResult);
 expect(result.preserved).toBe(true);
 expect(result.clearedError).toBe(4);
 expect(result.state.audio).toHaveLength(5);
 for(const row of result.state.audio.slice(0,2)){
  expect(row.ended).toBe(true);expect(row.audible).toBe(true);expect(row.advanced).toBe(true);expect(row.error).toBeNull();
 }
 expect(result.state.audio[2].error).toBeTruthy();expect(result.state.audio[2].ended).toBe(false);
 expect(result.state.audio[3].error).toBe('source-replaced-before-completion');expect(result.state.audio[3].ended).toBe(false);
 expect(result.cleanupCode).toBe(4);expect(result.cleanupPreserved).toBe(true);
 expect(result.cleanupSnapshot.ended).toBe(true);expect(result.cleanupSnapshot.error).toBeNull();
 expect(result.state.audio[4].advanced).toBe(true);
});
