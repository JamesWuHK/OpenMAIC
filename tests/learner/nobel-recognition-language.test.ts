import { describe, expect, it } from 'vitest';
import { nobelRecognitionLanguage } from '@/lib/learner/nobel-recognition-language';
describe('Nobel voice variants are independent of displayed writing', () => {
  it.each(['hk-nobel-01-kagan-lecture-v4','hk-nobel-06-nagel-lecture-v1','hk-nobel-08-hassabis-illustrated-v1'])('recognizes %s as Cantonese', id => {
    expect(nobelRecognitionLanguage(id)).toBe('zh-HK');
    expect(nobelRecognitionLanguage(id+'-mandarin')).toBe('zh-CN');
  });
  it.each([undefined,'other-course-mandarin','hk-nobel-09-future','prefix-hk-nobel-08-test'])('preserves fallback for %s', id => {
    expect(nobelRecognitionLanguage(id)).toBeUndefined();
  });
});

