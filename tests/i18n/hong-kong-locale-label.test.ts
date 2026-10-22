import { describe, expect, it } from 'vitest';

import { learnerLocales, supportedLocales } from '@/lib/i18n/locales';
import {
  learnerReadingLanguages,
  learnerSpeechLanguages,
} from '@/lib/learner/language-options';

describe('Hong Kong Traditional Chinese locale label', () => {
  it('shows HK instead of TW in the learner-facing locale switcher', () => {
    const traditionalChinese = supportedLocales.find((locale) => locale.code === 'zh-TW');

    expect(traditionalChinese).toMatchObject({
      label: '繁體中文（香港）',
      shortLabel: 'HK',
    });
  });

  it('limits the learner UI to Traditional Chinese, Simplified Chinese and English', () => {
    expect(learnerLocales.map((locale) => locale.code)).toEqual(['zh-TW', 'zh-CN', 'en-US']);
    expect(learnerReadingLanguages.map((language) => language.code)).toEqual([
      'zh-TW',
      'zh-CN',
      'en-US',
    ]);
  });

  it('keeps speech choices separate as Cantonese, Mandarin and English', () => {
    expect(learnerSpeechLanguages.map((language) => language.code)).toEqual([
      'zh-HK',
      'zh-CN',
      'en-US',
    ]);
  });
});
