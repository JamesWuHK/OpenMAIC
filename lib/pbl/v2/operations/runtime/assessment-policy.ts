import type { PBLMicrotask, PBLMilestone } from '../../types';

/** Only an explicit authored flag opts out of assessment. Missing or empty
 * metadata must never turn an ordinary task/stage into an ungraded one. */
export function isUngradedReflection(task: PBLMicrotask | undefined): boolean {
  return task?.assessmentMode === 'ungraded-reflection';
}

export function isUngradedMilestone(milestone: PBLMilestone | undefined): boolean {
  return (
    !!milestone &&
    milestone.microtasks.length > 0 &&
    milestone.microtasks.every(isUngradedReflection)
  );
}
