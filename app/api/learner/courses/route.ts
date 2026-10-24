import { isLearnerDeployment } from '@/lib/config/deployment-mode';
import { listFilesystemPublishedCourses } from '@/lib/learner/filesystem-public-courses';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  if (!isLearnerDeployment()) {
    return new Response('Not found', { status: 404 });
  }

  // The runtime catalog is the learner site's publication allowlist and the
  // source of its reviewed language, age and series labels. PostgreSQL backs
  // classroom playback after v1.2.1, but switching the catalog to stage_meta
  // would hide file-imported lessons (private by default) and discard those
  // labels. This preserves catalog publication only; classroom file updates
  // still require a separate database import path before content-only release.
  const courses = await listFilesystemPublishedCourses();
  return Response.json(
    { courses },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
