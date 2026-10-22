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
  ] as const)('drains once before the server exits on %s', async (signal, code) => {
    const result = await runShutdown(signal);
    expect(result.output.trim().split('\n')).toEqual([
      'ready',
      'framework:' + signal,
      'cleanup:start',
      'cleanup:end',
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
      'framework:SIGTERM',
      'cleanup:start',
    ]);
    expect(result.error).toContain('test cleanup failure');
    expect(result.code).toBe(143);
  });

  it('keeps shared resources available until in-flight HTTP requests finish', async () => {
    const result = await new Promise<{ code: number | null; output: string; error: string }>(
      (done, reject) => {
        const child = spawn(
          process.execPath,
          [
            '--input-type=module',
            '--eval',
            `
          import http from 'node:http';
          import { installProcessShutdownHandlers } from ${JSON.stringify(moduleUrl)};
          let resourceClosed = false;
          const server = http.createServer((_request, response) => {
            console.log('request:start');
            setTimeout(() => {
              console.log(resourceClosed ? 'request:failed' : 'request:ok');
              response.end('done');
            }, 150);
          });
          process.on('SIGTERM', () => {
            server.close(() => {
              console.log('http:drained');
              process.exit(143);
            });
          });
          installProcessShutdownHandlers(async () => {
            resourceClosed = true;
            console.log('resource:closed');
          });
          server.listen(0, '127.0.0.1', () => {
            http.get('http://127.0.0.1:' + server.address().port, {
              headers: { connection: 'close' }
            }, response => response.resume()).on('error', () => {});
          });
        `,
          ],
          { stdio: ['ignore', 'pipe', 'pipe'] },
        );
        let output = '';
        let error = '';
        let signaled = false;
        const timeout = setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(output + error));
        }, 5000);
        child.stdout.on('data', (data) => {
          output += data;
          if (!signaled && output.includes('request:start')) {
            signaled = true;
            child.kill('SIGTERM');
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
      },
    );
    expect(result.output.trim().split('\n')).toEqual([
      'request:start',
      'request:ok',
      'http:drained',
      'resource:closed',
    ]);
    expect(result.code).toBe(143);
  });
});
