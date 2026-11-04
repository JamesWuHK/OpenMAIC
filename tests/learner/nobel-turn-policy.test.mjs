import test from 'node:test';
import assert from 'node:assert/strict';
import { decideNobelTurn } from '../../lib/orchestration/nobel-turn-policy.ts';
const families=['01-kagan','02-soai','03-halzen','04-deisseroth','05-hegemann','06-nagel'];
function setup(family='01-kagan'){
 const stageId=`hk-nobel-${family}-discussion-v1`;
 const agents=['student','teacher','assistant'].map(role=>({id:`${stageId}-${role}`,role}));
 return {learner:true,stageId,agents,triggerAgentId:agents[0].id,responses:[]};
}
const response=(agentId,contentPreview='A substantive answer')=>({agentId,contentPreview});
test('all six native lessons keep three authored roles then yield without LLM scheduling',()=>{
 for(const family of families){const s=setup(family);
  for(const agent of s.agents){assert.deepEqual(decideNobelTurn(s),{kind:'agent',agentId:agent.id});s.responses.push(response(agent.id));}
  assert.deepEqual(decideNobelTurn(s),{kind:'user',fromAgentId:s.agents[2].id});
 }
});
test('fresh human follow-up receives teacher answer; explicit chosen role is respected',()=>{
 const s=setup();s.triggerAgentId=null;
 assert.deepEqual(decideNobelTurn(s),{kind:'agent',agentId:s.agents[1].id});
 s.responses.push(response(s.agents[1].id));assert.equal(decideNobelTurn(s).kind,'user');
 s.triggerAgentId=s.agents[2].id;s.responses=[];
 assert.deepEqual(decideNobelTurn(s),{kind:'agent',agentId:s.agents[2].id});
});
test('one empty reply retries same role once, second fails explicitly instead of skipping required role',()=>{
 const s=setup(),id=s.agents[0].id;s.responses.push(response(id,''));
 assert.deepEqual(decideNobelTurn(s),{kind:'agent',agentId:id});
 s.responses.push(response(id,'  '));assert.equal(decideNobelTurn(s).kind,'empty-response-error');
});
test('other courses, other modes and unexpected role configurations retain existing director',()=>{
 for(const change of [{learner:false},{stageId:'hk-nobel-01-kagan-lecture-v4'},
  {stageId:'hk-nobel-07-other-discussion-v1'},{agents:setup().agents.slice(1)},
  {triggerAgentId:'unknown'}, {agents:setup().agents.map(x=>({...x,role:'teacher'}))}]){
  assert.equal(decideNobelTurn({...setup(),...change}),null);
 }
});
