import { describe, expect, it } from 'vitest';
import {
  isUngradedMilestone,
  isUngradedReflection,
} from '@/lib/pbl/v2/operations/runtime/assessment-policy';
import type { PBLMicrotask, PBLMilestone } from '@/lib/pbl/v2/types';

const reflection: PBLMicrotask = {
  id: 'initial',
  title: 'Initial idea',
  status: 'completed',
  assignee: 'user',
  hints: [],
  order: 0,
  assessmentMode: 'ungraded-reflection',
};
const milestone = (tasks: PBLMicrotask[]): PBLMilestone => ({
  id: 'm',
  title: 'Stage',
  order: 0,
  status: 'completed',
  microtasks: tasks,
});

describe('authored ungraded assessment boundary', () => {
  it('does not opt missing, empty, or ordinary tasks out of assessment', () => {
    expect(isUngradedReflection(undefined)).toBe(false);
    expect(isUngradedMilestone(undefined)).toBe(false);
    expect(isUngradedMilestone(milestone([]))).toBe(false);
    expect(isUngradedReflection({ ...reflection, assessmentMode: undefined })).toBe(false);
  });
  it('requires every task to be explicitly ungraded before suppressing a whole stage', () => {
    expect(isUngradedMilestone(milestone([reflection]))).toBe(true);
    expect(
      isUngradedMilestone(
        milestone([reflection, { ...reflection, id: 'prototype', assessmentMode: undefined }]),
      ),
    ).toBe(false);
  });
});
