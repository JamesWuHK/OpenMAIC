import { isLearnerDeployment } from '@/lib/config/deployment-mode';
import { listFilesystemPublishedCourses } from '@/lib/learner/filesystem-public-courses';
import { listNobelCatalogEntries } from '@/lib/learner/nobel-language-navigation';
import { listPublishedCourses } from '@/lib/learner/public-courses';
import { getServerPersistenceProvider } from '@/lib/persistence/server-provider';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  if (!isLearnerDeployment()) {
    return new Response('Not found', { status: 404 });
  }

  const connectionString = process.env.DATABASE_URL?.trim();
  const courses = connectionString
    ? await getServerPersistenceProvider(connectionString).then(({ pool }) =>
        listPublishedCourses(pool),
      )
    : await listFilesystemPublishedCourses();
  return Response.json(
    { courses: listNobelCatalogEntries(courses) },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
