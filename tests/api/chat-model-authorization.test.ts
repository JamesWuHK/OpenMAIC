import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  resolveModel: vi.fn(),
  statelessGenerate: vi.fn(),
}));

vi.mock('@/lib/server/resolve-model', () => ({ resolveModel: mocks.resolveModel }));
vi.mock('@/lib/orchestration/stateless-generate', () => ({
  statelessGenerate: mocks.statelessGenerate,
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

describe('POST /api/chat model authorization', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.resolveModel.mockReset();
    mocks.statelessGenerate.mockReset();
  });

  it('returns 403 without starting a discussion for a denied managed model', async () => {
    mocks.resolveModel.mockRejectedValue(
      Object.assign(new Error('This model is not authorized for server-managed credentials'), {
        code: 'PROVIDER_DISABLED',
      }),
    );
    const { POST } = await import('@/app/api/chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ id: 'user-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
        storeState: { stage: {}, scenes: [], currentSceneId: null, mode: 'interactive' },
        config: { agentIds: ['teacher'] },
        model: 'openai:unlisted-model',
      }),
    }) as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ errorCode: 'PROVIDER_DISABLED' });
    expect(mocks.statelessGenerate).not.toHaveBeenCalled();
  });
});
