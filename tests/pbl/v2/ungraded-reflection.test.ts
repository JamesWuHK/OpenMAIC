import { describe, expect, it } from 'vitest';
import { stageUngradedReflection } from '@/lib/pbl/v2/operations/runtime/ungraded-reflection';
import { addSubmission } from '@/lib/pbl/v2/operations/runtime/submission';
import { taskCompletionReadyText } from '@/lib/pbl/v2/operations/kernel/task-completion';
import type { PBLProjectV2 } from '@/lib/pbl/v2/types';

function project(): PBLProjectV2 {
  return { uiPhase: 'workspace', title: 'Baseline', description: '', learningObjective: '', proficiency: 'beginner', language: 'zh-HK', tags: [], status: 'active', roles: [], threads: [], submissions: [], evaluations: [], engagementEvents: [], createdAt: 'ts', updatedAt: 'ts',
    milestones: [{ id: 'm1', title: 'Initial idea', status: 'active', order: 0, microtasks: [{ id: 't1', title: 'Initial idea', status: 'in_progress', assignee: 'user', hints: [], order: 0, assessmentMode: 'ungraded-reflection' }] }] };
}

describe('ungraded initial reflection', () => {
  it('uses Traditional Chinese for Hong Kong completion guidance', () => {
    expect(taskCompletionReadyText('zh-HK')).toContain('這個任務');
  });
  it('accepts uncertainty without scoring, model evaluation or automatic advancement', () => {
    const state = project();
    addSubmission(state, { microtaskId: 't1', milestoneId: 'm1', kind: 'text', content: '我還不能判斷。' });
    expect(stageUngradedReflection(state, 'm1', 't1')).toBe(true);
    expect(state.evaluations).toEqual([]);
    expect(state.milestones[0].microtasks[0].status).toBe('in_progress');
    expect(state.pendingTaskCompletion?.microtaskId).toBe('t1');
  });
  it('cannot bypass assessment on a prototype, empty submission, file or locked stage', () => {
    for (const variant of ['prototype', 'empty', 'file', 'locked']) {
      const state = project();
      if (variant === 'prototype') delete state.milestones[0].microtasks[0].assessmentMode;
      if (variant === 'locked') state.milestones[0].status = 'locked';
      addSubmission(state, { microtaskId: 't1', milestoneId: 'm1', kind: variant === 'file' ? 'file' : 'text', content: variant === 'empty' ? '   ' : 'Initial idea' });
      expect(stageUngradedReflection(state, 'm1', 't1')).toBe(false);
      expect(state.pendingTaskCompletion).toBeUndefined();
    }
  });
});
