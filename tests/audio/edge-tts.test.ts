import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  execFile: vi.fn(),
  mkdtemp: vi.fn(),
  readFile: vi.fn(),
  rm: vi.fn(),
}));

vi.mock('node:child_process', () => ({ execFile: mocks.execFile }));
vi.mock('node:fs/promises', () => ({
  mkdtemp: mocks.mkdtemp,
  readFile: mocks.readFile,
  rm: mocks.rm,
}));

import { DEFAULT_TTS_VOICES, TTS_PROVIDERS } from '@/lib/audio/constants';
import { generateTTS } from '@/lib/audio/tts-providers';
import type { TTSProviderId } from '@/lib/audio/types';

describe('Edge TTS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('TTS_EDGE_BIN', '/opt/edge-tts');
    mocks.mkdtemp.mockResolvedValue('/tmp/openmaic-edge-tts');
    mocks.readFile.mockResolvedValue(Buffer.from([0x49, 0x44, 0x33, 0x04]));
    mocks.rm.mockResolvedValue(undefined);
    mocks.execFile.mockImplementation(
      (_file: string, _args: string[], _options: object, callback: (error: Error | null) => void) =>
        callback(null),
    );
  });

  it('publishes separate Cantonese and Mandarin voices with Cantonese as the default', () => {
    const provider = TTS_PROVIDERS['edge-tts'];

    expect(provider.requiresApiKey).toBe(false);
    expect(provider.voices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'zh-HK-HiuMaanNeural', language: 'zh-HK' }),
        expect.objectContaining({ id: 'zh-CN-XiaoxiaoNeural', language: 'zh-CN' }),
      ]),
    );
    expect(DEFAULT_TTS_VOICES['edge-tts']).toBe('zh-HK-HiuMaanNeural');
  });

  it('generates an mp3 through the local edge-tts executable without an API key', async () => {
    const result = await generateTTS(
      {
        providerId: 'edge-tts' as TTSProviderId,
        voice: 'zh-HK-HiuMaanNeural',
        speed: 1.1,
      },
      '早晨，今日我哋一齊學人工智能。',
    );

    expect(mocks.execFile).toHaveBeenCalledWith(
      '/opt/edge-tts',
      [
        '--text',
        '早晨，今日我哋一齊學人工智能。',
        '--voice',
        'zh-HK-HiuMaanNeural',
        '--rate',
        '+10%',
        '--write-media',
        '/tmp/openmaic-edge-tts/speech.mp3',
      ],
      expect.objectContaining({ timeout: 30_000 }),
      expect.any(Function),
    );
    expect(Array.from(result.audio)).toEqual([0x49, 0x44, 0x33, 0x04]);
    expect(result.format).toBe('mp3');
    expect(mocks.rm).toHaveBeenCalledWith('/tmp/openmaic-edge-tts', {
      recursive: true,
      force: true,
    });
  });
});
