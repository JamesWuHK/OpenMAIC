import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { checkLearnerReleaseMedia } from '../../scripts/qa-learner-release-media.mjs';

async function fixture(work) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'learner-release-media-'));
  const releaseRoot = path.join(root, 'release');
  const mediaRoot = path.join(root, 'media-source');
  try {
    await mkdir(path.join(releaseRoot, 'content/learner'), { recursive: true });
    await mkdir(path.join(releaseRoot, 'data/classrooms'), { recursive: true });
    await mkdir(path.join(mediaRoot, 'content/learner/media'), { recursive: true });
    await mkdir(path.join(mediaRoot, 'data/classrooms/lesson-1/media'), { recursive: true });
    await writeFile(
      path.join(releaseRoot, 'content/learner/published-courses.json'),
      JSON.stringify({ courses: [{ id: 'lesson-1' }] }),
    );
    await writeFile(
      path.join(releaseRoot, 'content/learner/site-content.json'),
      JSON.stringify({ cover: '/learner/runtime/cover.svg' }),
    );
    await writeFile(
      path.join(releaseRoot, 'data/classrooms/lesson-1.json'),
      JSON.stringify({
        id: 'lesson-1',
        audio: '/api/classroom-media/lesson-1/media/voice.mp3',
      }),
    );
    return await work({ releaseRoot, mediaRoot });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('finds all referenced media across a separate source root', () =>
  fixture(async ({ releaseRoot, mediaRoot }) => {
    await writeFile(path.join(mediaRoot, 'content/learner/media/cover.svg'), '<svg/>');
    await writeFile(path.join(mediaRoot, 'data/classrooms/lesson-1/media/voice.mp3'), 'audio');
    const result = await checkLearnerReleaseMedia({ releaseRoot, mediaRoots: [mediaRoot] });
    assert.deepEqual(result, {
      courses: 1,
      classroomMediaRefs: 1,
      siteMediaRefs: 1,
      errors: [],
    });
  }));

test('blocks a release with missing narration or cover', () =>
  fixture(async ({ releaseRoot, mediaRoot }) => {
    const result = await checkLearnerReleaseMedia({ releaseRoot, mediaRoots: [mediaRoot] });
    assert.equal(result.errors.length, 2);
    assert.match(result.errors.join('\n'), /voice\.mp3/);
    assert.match(result.errors.join('\n'), /cover\.svg/);
  }));
