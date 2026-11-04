import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { isLearnerDeployment } from '@/lib/config/deployment-mode';
import { listFilesystemPublishedCourses } from '@/lib/learner/filesystem-public-courses';
import { resolveLegacyNobelRedirect } from '@/lib/learner/legacy-nobel-redirect';

// The publication catalog is mounted runtime content, not a build-time snapshot.
export const dynamic = 'force-dynamic';

export default async function ClassroomLayout({ children, params }: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  if (isLearnerDeployment()) {
    const { id } = await params;
    const target = await resolveLegacyNobelRedirect(id, () => listFilesystemPublishedCourses());
    if (target) redirect(`/classroom/${target}`);
  }
  return children;
}
