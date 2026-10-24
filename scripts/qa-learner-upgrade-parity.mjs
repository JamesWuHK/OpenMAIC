#!/usr/bin/env node
import { pathToFileURL } from 'node:url';

const FIELDS = [
  'name',
  'description',
  'language',
  'gradeRange',
  'series',
  'lessonNumber',
  'sceneCount',
  'publishedAt',
  'interactiveMode',
  'taskEngineMode',
];
const LIST_FIELDS = ['topics', 'audiences'];

async function jsonAt(baseUrl, pathname, fetchImpl) {
  const response = await fetchImpl(new URL(pathname, baseUrl), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${pathname}: HTTP ${response.status}`);
  return response.json();
}

/** Read-only parity check before replacing a learner deployment. */
export async function checkLearnerUpgradeParity({ baselineUrl, candidateUrl, fetchImpl = fetch }) {
  const [baseline, candidate] = await Promise.all([
    jsonAt(baselineUrl, '/api/learner/courses', fetchImpl),
    jsonAt(candidateUrl, '/api/learner/courses', fetchImpl),
  ]);
  if (!Array.isArray(baseline.courses) || !Array.isArray(candidate.courses)) {
    throw new Error('Both catalog responses must contain a courses array');
  }
  if (baseline.courses.length === 0) throw new Error('Baseline catalog is empty');

  const errors = [];
  const candidateById = new Map(candidate.courses.map((course) => [course.id, course]));
  const baselineIds = new Set(baseline.courses.map((course) => course.id));
  if (candidateById.size !== candidate.courses.length)
    errors.push('Candidate catalog has duplicate IDs');
  if (baselineIds.size !== baseline.courses.length)
    errors.push('Baseline catalog has duplicate IDs');
  if (
    JSON.stringify(baseline.courses.map((course) => course.id)) !==
    JSON.stringify(candidate.courses.map((course) => course.id))
  ) {
    errors.push('Candidate catalog order differs from baseline');
  }
  for (const course of baseline.courses) {
    const next = candidateById.get(course.id);
    if (!next) {
      errors.push(`${course.id}: missing from candidate catalog`);
      continue;
    }
    for (const field of FIELDS) {
      if (next[field] !== course[field]) {
        errors.push(
          `${course.id}: ${field} changed (${JSON.stringify(course[field])} -> ${JSON.stringify(next[field])})`,
        );
      }
    }
    for (const field of LIST_FIELDS) {
      if (JSON.stringify(next[field]) !== JSON.stringify(course[field])) {
        errors.push(`${course.id}: ${field} changed`);
      }
    }
    try {
      const document = await jsonAt(
        candidateUrl,
        `/api/persistence/documents/${encodeURIComponent(course.id)}`,
        fetchImpl,
      );
      if (document?.stage?.id !== course.id || !Array.isArray(document.scenes)) {
        errors.push(`${course.id}: candidate classroom document is malformed`);
      } else if (document.scenes.length !== course.sceneCount) {
        errors.push(
          `${course.id}: candidate classroom has ${document.scenes.length} scenes, expected ${course.sceneCount}`,
        );
      }
    } catch (error) {
      errors.push(`${course.id}: classroom unavailable (${error.message})`);
    }
  }
  for (const course of candidate.courses) {
    if (!baselineIds.has(course.id))
      errors.push(`${course.id}: unexpected candidate catalog entry`);
  }
  return {
    baselineCount: baseline.courses.length,
    candidateCount: candidate.courses.length,
    errors,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baselineUrl = process.env.LEARNER_QA_BASELINE_URL;
  const candidateUrl = process.env.LEARNER_QA_CANDIDATE_URL;
  if (!baselineUrl || !candidateUrl) {
    console.error('Set LEARNER_QA_BASELINE_URL and LEARNER_QA_CANDIDATE_URL');
    process.exitCode = 2;
  } else {
    try {
      const result = await checkLearnerUpgradeParity({ baselineUrl, candidateUrl });
      console.log(
        `Learner catalog: baseline ${result.baselineCount}, candidate ${result.candidateCount}`,
      );
      for (const error of result.errors) console.error(`FAIL ${error}`);
      if (result.errors.length) process.exitCode = 1;
      else console.log('PASS learner catalog and classroom document parity');
    } catch (error) {
      console.error(`FAIL learner candidate check: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
