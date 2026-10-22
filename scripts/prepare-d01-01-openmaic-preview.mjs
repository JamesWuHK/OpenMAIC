#!/usr/bin/env node

import { access, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sourcePath = path.resolve('output/d01-openmaic-candidates/D01-01-local-assembled.json');
const sourceClassroom = JSON.parse(await readFile(sourcePath, 'utf8'));
const sourceId = sourceClassroom.id;
const previewId = 'd01-01-pbl-review-20260930';
const classroomsDir = path.resolve('data/classrooms');
const previewJson = path.join(classroomsDir, `${previewId}.json`);
const previewCourseDir = path.join(classroomsDir, previewId);
const previewMediaDir = path.join(previewCourseDir, 'media');

for (const target of [previewJson, previewCourseDir]) {
  try {
    await access(target);
    throw new Error(`Refusing to overwrite existing local preview target: ${target}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

const references = new Set();
const rewriteIds = (value) => {
  if (Array.isArray(value)) return value.map(rewriteIds);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewriteIds(item)]));
  }
  if (typeof value === 'string') {
    const filename = value.match(new RegExp(`/api/classroom-media/${sourceId}/media/([^?#]+)`))?.[1];
    if (filename) references.add(path.basename(filename));
    return value.replaceAll(sourceId, previewId);
  }
  return value;
};

const classroom = rewriteIds(sourceClassroom);
classroom.id = previewId;
classroom.stage.id = previewId;

await mkdir(previewCourseDir, { recursive: false });
try {
  await mkdir(previewMediaDir, { recursive: false });
  for (const filename of references) {
    await copyFile(
      path.resolve('output/d01-openmaic-candidates', sourceId, 'media', filename),
      path.join(previewMediaDir, filename),
    );
  }
  await writeFile(previewJson, `${JSON.stringify(classroom, null, 2)}\n`, { flag: 'wx' });
} catch (error) {
  await rm(previewMediaDir, { recursive: true, force: true });
  await rm(previewCourseDir, { recursive: true, force: true });
  await rm(previewJson, { force: true });
  throw error;
}

console.log(JSON.stringify({
  id: previewId,
  title: classroom.stage.name,
  scenes: classroom.scenes.length,
  audioReferencesCopied: references.size,
  json: previewJson,
  media: previewMediaDir,
  localUrl: `http://127.0.0.1:3000/classroom/${previewId}`,
}, null, 2));
