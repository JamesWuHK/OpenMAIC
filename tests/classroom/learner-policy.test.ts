import { describe, expect, it } from 'vitest';

import { resolveClassroomDeploymentPolicy } from '@/lib/learner/classroom-policy';

describe('learner classroom policy', () => {
  it('forces a learner classroom into a read-only playback surface', () => {
    expect(resolveClassroomDeploymentPolicy(true)).toEqual({
      allowGenerationResume: false,
      resolveViewerOwnership: false,
      forceReadOnly: true,
      showCourseActions: false,
    });
  });

  it('preserves upstream classroom behavior in a full deployment', () => {
    expect(resolveClassroomDeploymentPolicy(false)).toEqual({
      allowGenerationResume: true,
      resolveViewerOwnership: true,
      forceReadOnly: false,
      showCourseActions: true,
    });
  });
});
