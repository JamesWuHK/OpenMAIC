import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const MODE = 'OPENMAIC_DEPLOYMENT_MODE';
const PUBLIC_MODE = 'NEXT_PUBLIC_OPENMAIC_DEPLOYMENT_MODE';
const ACCESS_CODE = 'ACCESS_CODE';
const originals = new Map<string, string | undefined>();

beforeEach(() => {
  vi.resetModules();
  for (const key of [MODE, PUBLIC_MODE, ACCESS_CODE]) {
    originals.set(key, process.env[key]);
    delete process.env[key];
  }
});

afterEach(() => {
  for (const [key, value] of originals) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  originals.clear();
});

describe('learner middleware wiring', () => {
  it('returns 404 for a generation request before access-code handling', async () => {
    process.env[MODE] = 'learner';
    const { middleware } = await import('@/middleware');

    const response = await middleware(
      new NextRequest('http://localhost/api/generate/scene-content', { method: 'POST' }),
    );

    expect(response.status).toBe(404);
  });

  it('keeps learner health checks reachable', async () => {
    process.env[MODE] = 'learner';
    const { middleware } = await import('@/middleware');

    const response = await middleware(new NextRequest('http://localhost/api/health'));

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('preserves the full deployment request surface', async () => {
    process.env[MODE] = 'full';
    const { middleware } = await import('@/middleware');

    const response = await middleware(
      new NextRequest('http://localhost/api/generate/scene-content', { method: 'POST' }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});
