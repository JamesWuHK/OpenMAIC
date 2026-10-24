#!/usr/bin/env node
import { pathToFileURL } from 'node:url';

function audioUrls(value, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) audioUrls(item, found);
  } else if (value && typeof value === 'object') {
    if (typeof value.audioUrl === 'string') found.push(value.audioUrl);
    for (const [key, item] of Object.entries(value)) {
      if (key !== 'audioUrl') audioUrls(item, found);
    }
  }
  return found;
}

function samplePositions(length) {
  return [...new Set([0, Math.floor((length - 1) / 2), length - 1])];
}

/** Check actual Range playback for first, middle and last narration in each published lesson. */
export async function checkLearnerCandidateAudio({ candidateUrl, fetchImpl = fetch }) {
  const catalogResponse = await fetchImpl(new URL('/api/learner/courses', candidateUrl), {
    cache: 'no-store',
  });
  if (!catalogResponse.ok) throw new Error(`Catalog: HTTP ${catalogResponse.status}`);
  const catalog = await catalogResponse.json();
  if (!Array.isArray(catalog.courses) || !catalog.courses.length) {
    throw new Error('Candidate catalog is empty');
  }

  const errors = [];
  let sampled = 0;
  for (const course of catalog.courses) {
    const id = course.id;
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(id)) {
      errors.push(`Invalid course ID: ${JSON.stringify(id)}`);
      continue;
    }
    let document;
    try {
      let response = await fetchImpl(
        new URL(`/api/persistence/documents/${encodeURIComponent(id)}`, candidateUrl),
        { cache: 'no-store' },
      );
      if (response.status === 404) {
        response = await fetchImpl(
          new URL(`/api/classroom?id=${encodeURIComponent(id)}`, candidateUrl),
          { cache: 'no-store' },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        document = (await response.json()).classroom;
      } else {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        document = await response.json();
      }
    } catch (error) {
      errors.push(`${id}: classroom unavailable (${error.message})`);
      continue;
    }
    if (document?.stage?.id !== id || !Array.isArray(document.scenes)) {
      errors.push(`${id}: malformed classroom document`);
      continue;
    }
    const urls = [...new Set(audioUrls(document.scenes))];
    if (!urls.length) {
      errors.push(`${id}: no narration audio URLs`);
      continue;
    }
    for (const position of samplePositions(urls.length)) {
      const pathname = urls[position];
      if (!pathname.startsWith(`/api/classroom-media/${id}/`)) {
        errors.push(`${id}: narration URL is outside its classroom media path`);
        continue;
      }
      sampled++;
      try {
        const response = await fetchImpl(new URL(pathname, candidateUrl), {
          cache: 'no-store',
          headers: { Range: 'bytes=0-1023' },
        });
        if (response.status !== 206) throw new Error(`HTTP ${response.status}, expected 206`);
        if (!response.headers.get('content-type')?.startsWith('audio/mpeg')) {
          throw new Error(`unexpected content type ${response.headers.get('content-type')}`);
        }
        if (!response.headers.get('content-range')?.startsWith('bytes 0-')) {
          throw new Error('missing or invalid Content-Range');
        }
        if ((await response.arrayBuffer()).byteLength === 0) throw new Error('empty audio body');
      } catch (error) {
        errors.push(`${id}: audio sample ${position + 1}/${urls.length} failed (${error.message})`);
      }
    }
  }
  return { courses: catalog.courses.length, sampled, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const candidateUrl = process.env.LEARNER_QA_CANDIDATE_URL;
  if (!candidateUrl) {
    console.error('Set LEARNER_QA_CANDIDATE_URL');
    process.exitCode = 2;
  } else {
    try {
      const result = await checkLearnerCandidateAudio({ candidateUrl });
      console.log(`Learner audio: ${result.courses} courses, ${result.sampled} sampled clips`);
      for (const error of result.errors) console.error(`FAIL ${error}`);
      if (result.errors.length) process.exitCode = 1;
      else console.log('PASS first/middle/last narration Range responses');
    } catch (error) {
      console.error(`FAIL learner audio: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
