#!/usr/bin/env node

import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { validateScene, validateStage } from '../packages/@openmaic/dsl/dist/index.js';

// A new review batch is immutable. Never replace a published classroom or a
// previous review batch (which might already contain a learner's progress).
const batch = process.argv[2] ?? '20261012';
if (!/^\d{8}(?:-[a-z0-9-]+)?$/.test(batch)) throw new Error('Use YYYYMMDD[-revision] as the review batch.');
const inputDir = path.resolve(process.argv[3] ?? 'output/d01-openmaic-candidates');
const targetDir = path.resolve('data/classrooms');
const entries = [];
for (let number = 1; number <= 6; number++) {
  const lesson = `D01-${String(number).padStart(2, '0')}`;
  const sourcePath = path.join(inputDir, `${lesson}-local-assembled.json`);
  const sourceBytes = await readFile(sourcePath);
  const source = JSON.parse(sourceBytes);
  const id = `${lesson.toLowerCase()}-pbl-review-${batch}`;
  const jsonPath = path.join(targetDir, `${id}.json`);
  const mediaDir = path.join(targetDir, id, 'media');
  for (const destination of [jsonPath, path.join(targetDir, id)]) {
    try { await access(destination); throw new Error(`Preview target already exists: ${destination}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const media = new Set();
  const map = value => {
    if (Array.isArray(value)) return value.map(map);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, map(item)]));
    if (typeof value !== 'string') return value;
    const prefix = `/api/classroom-media/${source.id}/media/`;
    if (value.startsWith(prefix)) {
      const filename = value.slice(prefix.length);
      if (filename !== path.basename(filename)) throw new Error('Media references must be local filenames.');
      media.add(filename);
    }
    return value.replaceAll(source.id, id);
  };
  const classroom = map(source);
  classroom.id = id;
  classroom.stage.id = id;
  const contract = validateStage(classroom.stage);
  if (!contract.valid) throw new Error(`${lesson}: invalid stage: ${JSON.stringify(contract.errors)}`);
  for (const scene of classroom.scenes) {
    const result = validateScene(scene);
    if (!result.valid) throw new Error(`${lesson}: invalid ${scene.id}: ${JSON.stringify(result.errors)}`);
  }
  for (const filename of media) await access(path.join(inputDir, source.id, 'media', filename));
  // All references are checked before the first file mutation for this lesson.
  await mkdir(mediaDir, { recursive: true });
  for (const filename of media) await copyFile(path.join(inputDir, source.id, 'media', filename), path.join(mediaDir, filename));
  await writeFile(jsonPath, `${JSON.stringify(classroom, null, 2)}\n`, { flag: 'wx' });
  entries.push({ lesson, id, title: classroom.stage.name, scenes: classroom.scenes.length, firstScene: classroom.scenes[0].type,
    milestones: classroom.scenes[0].content.projectV2.milestones.length, mediaFiles: media.size,
    sourceSha256: createHash('sha256').update(sourceBytes).digest('hex'),
    url: `http://127.0.0.1:3000/classroom/${id}` });
}
await writeFile(path.join(inputDir, `preview-batch-${batch}.json`), `${JSON.stringify({ batch, entries }, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ batch, entries }, null, 2));
