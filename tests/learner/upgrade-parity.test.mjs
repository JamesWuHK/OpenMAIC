import assert from 'node:assert/strict';
import test from 'node:test';

import { checkLearnerUpgradeParity } from '../../scripts/qa-learner-upgrade-parity.mjs';

const course = {
  id: 'hk-lesson-1',
  name: '香港課堂',
  language: 'zh-hk',
  gradeRange: '小四至中一',
  series: '香港 AI 素養',
  lessonNumber: 1,
  sceneCount: 2,
  topics: ['ai-tech'],
  audiences: ['primary'],
};

function fixture(
  candidateCourses,
  documents = {},
  candidateSite = { series: [] },
  baselineSite = { series: [] },
) {
  return async (url) => {
    const target = new URL(url);
    const value =
      target.pathname === '/api/learner/courses'
        ? { courses: target.hostname === 'baseline.test' ? [course] : candidateCourses }
        : target.pathname === '/api/learner/site-content'
          ? target.hostname === 'baseline.test'
            ? baselineSite
            : candidateSite
          : documents[target.pathname];
    return value === undefined ? { ok: false, status: 404 } : { ok: true, json: async () => value };
  };
}

test('accepts the same published catalog only when its classroom is loaded', async () => {
  const result = await checkLearnerUpgradeParity({
    baselineUrl: 'https://baseline.test',
    candidateUrl: 'https://candidate.test',
    fetchImpl: fixture([course], {
      '/api/persistence/documents/hk-lesson-1': {
        stage: { id: course.id },
        scenes: [{ id: 'one' }, { id: 'two' }],
      },
    }),
  });
  assert.deepEqual(result.errors, []);
});

test('rejects dropped labels, missing classrooms and unexpected courses', async () => {
  const result = await checkLearnerUpgradeParity({
    baselineUrl: 'https://baseline.test',
    candidateUrl: 'https://candidate.test',
    fetchImpl: fixture([
      { ...course, language: undefined },
      { ...course, id: 'extra' },
    ]),
  });
  assert.match(result.errors.join('\n'), /language changed/);
  assert.match(result.errors.join('\n'), /classroom unavailable/);
  assert.match(result.errors.join('\n'), /unexpected candidate catalog entry/);
});

test('rejects a candidate that keeps lessons but drops a series entry', async () => {
  const result = await checkLearnerUpgradeParity({
    baselineUrl: 'https://baseline.test',
    candidateUrl: 'https://candidate.test',
    fetchImpl: fixture(
      [course],
      {
        '/api/persistence/documents/hk-lesson-1': {
          stage: { id: course.id },
          scenes: [{ id: 'one' }, { id: 'two' }],
        },
      },
      { series: [] },
      { series: [{ slug: 'missing-series', liveCourseIds: [] }] },
    ),
  });
  assert.match(result.errors.join('\n'), /series\/site content differs/);
});

test('does not pass an empty baseline', async () => {
  await assert.rejects(
    checkLearnerUpgradeParity({
      baselineUrl: 'https://baseline.test',
      candidateUrl: 'https://candidate.test',
      fetchImpl: async () => ({ ok: true, json: async () => ({ courses: [] }) }),
    }),
    /Baseline catalog is empty/,
  );
});
