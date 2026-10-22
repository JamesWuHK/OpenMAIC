#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { validateScene, validateStage } from '../packages/@openmaic/dsl/dist/index.js';
import { validateD01PedagogicalSequence } from './lib/d01-sequence-contract.mjs';

const file = path.resolve(process.argv[2] ?? 'output/d01-openmaic-candidates/D01-01-local-assembled.json');
const classroom = JSON.parse(await readFile(file, 'utf8'));
const scenes = classroom.scenes ?? [];
const serializedScenes = JSON.stringify(scenes);
const serializedClassroom = JSON.stringify(classroom);
const failures = [];
const expectedTitles = ['桌面小怪獸', '怪獸收納站', '口袋秘密基地', '五秒小劇場', '影子猜謎機', '迷你奇想展'];
const types = scenes.map(({ type }) => type);
const fail = (message) => failures.push(message);
const sequenceCheck = validateD01PedagogicalSequence(scenes);
sequenceCheck.failures.forEach(fail);
const stageContract = validateStage(classroom.stage);
if (!stageContract.valid) fail(`OpenMAIC DSL rejects stage: ${JSON.stringify(stageContract.errors)}`);
for (const scene of scenes) {
  const contract = validateScene(scene);
  if (!contract.valid) fail(`OpenMAIC DSL rejects ${scene.id}: ${JSON.stringify(contract.errors)}`);
}

if (!/^[A-Za-z0-9_-]+$/.test(classroom.id ?? '') || classroom.stage?.id !== classroom.id) fail(`invalid or mismatched classroom/stage id: ${classroom.id}`);
if (!expectedTitles.includes(classroom.stage?.name)) fail(`unexpected D01 course title: ${classroom.stage?.name}`);
if (/\p{Script=Hangul}/u.test(serializedClassroom)) fail('course content contains Hangul/Korean text pollution');
if (!classroom.stage?.languageDirective?.includes('繁體中文（香港）')) fail('HK Traditional Chinese direction missing');
if (!classroom.stage?.languageDirective?.includes('學生不直接操作 Blender')) fail('student/operator boundary missing');
const conceptSlide = scenes.find((scene) => scene.id === 'd01-scene-03');
const conceptSlideText = (conceptSlide?.content?.canvas?.elements ?? []).filter(({ type }) => type === 'text').map(({ content = '' }) => content.replace(/<[^>]+>/g, '')).join('\n');
if (!conceptSlideText.includes('核心概念｜') || !conceptSlideText.includes('R｜') || !/R｜(?:Blender|PBLWorks)/.test(conceptSlideText)) fail('lesson-specific principle and attributed source boundary missing');

const agents = classroom.stage?.generatedAgentConfigs ?? [];
const student = agents.find(({ role }) => role === 'student');
const assistant = agents.find(({ role }) => role === 'assistant');
if (agents.length !== 4 || new Set(agents.map(({ name }) => name)).size !== agents.length) fail('course roles must be one coach, one non-executing operator role, and two distinct AI peers');
if (!student || !scenes.flatMap(({ actions = [] }) => actions).some(({ type, agentId }) => type === 'discussion' && agentId === student.id)) {
  fail('discussion does not reference an existing AI peer');
}
if (!assistant?.persona?.includes('本課不連接 Blender')) fail('AI operator role makes an unsupported execution claim');
if (agents.some(({ name, persona = '' }) => /[개됩않]/.test(`${name}${persona}`))) fail('agent text includes Korean corruption');

const serializedAgents = JSON.stringify([classroom.agents ?? [], agents]);
if (/在受控環境中|已建立模型|已修改模型/.test(serializedAgents)) fail('agent promises unverified tool execution');
if (!serializedScenes.includes('R｜') || !serializedScenes.includes('M｜') || !serializedScenes.includes('S｜')) fail('R/M/S evidence boundaries missing');
if (!/姓名.{0,12}學校.{0,18}帳號.{0,12}人臉.{0,12}聲音/s.test(serializedScenes)) fail('privacy guardrail missing');
if (!serializedScenes.includes('未測試')) fail('untested work is not explicitly labelled');
if (!serializedScenes.includes('同一角度') && !serializedScenes.includes('同一視角')) fail('comparison lacks controlled-view evidence');

const speechActions = scenes.flatMap(({ actions = [] }) => actions).filter(({ type }) => type === 'speech');
if (speechActions.length === 0) fail('Cantonese narration is missing');
if (!scenes[0]?.actions?.some(action => action.type === 'speech' && action.text?.includes('今堂'))) fail('PBL opening lacks a spoken project introduction');
if (new Set(speechActions.map(action => action.text)).size !== speechActions.length) fail('Repeated narration cannot substitute for phase-specific guidance');
for (const action of speechActions) {
  const mediaRef = action.audioUrl || action.audioId;
  const prefix = `/api/classroom-media/${classroom.id}/media/`;
  if (typeof mediaRef !== 'string' || !mediaRef.startsWith(prefix) || !mediaRef.endsWith('.mp3')) {
    fail(`speech action ${action.id} has no local MP3 reference`);
    continue;
  }
  const mediaPath = path.resolve(path.dirname(file), classroom.id, 'media', mediaRef.slice(prefix.length));
  try {
    await access(mediaPath);
  } catch {
    fail(`speech action ${action.id} references a missing MP3 file`);
  }
}

const interactive = scenes.filter(({ type }) => type === 'interactive');
if (interactive.length !== 6 || interactive.some(({ content }) => !content?.html?.includes('wanli-d01-v1') || !content?.html?.includes('d01Persist'))) fail('all six support interactions must use the scoped durable D01 host-storage bridge');
if (interactive.some(({ content }) => /localStorage/.test(content?.html ?? ''))) fail('D01 iframe work must not claim volatile sandbox storage is durable');
if (interactive.some(({ content }) => !content?.html?.includes('zh-HK') || !content?.html?.includes('zh-CN') || !content?.html?.includes('English'))) fail('interactive reading-language options incomplete');
if (interactive.some(({ content }) => /<script[^>]+src=|(?:cdn\.jsdelivr|unpkg\.com)|https?:\/\//i.test(content?.html ?? ''))) fail('interactive depends on a remote runtime');
if (new Set(interactive.map(({ content }) => content?.widgetConfig?.stateKey)).size !== interactive.length) fail('each PBL support interaction needs an independent persisted state key');

const quizScenes = scenes.filter(({ type }) => type === 'quiz');
const quizzes = quizScenes.flatMap(({ content }) => content?.questions ?? []);

const pblScene = scenes.find(({ type }) => type === 'pbl');
const pbl = pblScene?.content?.projectV2;
if (!pbl || pbl.milestones?.length !== 9) fail('PBL workspace must implement all nine ordered project stages');
if (!pbl?.portfolioInput || !pbl?.portfolioOutput || !pbl?.nextUse) fail('PBL portfolio chain incomplete');
if (pbl?.milestones?.some(({ microtasks = [] }) => microtasks.length === 0)) fail('PBL milestone lacks learner action');
if (pblScene?.order !== 1) fail('PBL project workspace must be directly available at course entry');
const baseline = pbl?.milestones?.find(milestone => milestone.curriculumStage === 'readiness-check');
if (!baseline?.microtasks?.every(task => task.assessmentMode === 'ungraded-reflection')) fail('Initial reflection must be recorded without model grading');
if (pbl?.milestones?.filter(milestone => milestone.curriculumStage !== 'readiness-check').some(milestone => milestone.microtasks.some(task => task.assessmentMode === 'ungraded-reflection'))) fail('Ungraded reflection must not bypass later project assessment');
if (scenes.some(({ type }) => type === 'quiz')) fail('PBL stage evidence must not be replaced by isolated quiz scenes');

for (const [index, scene] of scenes.entries()) {
  if (scene.order !== index + 1) fail(`scene ${scene.id} has a nonsequential order`);
  if (scene.stageId !== classroom.id) fail(`scene ${scene.id} references a different classroom`);
  if (scene.type === 'slide' && !scene.content?.canvas?.elements?.some(({ type }) => type === 'text')) fail(`slide ${scene.id} has no readable content`);
}

const report = {
  classroomId: classroom.id,
  title: classroom.stage?.name,
  scenes: scenes.length,
  types,
  agents: agents.map(({ name, role }) => ({ name, role })),
  interactionCount: interactive.length,
  durableD01BridgeInteractions: interactive.filter(({ content }) => content?.html?.includes('wanli-d01-v1') && content?.html?.includes('d01Persist')).length,
  quizQuestions: quizzes.length,
  pblSceneOrder: pblScene?.order ?? null,
  slideFraction: sequenceCheck.slideFraction,
  projectStages: sequenceCheck.projectStages,
  standaloneQuizCount: scenes.filter(({ type }) => type === 'quiz').length,
  pblMilestones: pbl?.milestones?.length ?? 0,
  dslContractValid: stageContract.valid && scenes.every((scene) => validateScene(scene).valid),
  passed: failures.length === 0,
  failures,
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
