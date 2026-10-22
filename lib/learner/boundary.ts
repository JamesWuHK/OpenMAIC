export type LearnerBoundaryDecision = 'allow' | 'not-found';

interface LearnerBoundaryRequest {
  readonly method: string;
  readonly pathname: string;
}

const BLOCKED_PAGE_FAMILIES = ['/generation-preview', '/workbench', '/workspace'] as const;

const BLOCKED_API_FAMILIES = [
  '/api/agent',
  '/api/comfyui-workflows',
  '/api/export-video',
  '/api/extract-document',
  '/api/generate',
  '/api/generate-classroom',
  '/api/materials',
  '/api/parse-pdf',
  '/api/provider',
  '/api/server-providers',
  '/api/skills',
] as const;

const READ_ONLY_API_FAMILIES = [
  '/api/classroom',
  '/api/classroom-media',
  '/api/folders',
  '/api/stages',
  '/api/persistence/documents',
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

  if (
    method.toUpperCase() !== 'GET' &&
    READ_ONLY_API_FAMILIES.some((family) => belongsToFamily(pathname, family))
  ) {
    return 'not-found';
  }

  return 'allow';
}
