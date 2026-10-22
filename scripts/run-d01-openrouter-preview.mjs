#!/usr/bin/env node
// Local QA only. Supply the authorized key through the process environment;
// never put it in command arguments, tracked files, or logs.
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const D01_QA_MODEL = 'minimax/minimax-m3.1-flash:free';

export function buildD01PreviewEnv(source) {
  if (!source.OPENROUTER_API_KEY?.trim()) {
    throw new Error('OPENROUTER_API_KEY must be supplied securely before starting local QA.');
  }
  const model = `openrouter:${D01_QA_MODEL}`;
  return {
    ...source,
    NODE_OPTIONS: '--max-old-space-size=2048',
    // Empty overrides prevent Next.js from reloading retired values in .env.local.
    DOUBAO_API_KEY: '',
    DOUBAO_BASE_URL: '',
    DOUBAO_MODELS: '',
    OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
    OPENROUTER_MODELS: D01_QA_MODEL,
    DEFAULT_MODEL: model,
    MODEL_ROUTES: JSON.stringify({ 'pbl-v2-runtime': { model, thinking: { mode: 'disabled' } } }),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const child = spawn('pnpm', ['dev', '--hostname', '127.0.0.1', '--port', '3000'], {
    stdio: 'inherit',
    env: buildD01PreviewEnv(process.env),
  });
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
  child.on('error', () => { console.error('Could not start the local preview process.'); process.exitCode = 1; });
  child.on('exit', (code, signal) => {
    console.log(JSON.stringify({ event: 'd01-preview-exit', code, signal }));
    process.exitCode = code ?? 1;
  });
}
