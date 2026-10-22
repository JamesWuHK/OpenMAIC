export const STORAGE_KEY = 'wanli:d01-l01:guide:v1';
export const VIEWS = ['front', 'side', 'oblique'];
export const LIMITS = { earY: [-0.66, 0.66], eyeY: [-0.98, -0.18] };
export const CHALLENGE_START = { earY: -0.28, eyeY: -0.54 };
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function initialState() {
  return { version: 2, step: 0, lang: 'zh-HK', view: 'front', earY: -0.48, eyeY: -0.68, challengeSeeded: false,
    purpose: '', features: '', prediction: '', peer: '', reason: '', transfer: '',
    draft: false, revision: false, pictures: false, ownEdit: false, history: [], visited: [] };
}
export function restoreState(value) {
  if (!value || ![1, 2].includes(value.version)) throw new Error('Unsupported record');
  const out = initialState();
  for (const key of ['purpose', 'features', 'peer', 'reason', 'transfer']) {
    if (typeof value[key] === 'string') out[key] = value[key].slice(0, 240);
  }
  if (['one', 'two'].includes(value.prediction)) out.prediction = value.prediction;
  if (['zh-HK', 'zh-CN', 'en'].includes(value.lang)) out.lang = value.lang;
  if (VIEWS.includes(value.view)) out.view = value.view;
  for (const key of Object.keys(LIMITS)) if (Number.isFinite(value[key])) out[key] = clamp(value[key], ...LIMITS[key]);
  if (Number.isInteger(value.step)) out.step = clamp(value.step, 0, 8);
  for (const key of ['draft', 'revision', 'pictures', 'ownEdit']) out[key] = value[key] === true;
  out.challengeSeeded = value.challengeSeeded === true;
  out.visited = VIEWS.filter(v => Array.isArray(value.visited) && value.visited.includes(v));
  if (Array.isArray(value.history)) out.history = value.history.filter(h => h && ['ear', 'eye'].includes(h.kind)
    && Number.isFinite(h.earY) && Number.isFinite(h.eyeY) && Number.isFinite(h.at)
    && ['hidden', 'partly-hidden', 'separated', 'floating', 'attached', 'wrong-view', 'unavailable'].includes(h.result))
    .slice(-100).map(h => ({kind: h.kind, earY: clamp(h.earY, ...LIMITS.earY), eyeY: clamp(h.eyeY, ...LIMITS.eyeY),
      result: h.result, at: h.at}));
  return out;
}
export function shapes(state) {
  const c = { teal: [0.39,0.68,0.64], peach: [1,0.66,0.43], cream: [0.98,0.94,0.81], ink: [0.045,0.18,0.22] };
  return [
    {id:'Body', p:[0,0,1.18], r:[.95,.72,1], color:c.teal},
    {id:'EarL', p:[-.43,state.earY,2.05], r:[.22,.27,.46], color:c.peach},
    {id:'EarR', p:[.43,0,2.05], r:[.27,.28,.50], color:c.peach},
    ...[-1,1].flatMap((s, i) => {
      const x = s*.34, y = i === 0 ? state.eyeY : -.68;
      return [{id:i===0?'EyeL':'EyeR', p:[x,y,1.43], r:[.25,.14,.25], color:c.cream},
        {id:i===0?'PupilL':'PupilR', p:[x+.025,y-.14,1.455], r:[.092,.055,.105], color:c.ink}];
    }),
  ];
}
// Parallel sample rays, not a complete visual-quality or collision assessment.
export function rayHit(origin, direction, shape) {
  const o = origin.map((v,i)=>(v-shape.p[i])/shape.r[i]);
  const d = direction.map((v,i)=>v/shape.r[i]);
  const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
  const a=dot(d,d), b=2*dot(o,d), c=dot(o,o)-1, disc=b*b-4*a*c;
  if (disc<0 || a===0) return Infinity;
  const roots=[(-b-Math.sqrt(disc))/(2*a),(-b+Math.sqrt(disc))/(2*a)];
  return Math.min(...roots.filter(t=>t>=0),Infinity);
}
export function firstHit(origin, direction, objects) {
  const hits=objects.map(s=>({id:s.id,t:rayHit(origin,direction,s)})).filter(h=>Number.isFinite(h.t));
  return hits.sort((a,b)=>a.t-b.t)[0]?.id ?? null;
}
export function visibleEyeFraction(state, samples=13) {
  const eyeX=-.34, pupilX=eyeX+.025, pupilY=state.eyeY-.14, pupilZ=1.455;
  const rx=.092, ry=.055, rz=.105;
  let visible=0,total=0;
  for(let ix=0;ix<samples;ix++) for(let iz=0;iz<samples;iz++) {
    const dx=-1+2*ix/(samples-1), dz=-1+2*iz/(samples-1);
    const q=dx*dx+dz*dz;
    if(q>1)continue;
    const x=pupilX+dx*rx,z=pupilZ+dz*rz;
    const bodyQ=1-(x/.95)**2-(z-1.18)**2;
    if(bodyQ<=0){visible++;total++;continue;}
    const pupilFront=pupilY-ry*Math.sqrt(1-q);
    const bodyFront=-.72*Math.sqrt(bodyQ);
    if(pupilFront<bodyFront-.006)visible++;
    total++;
  }
  return total?visible/total:0;
}
export function visibleEarFraction(state, samples=15) {
  const left={id:'EarL',p:[-.43,state.earY,2.05],r:[.22,.27,.46]},right={id:'EarR',p:[.43,0,2.05],r:[.27,.28,.50]};
  let visible=0,total=0;
  for(let iy=0;iy<samples;iy++)for(let iz=0;iz<samples;iz++){
    const dy=-1+2*iy/(samples-1),dz=-1+2*iz/(samples-1);
    if(dy*dy+dz*dz>1)continue;
    total++;
    const y=left.p[1]+dy*left.r[1],z=left.p[2]+dz*left.r[2];
    if(firstHit([5,y,z],[-1,0,0],[left,right])==='EarL')visible++;
  }
  return total?visible/total:0;
}
export function assess(state, kind, available=true) {
  if (!available) return 'unavailable';
  if (state.view !== (kind==='ear'?'side':'front')) return 'wrong-view';
  const objects=shapes(state);
  if (kind==='ear') {
    const fraction=visibleEarFraction(state);
    return fraction<.08?'hidden':fraction<.65?'partly-hidden':'separated';
  }
  const eyeVisibility=visibleEyeFraction(state);
  if(eyeVisibility<.08)return 'hidden';
  if(eyeVisibility<.65)return 'partly-hidden';
  const bodyFront=-.72*Math.sqrt(1-(-.36/.95)**2-((1.43-1.18)/1)**2);
  return state.eyeY+.14 < bodyFront-.01 ? 'floating':'attached';
}
export function recordAttempt(state, kind, available=true) {
  const result=assess(state,kind,available);
  state.history.push({kind,earY:state.earY,eyeY:state.eyeY,result,at:Date.now()});
  state.history=state.history.slice(-100);
  return result;
}
export function canReveal(state) {
  return ['ear','eye'].every(kind=>state.history.some(h=>h.kind===kind && !['wrong-view','unavailable'].includes(h.result)));
}
export function startChallenges(state) {
  if(!state.challengeSeeded){Object.assign(state,CHALLENGE_START);state.challengeSeeded=true;}
  return state;
}
export function presentationState(state) {
  // The learner page is a read-only teacher example; only AI-operated Blender
  // work may change the learner's actual model. Never render legacy slider state.
  return {...state,earY:-.48,eyeY:-.68};
}
