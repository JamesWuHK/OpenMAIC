#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function fetchJson(baseUrl, pathname, fetchImpl) {
  const response = await fetchImpl(new URL(pathname, baseUrl), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${pathname}: HTTP ${response.status}`);
  return response.json();
}

/** Compare a frozen local release source with the currently public learner site. Read-only. */
export async function checkLearnerLiveSourceParity({
  baselineUrl,
  siteContentPath,
  catalogPath,
  classroomsDir,
  classroomOverrides = {},
  fetchImpl = fetch,
}) {
  const [site, catalog, liveSite, liveCatalog] = await Promise.all([
    readJson(siteContentPath),
    readJson(catalogPath),
    fetchJson(baselineUrl, '/api/learner/site-content', fetchImpl),
    fetchJson(baselineUrl, '/api/learner/courses', fetchImpl),
  ]);
  if (!Array.isArray(catalog.courses) || !Array.isArray(liveCatalog.courses)) {
    throw new Error('Both course catalogs must contain a courses array');
  }
  if (liveCatalog.courses.length === 0) throw new Error('Live learner catalog is empty');

  const errors = [];
  if (!isDeepStrictEqual(site, liveSite)) errors.push('Site content differs from live');
  const localIds = catalog.courses.map((course) => course.id);
  const liveIds = liveCatalog.courses.map((course) => course.id);
  if (new Set(localIds).size !== localIds.length) errors.push('Local catalog has duplicate IDs');
  if (!isDeepStrictEqual(localIds, liveIds)) errors.push('Catalog IDs or order differ from live');
  const liveById = new Map(liveCatalog.courses.map((course) => [course.id, course]));

  for (const course of catalog.courses) {
    if (typeof course.id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(course.id)) {
      errors.push(`Invalid local course ID: ${JSON.stringify(course.id)}`);
      continue;
    }
    const live = liveById.get(course.id);
    if (!live) continue;
    for (const field of [
      'publishedAt',
      'topics',
      'audiences',
      'gradeRange',
      'language',
      'series',
      'lessonNumber',
    ]) {
      if (!isDeepStrictEqual(course[field], live[field])) {
        errors.push(`${course.id}: ${field} differs from live`);
      }
    }
    const classroomPath =
      classroomOverrides[course.id] ?? path.join(classroomsDir, `${course.id}.json`);
    let classroom;
    try {
      classroom = await readJson(classroomPath);
    } catch (error) {
      errors.push(`${course.id}: local classroom unavailable (${error.message})`);
      continue;
    }
    if (classroom.id !== course.id || classroom.stage?.id !== course.id) {
      errors.push(`${course.id}: local classroom ID is inconsistent`);
      continue;
    }
    if (classroom.stage.name !== live.name || classroom.scenes?.length !== live.sceneCount) {
      errors.push(`${course.id}: local classroom summary differs from live`);
    }
    try {
      const response = await fetchJson(
        baselineUrl,
        `/api/classroom?id=${encodeURIComponent(course.id)}`,
        fetchImpl,
      );
      if (!isDeepStrictEqual(classroom, response.classroom)) {
        errors.push(`${course.id}: classroom JSON differs from live`);
      }
    } catch (error) {
      errors.push(`${course.id}: live classroom unavailable (${error.message})`);
    }
  }

  return { liveCount: liveIds.length, localCount: localIds.length, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baselineUrl = process.env.LEARNER_QA_BASELINE_URL;
  const siteContentPath = process.env.LEARNER_QA_SITE_CONTENT_PATH;
  const catalogPath = process.env.LEARNER_QA_CATALOG_PATH;
  const classroomsDir = process.env.LEARNER_QA_CLASSROOMS_DIR;
  if (!baselineUrl || !siteContentPath || !catalogPath || !classroomsDir) {
    console.error(
      'Set LEARNER_QA_BASELINE_URL, LEARNER_QA_SITE_CONTENT_PATH, LEARNER_QA_CATALOG_PATH and LEARNER_QA_CLASSROOMS_DIR',
    );
    process.exitCode = 2;
  } else {
    try {
      const classroomOverrides = JSON.parse(process.env.LEARNER_QA_CLASSROOM_OVERRIDES ?? '{}');
      const result = await checkLearnerLiveSourceParity({
        baselineUrl,
        siteContentPath,
        catalogPath,
        classroomsDir,
        classroomOverrides,
      });
      console.log(`Learner source: live ${result.liveCount}, local ${result.localCount}`);
      for (const error of result.errors) console.error(`FAIL ${error}`);
      if (result.errors.length) process.exitCode = 1;
      else console.log('PASS learner site, catalog and every classroom match live');
    } catch (error) {
      console.error(`FAIL learner live-source parity: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
