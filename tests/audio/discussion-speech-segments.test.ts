import { describe, expect, it } from 'vitest';
import { takeCompleteSpeechSegments } from '@/lib/audio/discussion-speech-segments';

describe('takeCompleteSpeechSegments', () => {
  it('releases complete Chinese sentences while holding an unfinished tail', () => {
    expect(takeCompleteSpeechSegments('先看雷达图。雨势仍不能确定')).toEqual({
      segments: ['先看雷达图。'],
      remainder: '雨势仍不能确定',
    });
  });

  it('keeps closing quotation marks with the sentence and handles multiple boundaries', () => {
    expect(takeCompleteSpeechSegments('他说：「先观察！」然后再判断。')).toEqual({
      segments: ['他说：「先观察！」', '然后再判断。'],
      remainder: '',
    });
  });

  it('does not split on commas or decimal points', () => {
    expect(takeCompleteSpeechSegments('雨量 1.5 毫米，先记录再比较')).toEqual({
      segments: [],
      remainder: '雨量 1.5 毫米，先记录再比较',
    });
  });

  it('releases a substantial complete clause at a comma as soon as that clause arrives', () => {
    expect(takeCompleteSpeechSegments('雷達上較亮的回波通常較強，')).toEqual({
      segments: ['雷達上較亮的回波通常較強，'],
      remainder: '',
    });
  });
});
