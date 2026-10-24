import assert from 'node:assert/strict';
import test from 'node:test';

import { checkLearnerCandidateSpeech } from '../../scripts/qa-learner-candidate-speech.mjs';

const agents = [
  { id: 't', role: 'teacher' },
  { id: 'a', role: 'assistant' },
  { id: 's', role: 'student' },
];
const audio = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(1200)]).toString('base64');

function fixture({ roster = agents, speechStatus = 200 } = {}) {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    const pathname = new URL(url).pathname;
    if (pathname === '/api/learner/courses') {
      return Response.json({ courses: [{ id: 'lesson' }] });
    }
    if (pathname === '/api/persistence/documents/lesson') {
      return Response.json({ stage: { generatedAgentConfigs: roster } });
    }
    if (pathname === '/api/learner/speech') {
      requests.push({ body: JSON.parse(options.body), origin: options.headers.origin });
      return Response.json(
        speechStatus === 200 ? { format: 'mp3', base64: audio } : { error: 'unavailable' },
        { status: speechStatus },
      );
    }
    return new Response(null, { status: 404 });
  };
  return { fetchImpl, requests };
}

test('checks all three published speakers with synthetic text and reports latency', async () => {
  const { fetchImpl, requests } = fixture();
  let tick = 0;
  const result = await checkLearnerCandidateSpeech({
    candidateUrl: 'http://candidate.test:3000',
    fetchImpl,
    now: () => (tick += 250),
  });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(
    result.results.map((item) => item.role),
    ['teacher', 'assistant', 'student'],
  );
  assert.ok(result.results.every((item) => item.bytes > 1000 && item.latencyMs === 250));
  assert.deepEqual(
    requests.map((request) => request.body.agentId),
    ['t', 'a', 's'],
  );
  assert.ok(requests.every((request) => request.origin === 'http://candidate.test:3000'));
  assert.ok(requests.every((request) => request.body.text.includes('一齊')));
});

test('rejects missing classroom roles before sending any speech request', async () => {
  const { fetchImpl, requests } = fixture({ roster: agents.slice(0, 2) });
  await assert.rejects(
    checkLearnerCandidateSpeech({ candidateUrl: 'http://candidate.test:3000', fetchImpl }),
    /all three discussion roles/,
  );
  assert.equal(requests.length, 0);
});

test('reports an upstream speech failure rather than treating it as playable audio', async () => {
  const { fetchImpl } = fixture({ speechStatus: 502 });
  const result = await checkLearnerCandidateSpeech({
    candidateUrl: 'http://candidate.test:3000',
    fetchImpl,
  });
  assert.equal(result.results.length, 0);
  assert.equal(result.errors.length, 3);
  assert.match(result.errors[0], /teacher: HTTP 502/);
});
