#!/usr/bin/env node

import assert from 'node:assert/strict';
import { access, copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildD01LessonHtml, buildD01ProjectStepHtml } from './lib/d01-local-components.mjs';

const batchDir = path.resolve(process.argv[2] ?? 'output/d01-openmaic-candidates/20261021-r03');
await mkdir(batchDir, { recursive: true });
const lessons = [
  ['D01-01', 'desk-creature'], ['D01-02', 'monster-organizer'],
  ['D01-03', 'pocket-hideout'], ['D01-04', 'five-second-story'],
  ['D01-05', 'shadow-riddle'], ['D01-06', 'mini-exhibition'],
];
const stepByScene = new Map([
  ['d01-scene-05', 'investigation'], ['d01-scene-06', 'critique'],
  ['d01-scene-07', 'revision'], ['d01-scene-08-showcase', 'showcase'],
  ['d01-scene-09', 'transfer'],
]);
const results = [];

for (const [lessonId, slug] of lessons) {
  const inputPath = path.resolve(`output/d01-openmaic-candidates/${lessonId}-local-assembled.json`);
  const source = JSON.parse(await readFile(inputPath, 'utf8'));
  assert.equal(source.scenes?.length, 9, `${lessonId}: expected the current nine-scene PBL candidate`);
  const previousId = source.id;
  const classroomId = `hk-d01-${lessonId.slice(-2)}-${slug}-r03`;
  const replaceIds = (value) => {
    if (Array.isArray(value)) return value.map(replaceIds);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceIds(item)]));
    return typeof value === 'string' ? value.replaceAll(previousId, classroomId) : value;
  };
  const classroom = replaceIds(source);
  classroom.id = classroomId;
  classroom.stage.id = classroomId;
  const interactions = classroom.scenes.filter((scene) => scene.type === 'interactive');
  assert.equal(interactions.length, 6, `${lessonId}: expected six interaction scenes`);
  for (const scene of interactions) {
    if (scene.id === 'd01-scene-04') scene.content.html = buildD01LessonHtml(lessonId, 'zh-HK');
    else {
      const step = stepByScene.get(scene.id);
      assert(step, `${lessonId}: unexpected D01 interaction ${scene.id}`);
      scene.content.html = buildD01ProjectStepHtml(lessonId, step, 'zh-HK');
    }
  }
  const mediaIds = new Set(classroom.scenes.flatMap((scene) => scene.actions ?? [])
    .filter((action) => action.type === 'speech')
    .map((action) => action.audioUrl || action.audioId)
    .filter((value) => typeof value === 'string'));
  assert(mediaIds.size >= 9, `${lessonId}: expected course-specific recorded narration references`);
  for (const mediaId of mediaIds) {
    assert(mediaId.startsWith(`/api/classroom-media/${classroomId}/media/`), `${lessonId}: stale audio id ${mediaId}`);
  }
  const mediaDir = path.join(batchDir, classroomId, 'media');
  await mkdir(mediaDir, { recursive: true });
  for (const mediaId of mediaIds) {
    const filename = mediaId.slice(`/api/classroom-media/${classroomId}/media/`.length);
    assert.equal(path.basename(filename), filename, `${lessonId}: invalid media filename`);
    const sourceMedia = path.resolve(`output/d01-openmaic-candidates/${previousId}/media/${filename}`);
    await access(sourceMedia);
    await copyFile(sourceMedia, path.join(mediaDir, filename));
  }
  const target = path.join(batchDir, `${lessonId}-local-assembled.json`);
  const temporary = `${target}.prepare.tmp`;
  await writeFile(temporary, `${JSON.stringify(classroom, null, 2)}\n`, 'utf8');
  await rename(temporary, target);
  results.push({ lesson: lessonId, id: classroom.id, interactions: interactions.length, speechFiles: mediaIds.size, output: target });
}

console.log(JSON.stringify({ batch: batchDir, results }, null, 2));
