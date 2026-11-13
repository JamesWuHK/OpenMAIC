import { afterEach, describe, expect, it, vi } from 'vitest';
import { transcribeAudio } from '@/lib/audio/asr-providers';

afterEach(() => vi.unstubAllGlobals());

describe('Azure recording upload contract', () => {
  it.each(['zh-HK', 'zh-CN', 'en-US'])('uploads WAV with its correct filename and %s locale', async (language) => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const form = init.body as FormData;
      const file = form.get('audio') as File;
      expect(file.name).toBe('recording.wav');
      expect(file.type).toBe('audio/wav');
      expect(JSON.parse(String(form.get('definition')))).toEqual({ locales: [language] });
      return Response.json({ combinedPhrases: [{ text: 'Recognized question' }] });
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await transcribeAudio({
      providerId: 'azure-asr', apiKey: 'synthetic-test-key',
      baseUrl: 'https://example.api.cognitive.microsoft.com', language,
    }, new Blob(['RIFF-test-audio'], { type: 'audio/wav' }));
    expect(result.text).toBe('Recognized question');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
