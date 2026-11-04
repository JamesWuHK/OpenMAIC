import * as bridge from './nobel-narration.ts';
Object.defineProperty(window,'nobel07Snapshot',{get:()=>JSON.parse(JSON.stringify(bridge.useNobelNarration.getState()))});
const course=await fetch('/classroom.json').then(r=>r.json());
const root=document.querySelector('#frames'),cache=new Map();let active=0,blocked=false;
const session=()=>bridge.setNobelNarrationSession(course.scenes[active].id,blocked,false,1);
function show(index){
 for(const [id,item] of cache){item.frame.hidden=true;bridge.setNobelNarrationFrameVisible(id,false)}
 active=index;const scene=course.scenes[index];let item=cache.get(scene.id);
 if(!item){
  const frame=document.createElement('iframe');frame.title=scene.id;frame.sandbox='allow-scripts allow-forms allow-popups';frame.style.cssText='width:100%;height:calc(100vh - 92px);border:0';
  item={frame,unbind:null};cache.set(scene.id,item);
  frame.addEventListener('load',()=>{item.unbind?.();item.unbind=bridge.bindNobelNarrationFrame(scene.id,frame.contentWindow);bridge.setNobelNarrationFrameVisible(scene.id,active===index);session()});
  frame.srcdoc=scene.content.html;root.append(frame);
 }
 // LRU cap3, as in the real pool; destroy the earliest inactive entry.
 const existing=cache.get(scene.id);cache.delete(scene.id);cache.set(scene.id,existing);
 while(cache.size>3){const [id,old]=cache.entries().next().value;old.unbind?.();old.frame.remove();cache.delete(id)}
 item.frame.hidden=false;bridge.setNobelNarrationFrameVisible(scene.id,true);session();document.querySelector('#number').textContent=String(index+1);
}
window.addEventListener('message',event=>{for(const [id] of cache)bridge.receiveNobelNarrationMessage(id,event)});
document.querySelector('#previous').onclick=()=>show(Math.max(0,active-1));
document.querySelector('#next').onclick=()=>show(Math.min(11,active+1));
document.querySelector('#play').onclick=()=>bridge.toggleNobelNarration();
document.querySelector('#discussion').onclick=()=>{blocked=!blocked;session();document.querySelector('#discussion').setAttribute('aria-pressed',String(blocked))};
bridge.useNobelNarration.subscribe(s=>{document.querySelector('#playing').textContent=String(s.playing);document.querySelector('#script').textContent=s.transcript});
show(0);
