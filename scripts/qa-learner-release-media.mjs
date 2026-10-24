#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CLASSROOM_MEDIA = /\/api\/classroom-media\/[A-Za-z0-9_-]+\/[A-Za-z0-9_./%-]+/g;
const SITE_MEDIA = /\/learner\/runtime\/[A-Za-z0-9_./%-]+/g;

function references(text, pattern) {
  return [...new Set([...text.matchAll(pattern)].map((match) => match[0]))];
}

async function existsInRoots(relativeFile, roots) {
  for (const root of roots) {
    const resolvedRoot = path.resolve(root);
    const candidate = path.resolve(resolvedRoot, relativeFile);
    if (!candidate.startsWith(`${resolvedRoot}${path.sep}`)) continue;
    try {
      await access(candidate);
      return true;
    } catch {
      // This source root does not contain the file; try the next one.
    }
  }
  return false;
}

/** Verify every local classroom and series-media URL in a complete release. */
export async function checkLearnerReleaseMedia({ releaseRoot, mediaRoots }) {
  if (!mediaRoots.length) throw new Error('At least one media source root is required');
  const catalog = JSON.parse(
    await readFile(path.join(releaseRoot, 'content/learner/published-courses.json'), 'utf8'),
  );
  if (!Array.isArray(catalog.courses) || !catalog.courses.length) {
    throw new Error('The release catalog must contain published courses');
  }
  const errors = [];
  let classroomMediaRefs = 0;
  for (const { id } of catalog.courses) {
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(id)) {
      errors.push(`Invalid published course ID: ${JSON.stringify(id)}`);
      continue;
    }
    const source = await readFile(path.join(releaseRoot, 'data/classrooms', `${id}.json`), 'utf8');
    for (const url of references(source, CLASSROOM_MEDIA)) {
      classroomMediaRefs++;
      try {
        const relative = path.join(
          'data/classrooms',
          decodeURIComponent(url.slice('/api/classroom-media/'.length)),
        );
        if (!(await existsInRoots(relative, mediaRoots))) errors.push(`Missing ${url}`);
      } catch {
        errors.push(`Invalid media URL ${url}`);
      }
    }
  }
  const site = await readFile(path.join(releaseRoot, 'content/learner/site-content.json'), 'utf8');
  let siteMediaRefs = 0;
  for (const url of references(site, SITE_MEDIA)) {
    siteMediaRefs++;
    try {
      const relative = path.join(
        'content/learner/media',
        decodeURIComponent(url.slice('/learner/runtime/'.length)),
      );
      if (!(await existsInRoots(relative, mediaRoots))) errors.push(`Missing ${url}`);
    } catch {
      errors.push(`Invalid media URL ${url}`);
    }
  }
  return { courses: catalog.courses.length, classroomMediaRefs, siteMediaRefs, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [releaseRoot, ...mediaRoots] = process.argv.slice(2);
  if (!releaseRoot || !mediaRoots.length) {
    console.error('Usage: node scripts/qa-learner-release-media.mjs RELEASE_ROOT MEDIA_ROOT...');
    process.exitCode = 2;
  } else {
    try {
      const result = await checkLearnerReleaseMedia({ releaseRoot, mediaRoots });
      console.log(
        `Learner media: ${result.courses} courses, ${result.classroomMediaRefs} classroom references, ${result.siteMediaRefs} site references`,
      );
      for (const error of result.errors) console.error(`FAIL ${error}`);
      if (result.errors.length) process.exitCode = 1;
      else console.log('PASS every referenced media file has a local source');
    } catch (error) {
      console.error(`FAIL learner media: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
