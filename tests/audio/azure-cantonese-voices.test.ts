import { afterEach, describe, expect, it, vi } from 'vitest';

import { TTS_PROVIDERS } from '@/lib/audio/constants';
import { generateTTS } from '@/lib/audio/tts-providers';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Azure Hong Kong Cantonese voice presets', () => {
  it('exposes the supported zh-HK neural voices with stable metadata', () => {
    const voices = TTS_PROVIDERS['azure-tts'].voices.filter((voice) => voice.language === 'zh-HK');

    expect(voices).toEqual([
      {
        id: 'zh-HK-HiuMaanNeural',
        name: 'HiuMaan（香港粤语女声）',
        language: 'zh-HK',
        gender: 'female',
      },
      {
        id: 'zh-HK-HiuGaaiNeural',
        name: 'HiuGaai（香港粤语女声）',
        language: 'zh-HK',
        gender: 'female',
      },
      {
        id: 'zh-HK-WanLungNeural',
        name: 'WanLung（香港粤语男声）',
        language: 'zh-HK',
        gender: 'male',
      },
    ]);
  });

  it('sends Cantonese text with a zh-HK SSML language context', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await generateTTS(
      {
        providerId: 'azure-tts',
        apiKey: 'test-only-key',
        baseUrl: 'https://hongkong.tts.speech.microsoft.com',
        voice: 'zh-HK-HiuMaanNeural',
      },
      '今日我哋一齊學下點樣分辨網上資料係咪可靠。',
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://hongkong.tts.speech.microsoft.com/cognitiveservices/v1');
    expect(request.body).toContain("<speak version='1.0' xml:lang='zh-HK'>");
    expect(request.body).toContain("<voice xml:lang='zh-HK' name='zh-HK-HiuMaanNeural'>");
  });
});
