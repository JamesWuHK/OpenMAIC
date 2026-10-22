#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sitePath = path.resolve(process.argv[2] ?? 'content/learner/site-content.json');
const catalogPath = path.resolve(process.argv[3] ?? 'content/learner/published-courses.json');
const classroomsPath = path.resolve(process.argv[4] ?? 'data/classrooms');

const [site, catalog] = await Promise.all([
  readFile(sitePath, 'utf8').then(JSON.parse),
  readFile(catalogPath, 'utf8').then(JSON.parse),
]);
const failures = [];
const allowedStatuses = new Set(['open', 'preview', 'planning']);
const allowedTopics = new Set(['ai-tech', 'chinese', 'hong-kong', 'leadership', 'life-money', 'interests']);
const allowedAudiences = new Set(['primary', 'secondary', 'adult']);
const allowedLanguages = new Set(['zh-hk', 'zh-cn', 'en']);
const sourceIds = new Set((site.sources ?? []).map((source) => source.id));
const seriesSlugs = new Set();
const courseIds = new Set();
const catalogById = new Map();

for (const course of catalog.courses ?? []) {
  if (!course.id || courseIds.has(course.id)) failures.push(`published course id is missing or duplicated: ${course.id ?? 'missing'}`);
  courseIds.add(course.id);
  catalogById.set(course.id, course);
  if (!Number.isFinite(course.publishedAt)) failures.push(`publishedAt is invalid: ${course.id}`);
  if (!(course.topics ?? []).length || course.topics.some((topic) => !allowedTopics.has(topic))) failures.push(`topics are invalid: ${course.id}`);
  if (!(course.audiences ?? []).length || course.audiences.some((audience) => !allowedAudiences.has(audience))) failures.push(`audiences are invalid: ${course.id}`);
  if (!allowedLanguages.has(course.language)) failures.push(`language is invalid: ${course.id}`);
  if (!course.series || !Number.isInteger(course.lessonNumber) || course.lessonNumber < 1) failures.push(`series metadata is incomplete: ${course.id}`);
  const classroomFile = path.join(classroomsPath, `${course.id}.json`);
  try {
    const classroom = JSON.parse(await readFile(classroomFile, 'utf8'));
    if (classroom.id !== course.id || !classroom.stage?.name || !(classroom.scenes ?? []).length) failures.push(`classroom contract is invalid: ${course.id}`);
  } catch {
    failures.push(`classroom file is missing or invalid: ${course.id}`);
  }
}

for (const series of site.series ?? []) {
  if (!series.slug || seriesSlugs.has(series.slug)) failures.push(`series slug is missing or duplicated: ${series.slug ?? 'missing'}`);
  seriesSlugs.add(series.slug);
  if (!allowedStatuses.has(series.status)) failures.push(`series status is invalid: ${series.slug}=${series.status}`);
  if ((series.lessons ?? []).length && series.lessons.length !== series.lessonCount) failures.push(`lesson count mismatch: ${series.slug}`);
  for (const sourceId of series.sourceIds ?? []) if (!sourceIds.has(sourceId)) failures.push(`unknown source ${sourceId}: ${series.slug}`);
  for (const courseId of series.liveCourseIds ?? []) {
    const course = catalogById.get(courseId);
    if (!course) failures.push(`live course is absent from catalog: ${series.slug}/${courseId}`);
  }
}

for (const course of catalog.courses ?? []) {
  if (!(site.series ?? []).some((series) => (series.liveCourseIds ?? []).includes(course.id))) failures.push(`published course is absent from every live series: ${course.id}`);
}

await access(root);
const report = {
  series: site.series?.length ?? 0,
  publishedCourses: catalog.courses?.length ?? 0,
  openSeries: (site.series ?? []).filter((series) => series.status === 'open').length,
  passed: failures.length === 0,
  failures,
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
