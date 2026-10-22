#!/usr/bin/env node
// Synthetic API contract test against an already-running, isolated CI image.
// The container uses a fake key and unreachable loopback provider endpoint.
// No model should be contacted on the ungraded reflection path.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.LEARNER_QA_BASE_URL;
assert.match(base ?? '', /^http:\/\/127\.0\.0\.1:\d+$/);
const report = { testedAt: new Date().toISOString(), base, checks: [], fullCourseAccepted: false };
const project = {
  uiPhase: 'workspace',
  title: 'CI 合成初始反思',
  description: '不是學生資料',
  proficiency: 'beginner',
  language: 'zh-HK',
  tags: [],
  status: 'active',
  roles: [],
  milestones: [
    {
      id: 'baseline',
      title: '不計分起點',
      status: 'active',
      order: 0,
      documents: [],
      microtasks: [
        {
          id: 'reflection',
          title: '我目前的想法',
          status: 'in_progress',
          assignee: 'user',
          hints: [],
          order: 0,
          assessmentMode: 'ungraded-reflection',
        },
      ],
    },
  ],
  submissions: [
    {
      id: 'synthetic',
      milestoneId: 'baseline',
      microtaskId: 'reflection',
      kind: 'text',
      content: '我還不確定，需要更多觀察證據。',
      createdAt: '2026-10-22T00:00:00Z',
    },
  ],
  evaluations: [],
  threads: [],
  engagementEvents: [],
  createdAt: '2026-10-22T00:00:00Z',
  updatedAt: '2026-10-22T00:00:00Z',
};

await mkdir('artifacts/learner-image-qa', { recursive: true });
try {
  const health = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(10000) });
  assert.equal(health.status, 200);
  report.checks.push({ name: 'health', status: health.status });

  const start = Date.now();
  const response = await fetch(`${base}/api/pbl/v2/evaluate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      project,
      kind: 'task',
      milestoneId: 'baseline',
      microtaskId: 'reflection',
    }),
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.text();
  assert.equal(response.status, 200, body);
  assert.match(response.headers.get('content-type') ?? '', /^text\/event-stream/);
  const events = body.split(/\r?\n\r?\n/).flatMap((block) => {
    const name = block.match(/^event: (.+)$/m)?.[1];
    const data = block.match(/^data: (.+)$/m)?.[1];
    return name && data ? [{ name, data: JSON.parse(data) }] : [];
  });
  // Not merely "no score": refuse token/tool/evaluation events entirely.
  assert.deepEqual(events, [{ name: 'done', data: {} }]);
  report.checks.push({
    name: 'ungraded-reflection-no-model-no-score',
    events,
    totalMs: Date.now() - start,
  });
  report.pass = true;
} catch (error) {
  report.pass = false;
  report.error = String(error);
  process.exitCode = 1;
} finally {
  await writeFile(
    'artifacts/learner-image-qa/boundary.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report));
}
