import { NextRequest } from 'next/server';

import {
  readSubmission,
  readSubmissionFile,
  reviewKeyMatches,
} from '@/lib/learner/teacher-submissions';

export const runtime = 'nodejs';

interface Context {
  params: Promise<{ id: string; fileId: string }>;
}

export async function GET(request: NextRequest, context: Context) {
  const reviewKey = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!reviewKeyMatches(reviewKey)) return new Response('Unauthorized', { status: 401 });
  const { id, fileId } = await context.params;
  const submission = await readSubmission(id);
  if (!submission) return new Response('Not found', { status: 404 });
  const stored = await readSubmissionFile(submission, fileId);
  if (!stored) return new Response('Not found', { status: 404 });
  return new Response(stored.bytes, {
    headers: {
      'Content-Type': stored.file.mime,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(stored.file.originalName)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
