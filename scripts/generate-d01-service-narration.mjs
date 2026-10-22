#!/usr/bin/env node
// Generate course assets through our existing student speech service. This
// does not publish classrooms, change the server, or use hosted generation.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { collectSpeechJobs, applyGeneratedAudioRefs } from './regenerate-classroom-edge-tts.mjs';

const origin = 'https://class.wanli.ai';
const transportClassroom = 'hk-s04-01-radar-rain';
const root = path.resolve('output/d01-openmaic-candidates');
const cacheDir = path.join(root, 'service-speech-cache');
await mkdir(cacheDir, { recursive: true });
const rosterResponse = await fetch(`${origin}/api/classroom?id=${transportClassroom}`, { signal: AbortSignal.timeout(15000) });
if (!rosterResponse.ok) throw new Error(`Speech roster unavailable (${rosterResponse.status}).`);
const roster = await rosterResponse.json();
const classroom = roster.classroom ?? roster.data ?? roster;
const teacher = classroom.stage?.generatedAgentConfigs?.find(agent => agent.role === 'teacher');
if (!teacher || classroom.id !== transportClassroom) throw new Error('Existing teacher speech identity is missing.');

for (let n = 1; n <= 6; n++) {
  const lesson = `D01-${String(n).padStart(2, '0')}`;
  const filename = path.join(root, `${lesson}-local-assembled.json`);
  const candidate = JSON.parse(await readFile(filename, 'utf8'));
  const mediaDir = path.join(root, candidate.id, 'media');
  await mkdir(mediaDir, { recursive: true });
  const ids = new Set();
  const manifest = { source: `${origin}/api/learner/speech`, transportClassroom, speakerRole: 'teacher',
    serviceConfig: 'server-managed; request exposes neither provider credentials nor voice/speed overrides', actions: {} };
  for (const job of collectSpeechJobs(candidate)) {
    const fingerprint = createHash('sha256').update(JSON.stringify({ source: manifest.source, speaker: teacher.id, text: job.text })).digest('hex');
    const cached = path.join(cacheDir, `${fingerprint}.mp3`);
    let audio;
    try { audio = await readFile(cached); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (!audio) {
      const response = await fetch(manifest.source, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId: transportClassroom, agentId: teacher.id, text: job.text }), signal: AbortSignal.timeout(35000) });
      if (!response.ok) throw new Error(`${lesson}/${job.actionId}: speech service ${response.status}; no classroom audio refs committed for this lesson.`);
      const result = await response.json();
      if (result.format !== 'mp3' || typeof result.base64 !== 'string') throw new Error('Unexpected speech format.');
      audio = Buffer.from(result.base64, 'base64');
      if (audio.length < 1000) throw new Error('Speech response is empty or truncated.');
      await writeFile(cached, audio, { flag: 'wx' });
    }
    await writeFile(path.join(mediaDir, job.filename), audio);
    manifest.actions[job.actionId] = { fingerprint, filename: job.filename,
      audioSha256: createHash('sha256').update(audio).digest('hex') };
    ids.add(job.actionId);
    console.log(`${lesson}: ${job.actionId} (${audio.length} bytes)`);
  }
  applyGeneratedAudioRefs(candidate, ids);
  await writeFile(path.join(mediaDir, 'service-speech-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(`${filename}.speech.tmp`, `${JSON.stringify(candidate, null, 2)}\n`);
  await rename(`${filename}.speech.tmp`, filename);
}
console.log('Six lesson narration assets generated; browser playback and final release are separate gates.');
