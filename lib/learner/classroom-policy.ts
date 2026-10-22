export interface ClassroomDeploymentPolicy {
  readonly allowGenerationResume: boolean;
  readonly resolveViewerOwnership: boolean;
  readonly forceReadOnly: boolean;
  readonly showCourseActions: boolean;
}

const FULL_CLASSROOM_POLICY: ClassroomDeploymentPolicy = {
  allowGenerationResume: true,
  resolveViewerOwnership: true,
  forceReadOnly: false,
  showCourseActions: true,
};

const LEARNER_CLASSROOM_POLICY: ClassroomDeploymentPolicy = {
  allowGenerationResume: false,
  resolveViewerOwnership: false,
  forceReadOnly: true,
  showCourseActions: false,
};

export function resolveClassroomDeploymentPolicy(
  learnerDeployment: boolean,
): ClassroomDeploymentPolicy {
  return learnerDeployment ? LEARNER_CLASSROOM_POLICY : FULL_CLASSROOM_POLICY;
}
