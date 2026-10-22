import { describe, expect, it } from 'vitest';
import { pblFailureMessage } from '@/lib/pbl/v2/learner-error';

describe('PBL learner-facing model failure text', () => {
  it('uses Hong Kong Traditional Chinese without leaking provider diagnostics', () => {
    const coach = pblFailureMessage('coach', 'zh-HK');
    const evaluation = pblFailureMessage('evaluation', 'zh-HK');
    expect(coach).toContain('AI 教練');
    expect(evaluation).toContain('作品已保存');
    expect(evaluation).toContain('毋須重複提交');
    expect(coach + evaluation).not.toMatch(/LLM_ERROR|API|bad port|评测/);
  });

  it('uses each selected reading language', () => {
    expect(pblFailureMessage('evaluation', 'zh-CN')).toContain('作品已保存');
    expect(pblFailureMessage('coach', 'zh-CN')).toContain('老师');
    expect(pblFailureMessage('evaluation', 'en')).toContain('Your work is saved');
    expect(pblFailureMessage('coach', 'en')).toContain('AI coach');
  });
});
