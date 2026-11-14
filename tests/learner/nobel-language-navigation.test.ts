import { describe, expect, it } from 'vitest';
import { nobelVoicePairIds, getNobelVoicePair, getNobelClassroomId, getNobelVoiceTarget, getNobelVoiceHref, parseNobelSceneOrder, getNobelVoiceDescription } from '@/lib/learner/nobel-language-navigation';

describe('one Nobel language control', () => {
  it.each(nobelVoicePairIds)('maps both reviewed voice versions of %s', (base) => {
    expect(getNobelVoiceTarget(base, 'zh-CN')).toBe(base + '-mandarin');
    expect(getNobelVoiceTarget(base + '-mandarin', 'zh-TW')).toBe(base);
    expect(getNobelVoiceTarget(base, 'zh-TW')).toBeNull();
    expect(getNobelVoiceTarget(base + '-mandarin', 'zh-CN')).toBeNull();
    expect(getNobelClassroomId('/classroom/' + base)).toBe(base);
    expect(getNobelVoicePair(base + '-mandarin')?.mandarin).toBe(true);
  });
  it('keeps English UI-only with an explicit current-voice description', () => {
    const id = nobelVoicePairIds[0];
    expect(getNobelVoiceTarget(id, 'en-US')).toBeNull();
    expect(getNobelVoiceDescription(id, 'en-US')).toBe('UI only · Cantonese narration');
    expect(getNobelVoiceDescription(id + '-mandarin', 'en-US')).toBe('UI only · Mandarin narration');
  });
  it('does not redirect unrelated or unreviewed courses', () => {
    for (const id of ['other-course', 'hk-nobel-09-new-illustrated-v1', 'hk-nobel-01-kagan-lecture-v4', '//evil.example', nobelVoicePairIds[0] + '-mandarin-mandarin']) {
      expect(getNobelVoicePair(id)).toBeNull();
      expect(getNobelVoiceTarget(id, 'zh-CN')).toBeNull();
      expect(getNobelVoiceHref(id, 2)).toBeNull();
    }
    expect(getNobelClassroomId('/series/nobel-curiosity-lab')).toBeNull();
    expect(getNobelClassroomId('/classroom/' + nobelVoicePairIds[0] + '/edit')).toBeNull();
  });
  it('passes only bounded integer scene orders', () => {
    const id = nobelVoicePairIds[1];
    expect(getNobelVoiceHref(id, 4)).toBe('/classroom/' + id + '?nobelScene=4');
    expect(getNobelVoiceHref(id, 0)).toContain('nobelScene=0');
    for (const value of [-1, 100, NaN, 1.5, undefined]) expect(getNobelVoiceHref(id, value)).toBe('/classroom/' + id);
    expect(parseNobelSceneOrder('4')).toBe(4);
    expect(parseNobelSceneOrder('0')).toBe(0);
    for (const value of ['-1', '100', '1.5', '01', 'NaN', '', null]) expect(parseNobelSceneOrder(value)).toBeNull();
  });
});
