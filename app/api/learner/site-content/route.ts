import { NextResponse } from 'next/server';

import { readLearnerSiteContent } from '@/lib/learner/site-content.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const content = await readLearnerSiteContent();
    return NextResponse.json(content, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[LearnerSiteContent] Failed to read runtime content', error);
    return NextResponse.json({ error: 'Learner site content is unavailable' }, { status: 503 });
  }
}
