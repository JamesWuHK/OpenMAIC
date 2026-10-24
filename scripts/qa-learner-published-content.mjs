#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function jsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function jsonEndpoint(baseUrl, pathname, fetchImpl) {
  const response = await fetchImpl(new URL(pathname, baseUrl), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${pathname}: HTTP ${response.status}`);
  return { value: await response.json(), response };
}

/** Check the mounted course release after publication. This never writes to the site. */
export async function checkPublishedLearnerContent({
  publicUrl,
  siteContentPath,
  catalogPath,
  classroomsDir,
  fetchImpl = fetch,
}) {
  const [site, catalog, liveSiteResult, liveCatalogResult] = await Promise.all([
    jsonFile(siteContentPath),
    jsonFile(catalogPath),
    jsonEndpoint(publicUrl, '/api/learner/site-content', fetchImpl),
    jsonEndpoint(publicUrl, '/api/learner/courses', fetchImpl),
  ]);
  const liveSite = liveSiteResult.value;
  const liveCatalog = liveCatalogResult.value;
  if (!Array.isArray(catalog.courses) || !Array.isArray(liveCatalog.courses)) {
    throw new Error('Both catalogs must contain a courses array');
  }
  if (!catalog.courses.length) throw new Error('The local publication catalog is empty');

  const errors = [];
  if (!isDeepStrictEqual(site, liveSite)) errors.push('Published site content differs from source');
  const localIds = catalog.courses.map((course) => course.id);
  const liveIds = liveCatalog.courses.map((course) => course.id);
  if (!isDeepStrictEqual(localIds, liveIds)) errors.push('Published course IDs/order differ');
  const liveById = new Map(liveCatalog.courses.map((course) => [course.id, course]));

  for (const course of catalog.courses) {
    if (typeof course.id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(course.id)) {
      errors.push(`Invalid local course ID: ${JSON.stringify(course.id)}`);
      continue;
    }
    const summary = liveById.get(course.id);
    if (!summary) continue;
    for (const field of [
      'publishedAt',
      'topics',
      'audiences',
      'gradeRange',
      'language',
      'series',
      'lessonNumber',
    ]) {
      if (!isDeepStrictEqual(course[field], summary[field])) {
        errors.push(`${course.id}: ${field} differs from source`);
      }
    }
    let local;
    let sourceSha256;
    try {
      const source = await readFile(path.join(classroomsDir, `${course.id}.json`));
      sourceSha256 = createHash('sha256').update(source).digest('hex');
      local = JSON.parse(source.toString('utf8'));
    } catch (error) {
      errors.push(`${course.id}: local classroom missing (${error.message})`);
      continue;
    }
    if (local.id !== course.id || local.stage?.id !== course.id || !Array.isArray(local.scenes)) {
      errors.push(`${course.id}: local classroom is malformed`);
      continue;
    }
    if (summary.name !== local.stage.name || summary.sceneCount !== local.scenes.length) {
      errors.push(`${course.id}: published summary differs from classroom`);
    }
    try {
      const { value: document, response } = await jsonEndpoint(
        publicUrl,
        `/api/persistence/documents/${encodeURIComponent(course.id)}`,
        fetchImpl,
      );
      if (response.headers.get('x-learner-classroom-sha256') !== sourceSha256) {
        errors.push(`${course.id}: published classroom file hash differs from source`);
      }
      if (document.stage?.id !== course.id || !Array.isArray(document.scenes)) {
        errors.push(`${course.id}: published classroom document is malformed`);
      } else if (
        !isDeepStrictEqual(
          document.scenes.map((scene) => scene.id),
          local.scenes.map((scene) => scene.id),
        )
      ) {
        errors.push(`${course.id}: published scene IDs/order differ from source`);
      }
    } catch (error) {
      errors.push(`${course.id}: published classroom unavailable (${error.message})`);
    }
  }
  return { localCount: localIds.length, liveCount: liveIds.length, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const publicUrl = process.env.LEARNER_PUBLIC_URL;
  if (!publicUrl) {
    console.error('Set LEARNER_PUBLIC_URL');
    process.exitCode = 2;
  } else {
    try {
      const result = await checkPublishedLearnerContent({
        publicUrl,
        siteContentPath: 'content/learner/site-content.json',
        catalogPath: 'content/learner/published-courses.json',
        classroomsDir: 'data/classrooms',
      });
      console.log(`Learner publication: source ${result.localCount}, live ${result.liveCount}`);
      for (const error of result.errors) console.error(`FAIL ${error}`);
      if (result.errors.length) process.exitCode = 1;
      else console.log('PASS learner catalog and every classroom document');
    } catch (error) {
      console.error(`FAIL learner publication: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
