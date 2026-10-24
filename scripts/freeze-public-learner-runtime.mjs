#!/usr/bin/env node
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CLASSROOM_MEDIA = /\/api\/classroom-media\/[A-Za-z0-9_-]+\/[A-Za-z0-9_./%-]+/g;
const SITE_MEDIA = /\/learner\/runtime\/[A-Za-z0-9_./%-]+/g;
const MAX_MEDIA_BYTES = 20 * 1024 * 1024;

async function getJson(baseUrl, pathname, fetchImpl) {
  const response = await fetchImpl(new URL(pathname, baseUrl), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${pathname}: HTTP ${response.status}`);
  return response.json();
}

function safeDestination(root, relative) {
  const destination = path.resolve(root, relative);
  if (!destination.startsWith(`${path.resolve(root)}${path.sep}`)) {
    throw new Error(`Unsafe learner media path: ${relative}`);
  }
  return destination;
}

async function saveJson(root, relative, value) {
  const destination = safeDestination(root, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o644 });
}

async function saveMedia(root, baseUrl, pathname, relative, fetchImpl) {
  const destination = safeDestination(root, relative);
  const response = await fetchImpl(new URL(pathname, baseUrl), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${pathname}: HTTP ${response.status}`);
  const reportedSize = Number(response.headers.get('content-length'));
  if (reportedSize > MAX_MEDIA_BYTES) throw new Error(`${pathname}: media exceeds size limit`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.byteLength || bytes.byteLength > MAX_MEDIA_BYTES) {
    throw new Error(`${pathname}: empty or oversized media body`);
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes, { flag: 'wx', mode: 0o644 });
}

/** Make a candidate-only snapshot of currently public learner data; never writes to the site. */
export async function freezePublicLearnerRuntime({ baseUrl, outputRoot, fetchImpl = fetch }) {
  await mkdir(outputRoot, { recursive: true });
  if ((await readdir(outputRoot)).length)
    throw new Error('Snapshot output directory must be empty');
  const [catalog, site] = await Promise.all([
    getJson(baseUrl, '/api/learner/courses', fetchImpl),
    getJson(baseUrl, '/api/learner/site-content', fetchImpl),
  ]);
  if (!Array.isArray(catalog.courses) || !catalog.courses.length) {
    throw new Error('Public learner catalog is empty');
  }
  const ids = new Set();
  const media = new Map();
  for (const course of catalog.courses) {
    const id = course.id;
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(id) || ids.has(id)) {
      throw new Error(`Invalid or duplicate public course ID: ${JSON.stringify(id)}`);
    }
    ids.add(id);
    const result = await getJson(baseUrl, `/api/classroom?id=${encodeURIComponent(id)}`, fetchImpl);
    const classroom = result.classroom;
    if (classroom?.stage?.id !== id || !Array.isArray(classroom.scenes)) {
      throw new Error(`${id}: malformed public classroom`);
    }
    await saveJson(outputRoot, `data/classrooms/${id}.json`, classroom);
    for (const match of JSON.stringify(classroom).matchAll(CLASSROOM_MEDIA)) {
      const pathname = match[0];
      if (!pathname.startsWith(`/api/classroom-media/${id}/`)) {
        throw new Error(`${id}: cross-classroom media reference`);
      }
      const relative = path.join(
        'data/classrooms',
        decodeURIComponent(pathname.slice('/api/classroom-media/'.length)),
      );
      media.set(pathname, relative);
    }
  }
  for (const match of JSON.stringify(site).matchAll(SITE_MEDIA)) {
    const pathname = match[0];
    const relative = path.join(
      'content/learner/media',
      decodeURIComponent(pathname.slice('/learner/runtime/'.length)),
    );
    media.set(pathname, relative);
  }
  await saveJson(outputRoot, 'content/learner/published-courses.json', catalog);
  await saveJson(outputRoot, 'content/learner/site-content.json', site);
  for (const [pathname, relative] of media) {
    await saveMedia(outputRoot, baseUrl, pathname, relative, fetchImpl);
  }
  return { courses: ids.size, media: media.size };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baseUrl = process.env.LEARNER_QA_BASELINE_URL;
  const outputRoot = process.argv[2];
  if (!baseUrl || !outputRoot) {
    console.error('Set LEARNER_QA_BASELINE_URL and pass an empty snapshot directory');
    process.exitCode = 2;
  } else {
    try {
      const result = await freezePublicLearnerRuntime({ baseUrl, outputRoot });
      console.log(
        `Frozen public learner runtime: ${result.courses} courses, ${result.media} media`,
      );
    } catch (error) {
      console.error(`FAIL public learner snapshot: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
