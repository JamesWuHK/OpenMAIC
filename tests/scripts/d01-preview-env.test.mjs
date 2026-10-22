import test from 'node:test';
import assert from 'node:assert/strict';
import { buildD01PreviewEnv, D01_QA_MODEL } from '../../scripts/run-d01-openrouter-preview.mjs';

test('D01 local QA pins the tested free conversational model and blocks stale Ark defaults', () => {
  const source = { OPENROUTER_API_KEY: 'synthetic-test-only', DOUBAO_API_KEY: 'retired',
    DOUBAO_BASE_URL: 'retired', DOUBAO_MODELS: 'retired', DEFAULT_MODEL: 'doubao:retired',
    MODEL_ROUTES: '{"pbl-v2-runtime":"doubao:retired"}', TTS_EDGE_ENABLED: 'true' };
  const env = buildD01PreviewEnv(source);
  assert.ok(D01_QA_MODEL.endsWith(':free'));
  assert.notEqual(D01_QA_MODEL, 'openrouter/free');
  for (const key of ['DOUBAO_API_KEY', 'DOUBAO_BASE_URL', 'DOUBAO_MODELS']) assert.equal(env[key], '');
  assert.equal(env.DEFAULT_MODEL, `openrouter:${D01_QA_MODEL}`);
  assert.equal(JSON.parse(env.MODEL_ROUTES)['pbl-v2-runtime'].model, env.DEFAULT_MODEL);
  assert.equal(env.OPENROUTER_API_KEY, source.OPENROUTER_API_KEY);
  assert.equal(env.TTS_EDGE_ENABLED, 'true');
  assert.equal(source.DOUBAO_API_KEY, 'retired');
});

test('D01 local QA fails closed without an explicitly supplied key', () => {
  assert.throws(() => buildD01PreviewEnv({}), /must be supplied securely/);
  assert.throws(() => buildD01PreviewEnv({ OPENROUTER_API_KEY: '  ' }), /must be supplied securely/);
});
