import { describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  resolveModelFromRequest: vi.fn(),
  callLLM: vi.fn(),
}));

vi.mock('@/lib/server/resolve-model', () => ({
  resolveModelFromRequest: mocks.resolveModelFromRequest,
}));
vi.mock('@/lib/ai/llm', () => ({ callLLM: mocks.callLLM }));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

describe('POST /api/quiz-grade model authorization', () => {
  it('returns 403 before grading with an unauthorized managed model', async () => {
    mocks.resolveModelFromRequest.mockRejectedValue(
      Object.assign(new Error('This model is not authorized for server-managed credentials'), {
        code: 'PROVIDER_DISABLED',
      }),
    );
    const { POST } = await import('@/app/api/quiz-grade/route');
    const req = new Request('http://localhost/api/quiz-grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Why?', userAnswer: 'Because', points: 1 }),
    }) as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ errorCode: 'PROVIDER_DISABLED' });
    expect(mocks.callLLM).not.toHaveBeenCalled();
  });
});
