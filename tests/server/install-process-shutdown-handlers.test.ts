import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const moduleUrl = pathToFileURL(resolve('lib/server/install-process-shutdown-handlers.ts')).href;

function runShutdown(signal: 'SIGTERM' | 'SIGINT', framework = true, failure = false) {
  return new Promise<{ code: number | null; output: string; error: string }>((done, reject) => {
    const child = spawn(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `
      import { installProcessShutdownHandlers } from ${JSON.stringify(moduleUrl)};
      if (${framework}) process.once(${JSON.stringify(signal)}, (signal) => {
        console.log('framework:' + signal);
        process.exit(signal === 'SIGTERM' ? 143 : 130);
      });
      installProcessShutdownHandlers(async () => {
        console.log('cleanup:start');
        await new Promise(resolve => setTimeout(resolve, 100));
        if (${failure}) throw new Error('test cleanup failure');
        console.log('cleanup:end');
      });
      setInterval(() => {}, 1000);
      console.log('ready');
    `,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let output = '';
    let error = '';
    let started = false;
    let repeated = false;
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Shutdown did not finish: ' + output + error));
    }, 5000);
    child.stdout.on('data', (data) => {
      output += data;
      if (!started && output.includes('ready')) {
        started = true;
        child.kill(signal);
      }
      if (!repeated && output.includes('cleanup:start')) {
        repeated = true;
        child.kill(signal);
      }
    });
    child.stderr.on('data', (data) => {
      error += data;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timeout);
      done({ code, output, error });
    });
  });
}

describe('process shutdown', () => {
  it.each([
    ['SIGTERM', 143],
    ['SIGINT', 130],
  ] as const)('drains once before handing %s back to the server', async (signal, code) => {
    const result = await runShutdown(signal);
    expect(result.output.trim().split('\n')).toEqual([
      'ready',
      'cleanup:start',
      'cleanup:end',
      'framework:' + signal,
    ]);
    expect(result.code).toBe(code);
  });
  it('exits after draining when there is no framework signal handler', async () => {
    const result = await runShutdown('SIGTERM', false);
    expect(result.output.trim().split('\n')).toEqual(['ready', 'cleanup:start', 'cleanup:end']);
    expect(result.code).toBe(143);
  });
  it('still hands off to the server when cleanup rejects', async () => {
    const result = await runShutdown('SIGTERM', true, true);
    expect(result.output.trim().split('\n')).toEqual([
      'ready',
      'cleanup:start',
      'framework:SIGTERM',
    ]);
    expect(result.error).toContain('test cleanup failure');
    expect(result.code).toBe(143);
  });
});
