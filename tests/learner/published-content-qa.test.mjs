import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { checkPublishedLearnerContent } from '../../scripts/qa-learner-published-content.mjs';

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
  id: 'lesson-1',
  stage: { id: 'lesson-1', name: '香港課堂' },
  scenes: [{ id: 'one' }, { id: 'two' }],
};

async function withFixture(work) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'learner-published-qa-'));
  try {
    const siteContentPath = path.join(dir, 'site.json');
    const catalogPath = path.join(dir, 'catalog.json');
    await Promise.all([
      writeFile(siteContentPath, JSON.stringify({ series: [] })),
      writeFile(catalogPath, JSON.stringify({ courses: [course] })),
      writeFile(path.join(dir, 'lesson-1.json'), JSON.stringify(classroom)),
    ]);
    return await work({ siteContentPath, catalogPath, classroomsDir: dir });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function mockFetch(sceneIds = ['one', 'two'], sourceHash) {
  return async (url) => {
    const pathname = new URL(url).pathname;
    const value =
      pathname === '/api/learner/site-content'
        ? { series: [] }
        : pathname === '/api/learner/courses'
          ? { courses: [{ ...course, name: '香港課堂', sceneCount: 2 }] }
          : {
              stage: classroom.stage,
              scenes: sceneIds.map((id) => ({ id })),
            };
    return {
      ok: true,
      headers: new Headers({
        'x-learner-classroom-sha256':
          sourceHash ?? createHash('sha256').update(JSON.stringify(classroom)).digest('hex'),
      }),
      json: async () => value,
    };
  };
}

test('passes when published catalog and classroom match their source', () =>
  withFixture(async (files) => {
    const result = await checkPublishedLearnerContent({
      ...files,
      publicUrl: 'https://learner.example',
      fetchImpl: mockFetch(),
    });
    assert.deepEqual(result.errors, []);
  }));

test('blocks a classroom whose published scene order changed', () =>
  withFixture(async (files) => {
    const result = await checkPublishedLearnerContent({
      ...files,
      publicUrl: 'https://learner.example',
      fetchImpl: mockFetch(['two', 'one']),
    });
    assert.match(result.errors.join('\n'), /scene IDs\/order differ/);
  }));

test('blocks stale classroom content even when the scene IDs and count match', () =>
  withFixture(async (files) => {
    const result = await checkPublishedLearnerContent({
      ...files,
      publicUrl: 'https://learner.example',
      fetchImpl: mockFetch(['one', 'two'], 'stale-source-hash'),
    });
    assert.match(result.errors.join('\n'), /file hash differs from source/);
  }));
