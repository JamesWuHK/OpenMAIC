import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ transcribeAudio: vi.fn() }));

vi.mock('@/lib/audio/asr-providers', () => ({ transcribeAudio: mocks.transcribeAudio }));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

describe('POST /api/transcription model authorization', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('ASR_OPENAI_API_KEY', 'test-server-key');
    delete process.env.ASR_OPENAI_MODELS;
    mocks.transcribeAudio.mockReset();
    mocks.transcribeAudio.mockResolvedValue({ text: 'Hello' });
  });

  afterEach(() => vi.unstubAllEnvs());

  it('ignores a client model when using a managed ASR key without a model list', async () => {
    const form = new FormData();
    form.set('audio', new File(['audio'], 'sample.wav', { type: 'audio/wav' }));
    form.set('providerId', 'openai-whisper');
    form.set('modelId', 'client-unlisted-model');
    const req = new Request('http://localhost/api/transcription', {
      method: 'POST',
      body: form,
    }) as NextRequest;

    const { POST } = await import('@/app/api/transcription/route');
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mocks.transcribeAudio).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: 'openai-whisper',
        modelId: 'gpt-4o-mini-transcribe',
        apiKey: 'test-server-key',
      }),
      expect.any(File),
    );
  });
});
