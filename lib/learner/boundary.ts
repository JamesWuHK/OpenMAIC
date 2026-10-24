export type LearnerBoundaryDecision = 'allow' | 'not-found';

interface LearnerBoundaryRequest {
  readonly method: string;
  readonly pathname: string;
}

const BLOCKED_PAGE_FAMILIES = ['/generation-preview', '/workbench', '/workspace'] as const;

const BLOCKED_API_FAMILIES = [
  '/api/agent',
  '/api/agents',
  '/api/azure-voices',
  '/api/comfyui-workflows',
  '/api/export-video',
  '/api/extract-document',
  '/api/generate',
  '/api/generate-classroom',
  '/api/generation-runs',
  '/api/identity/legacy-import-binding',
  '/api/materials',
  '/api/model-config',
  '/api/parse-pdf',
  '/api/proxy-media',
  '/api/provider',
  '/api/server-providers',
  '/api/skills',
] as const;

const READ_ONLY_API_FAMILIES = [
  '/api/classroom',
  '/api/classroom-media',
  '/api/folders',
  '/api/stage-meta',
  '/api/stages',
] as const;

function belongsToFamily(pathname: string, family: string): boolean {
  return pathname === family || pathname.startsWith(`${family}/`);
}

/**
 * Defense-in-depth for a learner build. UI hiding is not an authorization
 * boundary, so authoring routes also disappear at the request boundary.
 */
export function learnerBoundaryDecision({
  method,
  pathname,
}: LearnerBoundaryRequest): LearnerBoundaryDecision {
  if (BLOCKED_PAGE_FAMILIES.some((family) => belongsToFamily(pathname, family))) {
    return 'not-found';
  }

  if (!pathname.startsWith('/api/')) return 'allow';

  if (pathname.startsWith('/api/verify-')) return 'not-found';
  if (BLOCKED_API_FAMILIES.some((family) => belongsToFamily(pathname, family))) {
    return 'not-found';
  }

  if (belongsToFamily(pathname, '/api/persistence')) {
    // Course documents and media can be read, but never edited or uploaded on
    // the learner host. The runtime partition alone remains writable so a
    // student can keep discussion and activity progress. Identity merges and
    // other future storage contracts are not implicitly exposed.
    if (belongsToFamily(pathname, '/api/persistence/runtime')) {
      return belongsToFamily(pathname, '/api/persistence/runtime/learners/merge')
        ? 'not-found'
        : 'allow';
    }
    const readable =
      pathname === '/api/persistence/learner-key' ||
      belongsToFamily(pathname, '/api/persistence/documents') ||
      belongsToFamily(pathname, '/api/persistence/assets');
    return readable && ['GET', 'HEAD'].includes(method.toUpperCase()) ? 'allow' : 'not-found';
  }

  if (
    !['GET', 'HEAD'].includes(method.toUpperCase()) &&
    READ_ONLY_API_FAMILIES.some((family) => belongsToFamily(pathname, family))
  ) {
    return 'not-found';
  }

  return 'allow';
}
