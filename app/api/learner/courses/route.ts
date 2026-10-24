import { isLearnerDeployment } from '@/lib/config/deployment-mode';
import { listFilesystemPublishedCourses } from '@/lib/learner/filesystem-public-courses';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  if (!isLearnerDeployment()) {
    return new Response('Not found', { status: 404 });
  }

  // The runtime catalog is the learner site's publication allowlist and the
  // source of its reviewed language, age and series labels. Public playback
  // reads the allowlisted files directly; drafts stay inaccessible.
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
