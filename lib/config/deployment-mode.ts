export type OpenMaicDeploymentMode = 'full' | 'learner';

/**
 * Deployment modes are deliberately closed: an unknown or missing value keeps
 * the upstream full application instead of accidentally hiding authoring UI.
 */
export function resolveDeploymentMode(value: string | undefined): OpenMaicDeploymentMode {
  return value?.trim().toLowerCase() === 'learner' ? 'learner' : 'full';
}

/**
 * The server-only value is authoritative at runtime. The public value is the
 * build-time mirror used by client components, where server env is absent.
 */
export function isLearnerDeployment(): boolean {
  const publicMode = process.env.NEXT_PUBLIC_OPENMAIC_DEPLOYMENT_MODE;
  // Client bundles must use the public build-time value. A browser process
  // shim can expose an unrelated/private OPENMAIC_DEPLOYMENT_MODE value; if
  // that wins, learner-only safety behavior is silently disabled in the UI.
  if (typeof window !== 'undefined') {
    return resolveDeploymentMode(publicMode) === 'learner';
  }

  return (
    resolveDeploymentMode(
      process.env.OPENMAIC_DEPLOYMENT_MODE ?? publicMode,
    ) === 'learner'
  );
}

/** Learner-only builds have no authoring provider endpoint to initialize. */
export function shouldInitializeServerProviders(): boolean {
  return !isLearnerDeployment();
}
