import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { freezePublicLearnerRuntime } from '../../scripts/freeze-public-learner-runtime.mjs';

const id = 'hk-test-01';
const audio = `/api/classroom-media/${id}/media/one.mp3`;
const cover = '/learner/runtime/cover.png';

function fixture() {
  return async (url) => {
    const pathname = new URL(url).pathname;
    if (pathname === '/api/learner/courses') return Response.json({ courses: [{ id }] });
    if (pathname === '/api/learner/site-content') {
      return Response.json({ hero: { cover } });
    }
    if (pathname === '/api/classroom') {
      return Response.json({
        classroom: { id, stage: { id }, scenes: [{ actions: [{ audioUrl: audio }] }] },
      });
    }
    if (pathname === audio || pathname === cover) {
      return new Response(new Uint8Array([1, 2, 3]), {
        headers: { 'content-length': '3' },
      });
    }
    return new Response(null, { status: 404 });
  };
}

test('freezes published classrooms and only their referenced media', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'learner-freeze-test-'));
  try {
    const result = await freezePublicLearnerRuntime({
      baseUrl: 'https://baseline.test',
      outputRoot: root,
      fetchImpl: fixture(),
    });
    assert.deepEqual(result, { courses: 1, media: 2 });
    const classroom = JSON.parse(
      await readFile(path.join(root, 'data/classrooms', `${id}.json`), 'utf8'),
    );
    assert.equal(classroom.stage.id, id);
    assert.deepEqual(
      [...(await readFile(path.join(root, 'data/classrooms', id, 'media/one.mp3')))],
      [1, 2, 3],
    );
    assert.deepEqual(
      [...(await readFile(path.join(root, 'content/learner/media/cover.png')))],
      [1, 2, 3],
    );
    await assert.rejects(
      freezePublicLearnerRuntime({
        baseUrl: 'https://baseline.test',
        outputRoot: root,
        fetchImpl: fixture(),
      }),
      /must be empty/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
