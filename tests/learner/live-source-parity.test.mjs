import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { checkLearnerLiveSourceParity } from '../../scripts/qa-learner-live-source-parity.mjs';

const course = {
  id: 'lesson-1',
  publishedAt: 1,
  topics: ['ai-tech'],
  audiences: ['primary'],
  gradeRange: '小四至中一',
  language: 'zh-hk',
  series: '香港 AI 素養',
  lessonNumber: 1,
};
const classroom = {
  id: course.id,
  stage: { id: course.id, name: '香港課堂' },
  scenes: [{ id: 'scene-1' }],
};
const liveCourse = { ...course, name: classroom.stage.name, sceneCount: 1 };

async function withFixture(work) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'learner-source-parity-'));
  try {
    const siteContentPath = path.join(dir, 'site.json');
    const catalogPath = path.join(dir, 'catalog.json');
    await Promise.all([
      writeFile(siteContentPath, JSON.stringify({ series: [] })),
      writeFile(catalogPath, JSON.stringify({ courses: [course] })),
      writeFile(path.join(dir, `${course.id}.json`), JSON.stringify(classroom)),
    ]);
    return await work({ siteContentPath, catalogPath, classroomsDir: dir });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function mockFetch({ classroomValue = classroom, courses = [liveCourse] } = {}) {
  return async (url) => {
    const pathname = new URL(url).pathname;
    const value =
      pathname === '/api/learner/site-content'
        ? { series: [] }
        : pathname === '/api/learner/courses'
          ? { courses }
          : { classroom: classroomValue };
    return { ok: true, json: async () => value };
  };
}

test('accepts exactly matching public source content', () =>
  withFixture(async (files) => {
    const result = await checkLearnerLiveSourceParity({
      ...files,
      baselineUrl: 'https://class.example',
      fetchImpl: mockFetch(),
    });
    assert.deepEqual(result.errors, []);
    assert.equal(result.liveCount, 1);
  }));

test('uses an explicit frozen classroom override without rewriting its source', () =>
  withFixture(async (files) => {
    const result = await checkLearnerLiveSourceParity({
      ...files,
      classroomsDir: path.join(files.classroomsDir, 'not-present'),
      classroomOverrides: {
        [course.id]: path.join(files.classroomsDir, `${course.id}.json`),
      },
      baselineUrl: 'https://class.example',
      fetchImpl: mockFetch(),
    });
    assert.deepEqual(result.errors, []);
  }));

test('rejects a different classroom and a changed course ID', () =>
  withFixture(async (files) => {
    const result = await checkLearnerLiveSourceParity({
      ...files,
      baselineUrl: 'https://class.example',
      fetchImpl: mockFetch({
        classroomValue: { ...classroom, scenes: [{ id: 'other' }] },
        courses: [{ ...liveCourse, id: 'lesson-2' }],
      }),
    });
    assert.match(result.errors.join('\n'), /Catalog IDs or order differ/);
  }));

test('rejects changed classroom content under the same ID', () =>
  withFixture(async (files) => {
    const result = await checkLearnerLiveSourceParity({
      ...files,
      baselineUrl: 'https://class.example',
      fetchImpl: mockFetch({ classroomValue: { ...classroom, scenes: [{ id: 'other' }] } }),
    });
    assert.match(result.errors.join('\n'), /classroom JSON differs from live/);
  }));
