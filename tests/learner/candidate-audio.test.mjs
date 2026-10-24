import assert from 'node:assert/strict';
import test from 'node:test';

import { checkLearnerCandidateAudio } from '../../scripts/qa-learner-candidate-audio.mjs';

const id = 'hk-lesson-1';
const media = (number) => `/api/classroom-media/${id}/media/${number}.mp3`;

function fixture({ badStatus = false, noAudio = false, legacyClassroomRoute = false } = {}) {
  const requested = [];
  const fetchImpl = async (url, options) => {
    const pathname = new URL(url).pathname;
    requested.push({ pathname, range: options?.headers?.Range });
    if (pathname === '/api/learner/courses') {
      return Response.json({ courses: [{ id }] });
    }
    if (pathname === `/api/persistence/documents/${id}`) {
      if (legacyClassroomRoute) return new Response(null, { status: 404 });
      return Response.json({
        stage: { id },
        scenes: noAudio
          ? [{ id: 'one' }]
          : Array.from({ length: 5 }, (_, index) => ({
              id: `scene-${index}`,
              actions: [{ audioUrl: media(index) }],
            })),
      });
    }
    if (pathname === '/api/classroom' && legacyClassroomRoute) {
      return Response.json({
        classroom: {
          stage: { id },
          scenes: [{ actions: [{ audioUrl: media(0) }] }],
        },
      });
    }
    if (pathname.startsWith(`/api/classroom-media/${id}/`)) {
      return new Response(new Uint8Array([1, 2, 3]), {
        status: badStatus ? 200 : 206,
        headers: { 'content-type': 'audio/mpeg', 'content-range': 'bytes 0-2/3' },
      });
    }
    return new Response(null, { status: 404 });
  };
  return { fetchImpl, requested };
}

test('samples first, middle and last Range responses from each classroom', async () => {
  const { fetchImpl, requested } = fixture();
  const result = await checkLearnerCandidateAudio({
    candidateUrl: 'https://candidate.test',
    fetchImpl,
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.sampled, 3);
  assert.deepEqual(
    requested.filter((item) => item.range).map((item) => item.pathname),
    [media(0), media(2), media(4)],
  );
});

test('rejects a missing narration and a non-Range media response', async () => {
  const missing = await checkLearnerCandidateAudio({
    candidateUrl: 'https://candidate.test',
    fetchImpl: fixture({ noAudio: true }).fetchImpl,
  });
  assert.match(missing.errors.join('\n'), /no narration audio URLs/);
  const wrongStatus = await checkLearnerCandidateAudio({
    candidateUrl: 'https://candidate.test',
    fetchImpl: fixture({ badStatus: true }).fetchImpl,
  });
  assert.match(wrongStatus.errors.join('\n'), /expected 206/);
});

test('accepts the legacy public classroom route when the document route is absent', async () => {
  const { fetchImpl, requested } = fixture({ legacyClassroomRoute: true });
  const result = await checkLearnerCandidateAudio({
    candidateUrl: 'https://candidate.test',
    fetchImpl,
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.sampled, 1);
  assert.ok(requested.some((item) => item.pathname === '/api/classroom'));
});
