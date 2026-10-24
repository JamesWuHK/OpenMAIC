#!/usr/bin/env node
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';

const ROLES = ['teacher', 'assistant', 'student'];
const SYNTHETIC_TEXT = '呢個想法幾有趣，我哋一齊試下。';

async function jsonAt(baseUrl, pathname, fetchImpl) {
  const response = await fetchImpl(new URL(pathname, baseUrl), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${pathname}: HTTP ${response.status}`);
  return response.json();
}

async function classroomAt(baseUrl, id, fetchImpl) {
  const response = await fetchImpl(
    new URL(`/api/persistence/documents/${encodeURIComponent(id)}`, baseUrl),
    { cache: 'no-store' },
  );
  if (response.status === 404) {
    const legacy = await jsonAt(baseUrl, `/api/classroom?id=${encodeURIComponent(id)}`, fetchImpl);
    return legacy.classroom;
  }
  if (!response.ok) throw new Error(`${id}: document HTTP ${response.status}`);
  return response.json();
}

function isMp3(bytes) {
  return (
    (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  );
}

/** Synthetic-text HTTP smoke of the three published learner discussion voices. */
export async function checkLearnerCandidateSpeech({
  candidateUrl,
  fetchImpl = fetch,
  now = () => performance.now(),
}) {
  const catalog = await jsonAt(candidateUrl, '/api/learner/courses', fetchImpl);
  if (!Array.isArray(catalog.courses) || !catalog.courses.length) {
    throw new Error('Candidate catalog is empty');
  }
  let selected;
  for (const course of catalog.courses) {
    if (typeof course.id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(course.id)) continue;
    const document = await classroomAt(candidateUrl, course.id, fetchImpl);
    const agents = document?.stage?.generatedAgentConfigs;
    if (!Array.isArray(agents)) continue;
    const byRole = new Map(agents.map((agent) => [agent.role, agent.id]));
    if (ROLES.every((role) => typeof byRole.get(role) === 'string')) {
      selected = { id: course.id, byRole };
      break;
    }
  }
  if (!selected) throw new Error('No published classroom has all three discussion roles');

  const results = [];
  const errors = [];
  for (const role of ROLES) {
    const started = now();
    try {
      const response = await fetchImpl(new URL('/api/learner/speech', candidateUrl), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: new URL(candidateUrl).origin,
        },
        body: JSON.stringify({
          classroomId: selected.id,
          agentId: selected.byRole.get(role),
          text: SYNTHETIC_TEXT,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json();
      if (body.format !== 'mp3' || typeof body.base64 !== 'string') {
        throw new Error('Unexpected speech response format');
      }
      const bytes = Buffer.from(body.base64, 'base64');
      if (bytes.byteLength < 1000 || !isMp3(bytes)) throw new Error('Speech is not a nonempty MP3');
      results.push({ role, bytes: bytes.byteLength, latencyMs: Math.round(now() - started) });
    } catch (error) {
      errors.push(`${role}: ${error.message} after ${Math.round(now() - started)} ms`);
    }
  }
  return { courseId: selected.id, results, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const candidateUrl = process.env.LEARNER_QA_CANDIDATE_URL;
  if (!candidateUrl) {
    console.error('Set LEARNER_QA_CANDIDATE_URL');
    process.exitCode = 2;
  } else {
    try {
      const result = await checkLearnerCandidateSpeech({ candidateUrl });
      console.log(`Learner discussion speech: ${result.courseId}`);
      for (const item of result.results) {
        console.log(`${item.role}: ${item.bytes} bytes, ${item.latencyMs} ms`);
      }
      for (const error of result.errors) console.error(`FAIL ${error}`);
      if (result.errors.length) process.exitCode = 1;
      else console.log('PASS three learner discussion voices over HTTP');
    } catch (error) {
      console.error(`FAIL learner discussion speech: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
