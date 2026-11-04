// Self-contained so Playwright can serialize this into the page. This observes
// real playback; it neither changes the sound nor supplies speech responses.
export function installNativeAudioObserver(state, sources, Media = HTMLMediaElement, now = () => performance.timeOrigin + performance.now()) {
 const observed = new WeakMap();
 const play = Media.prototype.play;
 Media.prototype.play = function () {
  const src = this.src || this.currentSrc;
  const speech = sources.get(src), previous = observed.get(this);
  if (speech) { globalThis.__nativeQAMedia ??= []; globalThis.__nativeQAMedia[speech.index] = this; }
  // A completed element may replay the SAME source. A new play is a new row.
  if (!previous || previous.row.ended || previous.row.error || previous.src !== src || previous.row.speechIndex !== (speech?.index ?? null)) {
   previous?.detach();
   const row = {agentId:speech?.agentId || null, speechIndex:speech?.index ?? null,
    source:src.startsWith('data:')?'generated':'narration',
    mediaPath:src.startsWith('data:')?null:new URL(src,globalThis.location?.href || 'http://localhost').pathname,
    ended:false,error:null,advanced:false,audible:false,first:null,last:0,rate:this.playbackRate,
    playRequestedAt:now(),firstAudibleAt:null,endedAt:null,pausedIntervals:[]};
   state.audio.push(row);
   let pausedAt = null;
   const matches = () => {
    if ((this.src || this.currentSrc) === src) return true;
    row.error='source-replaced-before-completion';detach();return false;
   };
   const sample = () => {
    if (!matches()) return;
    row.last=this.currentTime;row.rate=this.playbackRate;
    if (!this.paused && !this.muted && this.volume>0 && this.readyState>=2) {
     row.audible=true;row.first??=this.currentTime;row.firstAudibleAt??=now();
     row.advanced ||= this.currentTime > row.first+.15;
    }
   };
   const resume = () => { if(pausedAt!==null){row.pausedIntervals.push({start:pausedAt,end:now()});pausedAt=null;} sample(); };
   const finish = error => {
    if (!matches()) return;
    sample();
    if(error)row.error=this.error?.code || true;
    else {row.ended=true;row.endedAt=now();}
    // Clearing/reusing the element after completion must not rewrite history.
    detach();
   };
   const listeners = [['playing',()=>{if(matches())resume();}],['timeupdate',sample],
    ['pause',()=>{if(matches()&&!this.ended)pausedAt??=now();}],['ended',()=>finish(false)],['error',()=>finish(true)]];
   const detach = () => {for(const [event,listener] of listeners)this.removeEventListener(event,listener);};
   for(const [event,listener] of listeners)this.addEventListener(event,listener);
   observed.set(this,{src,row,detach});
  }
  return play.call(this);
 };
}

export function summarizeNativeLatency(state) {
 const generated=state.audio.filter(x=>x.source==='generated');
 const actions=state.actions || [];
 return {
  clock:'performance.timeOrigin + performance.now(), milliseconds',
  actions:actions.map((action,i)=>{
   const next=actions[i+1]?.at ?? Infinity;
   const chats=state.chat.filter(x=>x.requestedAt>=action.at&&x.requestedAt<next);
   const firstText=chats.map(x=>x.firstTextAt).filter(Number.isFinite).sort((a,b)=>a-b)[0];
   const firstSound=generated.map(x=>x.firstAudibleAt).filter(x=>Number.isFinite(x)&&x>=action.at&&x<next).sort((a,b)=>a-b)[0];
   return {kind:action.kind,at:action.at,firstTextMs:firstText===undefined?null:firstText-action.at,
    firstSoundMs:firstSound===undefined?null:firstSound-action.at};
  }),
  chats:state.chat.map(x=>({requestedAt:x.requestedAt,headersMs:x.at-x.requestedAt,
   firstTextMs:Number.isFinite(x.firstTextAt)?x.firstTextAt-x.requestedAt:null,
   completeMs:Number.isFinite(x.completedAt)?x.completedAt-x.requestedAt:null})),
  speech:state.speech.map(x=>({index:x.index,agentId:x.agentId,
   responseMs:Number.isFinite(x.readyAt)?x.readyAt-x.requestedAt:null})),
  gaps:generated.slice(1).map((clip,i)=>{
   const prior=generated[i];
   return {fromSpeech:prior.speechIndex,toSpeech:clip.speechIndex,
    sameRole:prior.agentId===clip.agentId,
    // Explicit user follow-up think time is not an inter-segment stall.
    crossesUserAction:actions.some(x=>x.at>prior.endedAt&&x.at<=clip.firstAudibleAt),
    ms:Number.isFinite(prior.endedAt)&&Number.isFinite(clip.firstAudibleAt)?clip.firstAudibleAt-prior.endedAt:null};
  }),
  intentionalPauses:generated.flatMap(x=>x.pausedIntervals || []),
  note:'Audible means browser playing, unmuted, volume > 0, readyState >= 2; not a human listening assessment.'
 };
}

// Initial engineering targets, not a provider SLA. A slower functional run is
// retained as evidence but cannot establish the user's fluency requirement.
export function assessNativeLatency(latency, followupRequired) {
 const targets={firstTextMs:3000,firstSoundMs:5000,segmentGapMs:1000,roleGapMs:2000};
 const failures=[];
 for(const kind of followupRequired?['join','followup']:['join']){
  const actions=latency.actions.filter(x=>x.kind===kind);
  if(!actions.length)failures.push({kind,reason:'missing actual user action timestamp'});
  for(const action of actions)for(const metric of ['firstTextMs','firstSoundMs']){
   if(!Number.isFinite(action[metric])||action[metric]>targets[metric])failures.push({kind,metric,actualMs:action[metric],targetMs:targets[metric]});
  }
 }
 for(const gap of latency.gaps){
  if(gap.crossesUserAction)continue;
  const targetMs=gap.sameRole?targets.segmentGapMs:targets.roleGapMs;
  if(!Number.isFinite(gap.ms)||gap.ms>targetMs)failures.push({...gap,targetMs});
 }
 return {targets,passed:failures.length===0,failures,
  scope:'Observed runs only; insufficient samples to claim production p95. First text is received SSE, first sound is browser playback state.'};
}
