import { NextRequest, NextResponse } from 'next/server';

import { createTeacherSubmission, reviewKeyMatches } from '@/lib/learner/teacher-submissions';
import {
  takeTeacherSubmissionSlot,
  teacherSubmissionIdentity,
} from '@/lib/learner/submission-rate-limit';

export const runtime = 'nodejs';

const MAX_TOTAL_BYTES = 40 * 1024 * 1024;
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_FILES = 10;
const CATEGORIES = ['lesson_plan', 'reference', 'assignment', 'other'] as const;
const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.txt',
  '.md',
  '.rtf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
]);

function text(form: FormData, name: string, max: number): string {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  const declaredBytes = Number(request.headers.get('content-length') || 0);
  if (declaredBytes > MAX_TOTAL_BYTES) {
    return NextResponse.json({ error: '全部資料合計不可超過 40 MB。' }, { status: 413 });
  }
  if (!takeTeacherSubmissionSlot(teacherSubmissionIdentity(request.headers))) {
    return NextResponse.json(
      { error: '提交次數暫時過多，請稍後再試。' },
      { status: 429, headers: { 'Retry-After': '3600' } },
    );
  }

  const form = await request.formData();
  const required = [
    'teacherName',
    'email',
    'courseTitle',
    'subject',
    'gradeBand',
    'teachingLanguage',
    'learningGoals',
  ];
  if (required.some((field) => !text(form, field, 4000))) {
    return NextResponse.json({ error: '請完成所有必填欄位。' }, { status: 400 });
  }
  if (text(form, 'consent', 10) !== 'yes') {
    return NextResponse.json({ error: '請確認你有權提交及改編這些資料。' }, { status: 400 });
  }

  const uploads = CATEGORIES.flatMap((category) =>
    form.getAll(category).flatMap((value) => {
      if (!(value instanceof File) || value.size === 0) return [];
      return [{ category, file: value }];
    }),
  );
  if (!uploads.length) {
    return NextResponse.json({ error: '請至少上載一份教案、參考資料或作業。' }, { status: 400 });
  }
  if (uploads.length > MAX_FILES) {
    return NextResponse.json({ error: '每次最多上載 10 個檔案。' }, { status: 400 });
  }
  if (uploads.reduce((sum, { file }) => sum + file.size, 0) > MAX_TOTAL_BYTES) {
    return NextResponse.json({ error: '全部資料合計不可超過 40 MB。' }, { status: 413 });
  }
  for (const { file } of uploads) {
    const extension = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || '';
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ error: `不支援檔案格式：${file.name}` }, { status: 415 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `單一檔案不可超過 12 MB：${file.name}` }, { status: 413 });
    }
  }

  const { submission, trackingToken } = await createTeacherSubmission(
    {
      teacherName: text(form, 'teacherName', 100),
      email: text(form, 'email', 200),
      courseTitle: text(form, 'courseTitle', 160),
      subject: text(form, 'subject', 100),
      gradeBand: text(form, 'gradeBand', 100),
      teachingLanguage: text(form, 'teachingLanguage', 100),
      lessonDuration: text(form, 'lessonDuration', 60),
      learningGoals: text(form, 'learningGoals', 4000),
      teacherNotes: text(form, 'teacherNotes', 6000),
    },
    uploads,
  );

  return NextResponse.json(
    { id: submission.id, trackingToken, status: submission.status },
    { status: 201 },
  );
}

export async function GET(request: NextRequest) {
  const reviewKey = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!reviewKeyMatches(reviewKey)) return new Response('Unauthorized', { status: 401 });
  const { listSubmissions } = await import('@/lib/learner/teacher-submissions');
  return NextResponse.json({ submissions: await listSubmissions() });
}
