import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { learnerBoundaryDecision } from '../../lib/learner/boundary.ts';

const moduleResult = await import('../../lib/learner/discussion-speech.ts').catch(() => null);

test('learner discussion speech service is available', () => {
  assert.ok(moduleResult, 'learner speech handler must exist independently of authoring TTS');
});

const course = {
  id: 'lesson',
  stage: { generatedAgentConfigs: [
    { id: 'teacher', role: 'teacher' },
    { id: 'assistant', role: 'assistant' },
    { id: 'student', role: 'student' },
  ] },
};

function setup(overrides = {}) {
  const calls = [];
  const handler = moduleResult.createLearnerSpeechHandler({
    enabled: () => true,
    publishedIds: async () => ['lesson'],
    readClassroom: async () => course,
    synthesize: async (config, text) => {
      calls.push({config, text});
      return { audio: new Uint8Array([73, 68, 51, 1]), format: 'mp3' };
    },
    ...overrides,
  });
  const request = (body = {}, headers = {}) => new Request('https://class.wanli.ai/api/learner/speech', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://class.wanli.ai', ...headers },
    body: JSON.stringify({ classroomId: 'lesson', agentId: 'teacher', text: '早晨，一齊討論。', ...body }),
  });
  return { handler, calls, request };
}

test('teacher and assistant receive playable audio with distinct Cantonese voices', {skip: !moduleResult}, async () => {
  const {handler, calls, request} = setup();
  for (const agentId of ['teacher', 'assistant', 'student']) {
    const response = await handler(request({agentId}));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const body = await response.json();
    assert.equal(body.format, 'mp3');
    assert.ok(Buffer.from(body.base64, 'base64').length > 0);
  }
  assert.deepEqual(calls.map(c => c.config.voice), ['zh-HK-WanLungNeural', 'zh-HK-HiuMaanNeural', 'zh-HK-HiuGaaiNeural']);
  assert.ok(calls.every(c => c.config.providerId === 'edge-tts' && c.config.speed === 1.2));
});

test('rejects client providers, URLs, credentials, oversized text, unknown roles and drafts', {skip: !moduleResult}, async () => {
  const {handler, calls, request} = setup();
  for (const body of [
    {ttsBaseUrl: 'http://127.0.0.1'}, {ttsApiKey: 'x'}, {ttsProviderId: 'openai-tts'},
    {text: 'x'.repeat(2001)}, {text: ' '}, {classroomId: '../lesson'},
    {agentId: 'unknown'}, {classroomId: 'draft'},
  ]) assert.ok((await handler(request(body))).status >= 400);
  assert.equal(calls.length, 0);
});

test('rejects cross-site requests and authoring deployments', {skip: !moduleResult}, async () => {
  const {handler, calls, request} = setup();
  assert.equal((await handler(request({}, {origin:'https://other.example'}))).status, 403);
  assert.equal((await setup({enabled: () => false}).handler(request())).status, 404);
  assert.equal(calls.length, 0);
});

test('bounds concurrency and releases a slot after provider failure', {skip: !moduleResult}, async () => {
  let release;
  const {handler, request} = setup({maxConcurrent: 1, synthesize: () => new Promise((_, reject) => {release = reject;})});
  const pending = handler(request());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal((await handler(request())).status, 429);
  release(new Error('private upstream details'));
  const failed = await pending;
  assert.equal(failed.status, 502);
  assert.ok(!(await failed.text()).includes('private upstream details'));
  const again = handler(request());
  await new Promise(resolve => setImmediate(resolve));
  release(new Error('again'));
  assert.equal((await again).status, 502);
});

test('rejects malformed JSON and empty audio without claiming success', {skip: !moduleResult}, async () => {
  const {handler, request} = setup({synthesize: async () => ({audio: new Uint8Array(), format:'mp3'})});
  assert.equal((await handler(new Request('https://class.wanli.ai/api/learner/speech', {method:'POST', body:'{'}))).status, 400);
  assert.equal((await handler(request())).status, 502);
});

test('preserves authoring boundary while allowing only the separate learner speech path', () => {
  assert.equal(learnerBoundaryDecision({method:'POST', pathname:'/api/learner/speech'}), 'allow');
  for (const pathname of ['/api/generate/tts', '/api/generate/scene-content', '/api/server-providers']) {
    assert.equal(learnerBoundaryDecision({method:'POST', pathname}), 'not-found');
  }
});

test('propagates cancellation to speech generation and rejects excessive request bytes', {skip: !moduleResult}, async () => {
  let providerSignal;
  const {handler, request} = setup({synthesize: async config => {
    providerSignal = config.signal;
    await new Promise((_, reject) => config.signal.addEventListener('abort', () => reject(config.signal.reason), {once:true}));
  }});
  const controller = new AbortController();
  const pending = handler(new Request(request(), {signal: controller.signal}));
  await new Promise(resolve => setImmediate(resolve));
  controller.abort();
  assert.equal((await pending).status, 502);
  assert.equal(providerSignal.aborted, true);
  const oversized = new Request('https://class.wanli.ai/api/learner/speech', {method:'POST', body:'x'.repeat(17000)});
  assert.equal((await handler(oversized)).status, 400);
});

test('real Edge synthesis produces decodable nonempty speech for each classroom role', {
  skip: process.env.LEARNER_SPEECH_LIVE !== '1' || !moduleResult,
}, async () => {
  const exec = promisify(execFile);
  const directory = await mkdtemp(join(tmpdir(), 'learner-speech-live-'));
  try {
    const {handler, request} = setup({synthesize: async (config, text) => {
      const output = join(directory, `${config.voice}.mp3`);
      await exec(process.env.TTS_EDGE_BIN || 'edge-tts', [
        '--text', text, '--voice', config.voice, '--rate=+20%', '--write-media', output,
      ], {signal: config.signal, timeout: 30_000});
      const audio = await readFile(output);
      const {stdout} = await exec('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', output]);
      assert.ok(Number(JSON.parse(stdout).format.duration) > 0.5);
      return {audio, format: 'mp3'};
    }});
    for (const agentId of ['teacher', 'assistant', 'student']) {
      const response = await handler(request({agentId}));
      assert.equal(response.status, 200, agentId);
      assert.ok(Buffer.from((await response.json()).base64, 'base64').length > 1000);
    }
  } finally { await rm(directory, {recursive:true, force:true}); }
});
