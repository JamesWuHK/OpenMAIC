#!/usr/bin/env node
// Lightweight remote API QA. No browser/server/build, no credentials in payloads,
// and no learner data: the source files are the original blank course templates.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const batch = '20261021-r03';
const base = 'https://class.wanli.ai';
const report = {
  testedAt: new Date().toISOString(), batch, base,
  scope: 'Remote PBL API only; not learner UI, persistence, audio, or instructional acceptance.',
  suppliedModelHeader: false,
  results: [],
};
const requested = process.argv.slice(2);
const readinessOnly = requested.includes('--readiness');
const ids = requested.filter((arg) => arg !== '--readiness');
const lessons = ids.length ? ids : readinessOnly ? ['01'] : ['01', '02', '03', '04', '05', '06'];
report.check = readinessOnly ? 'ungraded-readiness-boundary' : 'greeting';
if (lessons.some((id) => !/^0[1-6]$/.test(id))) throw new Error('Expected lesson numbers 01 to 06.');

async function request(route, payload) {
  const start = Date.now();
  let firstTokenMs = null;
  let body = '';
  try {
    const response = await fetch(`${base}/api/pbl/v2/${route}`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-language': 'zh-HK' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(55000),
    });
    const decoder = new TextDecoder();
    for await (const chunk of response.body) {
      body += decoder.decode(chunk, { stream: true });
      if (firstTokenMs === null && body.includes('event: token')) firstTokenMs = Date.now() - start;
      if (body.length > 1_000_000) throw new Error('Unexpected response size');
    }
    body += decoder.decode();
    const events = body.split(/\r?\n\r?\n/).flatMap((block) => {
      const name = block.match(/^event: (.+)$/m)?.[1];
      const data = block.match(/^data: (.+)$/m)?.[1];
      if (!name || !data) return [];
      try { return [{ name, data: JSON.parse(data) }]; } catch { return []; }
    });
    const answer = events.filter((e) => e.name === 'token').map((e) => e.data.delta ?? '').join('');
    const errors = events.filter((e) => e.name === 'error').map((e) => e.data);
    const patches = events.filter((e) => e.name === 'project_patch').map((e) => e.data.patch);
    const done = events.some((e) => e.name === 'done');
    return { status: response.status, firstTokenMs, totalMs: Date.now() - start,
      done, answer, errors, patches,
      transportPass: response.ok && done && errors.length === 0,
      teachingReplyPresent: /[\u3400-\u9fff]/u.test(answer) && answer.length > 40 && !/^User Safety:/i.test(answer),
    };
  } catch (error) {
    return { transportPass: false, firstTokenMs, totalMs: Date.now() - start, error: error.name };
  }
}

await mkdir('output/d01-cloud-qa', { recursive: true });
const reportPath = `output/d01-cloud-qa/pbl-api-${report.testedAt.replace(/[:.]/g, '-')}.json`;
for (const lesson of lessons) {
  const source = `data/classrooms/d01-${lesson}-pbl-review-${batch}.json`;
  const raw = await readFile(source, 'utf8');
  const classroom = JSON.parse(raw);
  const project = classroom.scenes.find((s) => s.type === 'pbl').content.projectV2;
  let route = 'open-task';
  let payload = { phase: 'greeting', project };
  if (readinessOnly) {
    const milestone = project.milestones.find((item) => item.curriculumStage === 'readiness-check');
    const task = milestone.microtasks[0];
    if (task.assessmentMode !== 'ungraded-reflection') throw new Error('Missing authored ungraded boundary');
    project.uiPhase = 'workspace';
    for (const item of project.milestones) {
      item.status = item.order < milestone.order ? 'completed' : item === milestone ? 'active' : 'locked';
      for (const mt of item.microtasks) mt.status = item.order < milestone.order ? 'completed' : item === milestone ? 'in_progress' : 'todo';
    }
    project.submissions.push({ id: `qa-readiness-${lesson}`, milestoneId: milestone.id, microtaskId: task.id,
      kind: 'text', content: 'QA 合成起點，非學生資料：我還未能判斷，需要更多角度與模型證據。尚未執行 Blender。',
      createdAt: new Date().toISOString() });
    route = 'evaluate';
    payload = { project, kind: 'task', milestoneId: milestone.id, microtaskId: task.id };
  }
  const result = await request(route, payload);
  const boundaryPass = readinessOnly
    ? result.transportPass && result.patches?.every((patch) => patch.kind !== 'evaluation')
    : result.transportPass && result.teachingReplyPresent;
  const row = { lesson: `D01-${lesson}`, source, sha256: createHash('sha256').update(raw).digest('hex'),
    route, ...result, boundaryPass };
  report.results.push(row);
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ lesson: row.lesson, status: row.status, firstTokenMs: row.firstTokenMs,
    totalMs: row.totalMs, transportPass: row.transportPass, teachingReplyPresent: row.teachingReplyPresent,
    boundaryPass, answerPreview: row.answer?.slice(0, 160), error: row.error }));
  if (!boundaryPass) { process.exitCode = 1; break; }
}
console.log(JSON.stringify({ reportPath, tested: report.results.length,
  apiSmokePass: report.results.length === lessons.length && report.results.every((r) => r.boundaryPass),
  fullCourseAccepted: false }));
