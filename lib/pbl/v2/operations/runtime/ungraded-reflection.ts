import type { PBLProjectV2 } from '../../types';
import { latestSubmissionForMicrotask } from './submission';
import {
  appendTaskCompletionReadyMessage,
  recordPendingTaskCompletionEvidence,
  setPendingTaskCompletion,
} from '../kernel/task-completion';

/** Record a baseline without a score, correctness judgement or model request.
 * Only an explicitly authored reflection task can use this path. It stages
 * the normal learner-owned Complete button; it never completes a later task. */
export function stageUngradedReflection(project: PBLProjectV2, milestoneId: string, microtaskId: string): boolean {
  const milestone = project.milestones.find(item => item.id === milestoneId);
  const task = milestone?.microtasks.find(item => item.id === microtaskId);
  const submission = latestSubmissionForMicrotask(project, microtaskId);
  if (!milestone || milestone.status !== 'active' || task?.status !== 'in_progress' ||
      task.assessmentMode !== 'ungraded-reflection' || submission?.kind !== 'text' || !submission.content.trim()) return false;
  const reason = 'Initial learner reflection recorded without grading. No correctness or execution result inferred.';
  const evidence = { path: 'submission_passed' as const, signature: `ungraded_reflection_${submission.id}`, label: task.title, note: reason };
  recordPendingTaskCompletionEvidence(project, milestone, task, evidence);
  setPendingTaskCompletion(project, { milestoneId, microtaskId, reason, evidence });
  appendTaskCompletionReadyMessage(project, microtaskId, { afterTs: submission.createdAt });
  return true;
}
