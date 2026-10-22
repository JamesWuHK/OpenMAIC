import { NextRequest, NextResponse } from 'next/server';

import {
  publicSubmissionView,
  readSubmission,
  reviewKeyMatches,
  trackingTokenMatches,
  updateSubmissionReview,
} from '@/lib/learner/teacher-submissions';

export const runtime = 'nodejs';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: Context) {
  const submission = await readSubmission((await context.params).id);
  if (!submission) return new Response('Not found', { status: 404 });
  const token = request.nextUrl.searchParams.get('token') || '';
  const reviewKey = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (reviewKeyMatches(reviewKey)) return NextResponse.json({ submission });
  if (!trackingTokenMatches(submission, token)) return new Response('Not found', { status: 404 });
  return NextResponse.json({ submission: publicSubmissionView(submission) });
}

export async function PATCH(request: NextRequest, context: Context) {
  const reviewKey = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!reviewKeyMatches(reviewKey)) return new Response('Unauthorized', { status: 401 });
  const submission = await readSubmission((await context.params).id);
  if (!submission) return new Response('Not found', { status: 404 });
  const body = (await request.json()) as { decision?: string; reviewNote?: string };
  const status =
    body.decision === 'approve'
      ? 'queued_for_generation'
      : body.decision === 'changes'
        ? 'changes_requested'
        : body.decision === 'reject'
          ? 'rejected'
          : null;
  if (!status) return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
  const updated = await updateSubmissionReview(
    submission,
    status,
    String(body.reviewNote || '')
      .trim()
      .slice(0, 3000),
  );
  return NextResponse.json({ submission: updated });
}
