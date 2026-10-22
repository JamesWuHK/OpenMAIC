import {COPY,MINUTES,makePrompt,makeRevisionPrompt} from './content.mjs';
import {STORAGE_KEY,VIEWS,initialState,restoreState,presentationState} from './model.mjs';
import {CreatureRenderer} from './renderer.mjs';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let state=initialState(),storageProblem='',renderer;
try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){try{state=restoreState(JSON.parse(raw));}catch{storageProblem='corrupt';}}}
catch{storageProblem='saveError';}
const copy=()=>COPY[state.lang];
function save(){
  if(storageProblem!=='corrupt')try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));storageProblem='';}catch{storageProblem='saveError';}
  $('save-status').textContent=copy()[storageProblem||'saved'];
}
function field(key,label,placeholder){return `<label class="field"><span>${esc(label)}</span><textarea id="field-${key}" data-field="${key}" maxlength="240" rows="2" placeholder="${esc(placeholder)}">${esc(state[key])}</textarea></label>`;}
function checks(keys){return `<div class="checklist">${keys.map(key=>`<label><input type="checkbox" data-check="${key}" ${state[key]?'checked':''}>${esc(copy()[key])}</label>`).join('')}</div>`;}
function download(name,label){return `<a class="download" href="/assets/${name}" download>${esc(label)} ↗</a>`;}
function hint(){return `<details><summary>${esc(copy().help)}</summary><p>${esc(copy().hint)}</p></details>`;}
function showTask(){
  const c=copy(),s=c.stages[state.step];
  let body=`<p class="lead">${s[2]}</p><p class="task-note">${s[3]}</p>`;
  switch(state.step){
    case 0:body+=`<div class="output-stamp">.blend + ${Object.values(c.views).join(' / ')}<span>v01 → ${c.stages[5][0]} → v02</span></div>`;break;
    case 1:body+=`<p class="small" id="visited-views"></p>${hint()}`;break;
    case 2:body+=field('purpose',c.purpose,c.purposePh)+field('features',c.features,c.featuresPh)+`<p class="privacy">${c.privacy}</p>`;break;
    case 3:body+=hint();break;
    case 4:body+=`<p class="small">${c.roughPending}</p><h3>${c.promptTitle}</h3><p class="small">${c.promptHint}</p><pre class="prompt" id="prompt">${esc(makePrompt(state))}</pre><button id="copy-prompt" ${!state.purpose.trim()||!state.features.trim()?'disabled':''}>${c.copy}</button><p id="copy-result" role="status" class="small"></p>${checks(['draft'])}${hint()}<p class="small">${c.selfReport}</p>`;break;
    case 5:body+=field('peer',c.peer,c.peerPh)+`<p class="privacy">${c.privacy}</p><aside class="coach"><h3>${c.coach}</h3><p>${c.coachText}</p></aside>`;break;
    case 6:body+=field('reason',c.reason,c.reasonPh)+checks(['revision'])+`<p class="small">${c.selfReport}</p>${hint()}`;break;
    case 7:body+=checks(['pictures'])+`<p class="small">${c.selfReport}</p>`;break;
    case 8:body+=field('transfer',c.transfer,c.transferPh)+`<h3>${c.evidence}</h3>${checks(['draft','revision','pictures'])}<p class="small">${c.selfReport}</p><button class="primary" data-export>${c.export}</button><p class="small">${c.exportNote}</p>`;break;
  }
  $('task-panel').innerHTML=body;$('task-panel').setAttribute('aria-label',c.step);
  $('mobile-task-lead').textContent=s[2];
  $('prediction').innerHTML=state.step===3?`<fieldset><legend>${c.prediction}</legend><div class="choice-row"><button data-predict="one" aria-pressed="${state.prediction==='one'}">${c.one}</button><button data-predict="two" aria-pressed="${state.prediction==='two'}">${c.two}</button></div></fieldset>`:'';
  document.querySelector('.model-panel').classList.toggle('with-lab',[3,6].includes(state.step));
  $('previous').textContent='← '+c.prev;$('previous').disabled=state.step===0;
  $('next').textContent=state.step===8?c.end+' ↶':c.next+' →';
  $('task-title').textContent=s[1];$('step-number').textContent=String(state.step+1).padStart(2,'0');
  $('task-time').textContent=`${c.step} ${state.step+1} / 9 · ${MINUTES[state.step]} ${c.minute}`;
  if(state.step===1)updateVisited();
  showGallery();
}
function updateVisited(){if($('visited-views'))$('visited-views').textContent=`${copy().visited}: ${state.visited.map(v=>copy().views[v]).join(' · ')||'—'}`;}
function showLab(){
  const c=copy();
  const tasks=state.step===3
    ? [['ear',c.ear,c.aiEarInstruction,c.requestEar],['eye',c.eye,c.aiEyeInstruction,c.requestEye]]
    : state.step===6 ? [['revision',c.reason,c.aiRevisionInstruction,c.requestRevision]] : [];
  $('lab-controls').innerHTML=tasks.length?`<div class="lab"><p class="small">${c.aiOperatorNotice}</p>${tasks.map(([kind,title,instruction,label])=>`<section class="lab-part"><h3>${title}</h3><p class="small">${instruction}</p><button class="primary" data-ai-request="${kind}">${label}</button></section>`).join('')}<p id="ai-request-result" class="small" role="status"></p></div>`:'';
}
function showGallery(){
  const c=copy();$('gallery').hidden=state.step!==7;if(state.step!==7)return;
  $('gallery').innerHTML=`<h3 class="gallery-header">${c.photos}</h3><p class="small">${c.photosNote}</p><h3>${c.after}</h3><div class="gallery-grid">${['front','side','three-quarter'].map((view,i)=>`<figure><img src="/assets/v02-${view}.png" width="640" height="640" loading="lazy" alt="${esc(c.after+' / '+c.views[VIEWS[i]])}"><figcaption>${c.views[VIEWS[i]]}</figcaption></figure>`).join('')}</div>`;
}
function updateViews(){
  const c=copy();$('views').setAttribute('aria-label',c.view);
  // Preserve focus when switching views by updating attributes, not replacing buttons.
  for(const button of $('views').querySelectorAll('button')){
    button.textContent=c.views[button.dataset.view];button.setAttribute('aria-pressed',String(button.dataset.view===state.view));
  }
  $('fallback-image').src=`/assets/v02-${state.view==='oblique'?'three-quarter':state.view}.png`;
  $('fallback-image').alt=c.after+' / '+c.views[state.view];
  $('creature').setAttribute('aria-label',`${c.modelLabel} · ${c.views[state.view]}`);
  updateVisited();renderer.draw(presentationState(state));
}
function fallback(){
  $('creature').hidden=true;$('fallback-image').hidden=false;$('fallback-message').hidden=false;
  $('fallback-message').textContent=copy().fallback;document.querySelector('[data-copy="modelNote"]').textContent=copy().modelNote;showLab();
}
try{renderer=new CreatureRenderer($('creature'),fallback);}catch{renderer={available:false,draw(){}};}
function render(){
  const c=copy();document.documentElement.lang=state.lang;document.title=c.pageTitle;$('language').value=state.lang;
  document.querySelectorAll('[data-copy]').forEach(el=>el.textContent=c[el.dataset.copy]);
  document.querySelector('.route').setAttribute('aria-label',c.tasks);
  $('steps').innerHTML=c.stages.map((s,i)=>`<button class="route-step" data-step="${i}" ${state.step===i?'aria-current="step"':''}><span>${String(i+1).padStart(2,'0')}</span><span>${s[0]}</span></button>`).join('');
  if(!$('views').children.length)$('views').innerHTML=VIEWS.map(v=>`<button data-view="${v}"></button>`).join('');
  showTask();showLab();updateViews();if(!renderer.available)fallback();save();
}
function changeStep(step){state.step=step;render();$('task-title').focus({preventScroll:true});$('task-title').scrollIntoView({block:'start'});}
function exportRecord(){
  const payload={course:'D01-01',type:'local-practice-record-not-a-blend-file',exportedAt:new Date().toISOString(),
    evidenceBoundary:{modelReadOrVerified:false,checkboxes:'learner-self-report-only',peerText:'learner-entered-not-independently-verified',published:false},...state};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='D01-L01-my-practice.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('input',e=>{
  if(e.target.dataset.field){state[e.target.dataset.field]=e.target.value.slice(0,240);save();}
});
document.addEventListener('change',e=>{
  if(e.target.id==='language'){state.lang=e.target.value;render();}
  if(e.target.dataset.check){state[e.target.dataset.check]=e.target.checked;save();}
});
document.addEventListener('click',async e=>{
  const button=e.target.closest('button');if(!button)return;
  if(button.dataset.step!==undefined)return changeStep(Number(button.dataset.step));
  if(button.id==='previous')return changeStep(Math.max(0,state.step-1));
  if(button.id==='next')return changeStep(state.step===8?7:state.step+1);
  if(button.dataset.view){
    state.view=button.dataset.view;
    if(!state.visited.includes(state.view))state.visited.push(state.view);
    for(const el of document.querySelectorAll('.feedback'))el.textContent='';
    updateViews();save();return;
  }
  if(button.dataset.predict){state.prediction=button.dataset.predict;for(const b of document.querySelectorAll('[data-predict]'))b.setAttribute('aria-pressed',String(b.dataset.predict===state.prediction));save();return;}
  if(button.dataset.aiRequest){
    const prompt=makeRevisionPrompt(state,button.dataset.aiRequest);
    try{await navigator.clipboard.writeText(prompt);$('ai-request-result').textContent=copy().aiRequestCopied;}
    catch{$('ai-request-result').textContent=copy().aiRequestCopyFailed;}
    return;
  }
  if(button.id==='export'||button.hasAttribute('data-export'))return exportRecord();
  if(button.id==='copy-prompt'){
    try{await navigator.clipboard.writeText(makePrompt(state));$('copy-result').textContent=copy().copied;}
    catch{$('copy-result').textContent=copy().copyFailed;}
  }
});
render();
