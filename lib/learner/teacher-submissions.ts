import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const TEACHER_SUBMISSION_STATUSES = [
  'pending_review',
  'changes_requested',
  'queued_for_generation',
  'submitting_generation',
  'generating',
  'generated',
  'generation_failed',
  'published',
  'rejected',
] as const;

export type TeacherSubmissionStatus = (typeof TEACHER_SUBMISSION_STATUSES)[number];

export interface TeacherSubmissionFile {
  readonly id: string;
  readonly category: 'lesson_plan' | 'reference' | 'assignment' | 'other';
  readonly originalName: string;
  readonly storedName: string;
  readonly mime: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface TeacherSubmission {
  readonly id: string;
  readonly trackingTokenHash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly status: TeacherSubmissionStatus;
  readonly teacherName: string;
  readonly email: string;
  readonly courseTitle: string;
  readonly subject: string;
  readonly gradeBand: string;
  readonly teachingLanguage: string;
  readonly lessonDuration: string;
  readonly learningGoals: string;
  readonly teacherNotes: string;
  readonly files: TeacherSubmissionFile[];
  readonly reviewNote?: string;
  readonly reviewedAt?: string;
  readonly generationQueuedAt?: string;
  readonly generationStartedAt?: string;
  readonly generationJobId?: string;
  readonly generationPollUrl?: string;
  readonly generationProgress?: number;
  readonly generationStep?: string;
  readonly generationError?: string;
  readonly generatedAt?: string;
  readonly hostedClassroomId?: string;
  readonly generatedClassroomUrl?: string;
}

const root = () =>
  path.resolve(
    process.env.TEACHER_SUBMISSIONS_PATH || path.join(process.cwd(), 'data/teacher-submissions'),
  );

const metadataPath = (id: string) => path.join(root(), id, 'submission.json');

export function isSubmissionId(value: string): boolean {
  return /^[a-f0-9-]{36}$/.test(value);
}

export function hashTrackingToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function trackingTokenMatches(submission: TeacherSubmission, token: string): boolean {
  const actual = Buffer.from(hashTrackingToken(token));
  const expected = Buffer.from(submission.trackingTokenHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createTeacherSubmission(
  fields: Omit<
    TeacherSubmission,
    'id' | 'trackingTokenHash' | 'createdAt' | 'updatedAt' | 'status' | 'files'
  >,
  uploads: Array<{ category: TeacherSubmissionFile['category']; file: File }>,
): Promise<{ submission: TeacherSubmission; trackingToken: string }> {
  const id = randomUUID();
  const trackingToken = randomBytes(24).toString('base64url');
  const directory = path.join(root(), id);
  const filesDirectory = path.join(directory, 'files');
  await mkdir(filesDirectory, { recursive: true, mode: 0o700 });

  const files: TeacherSubmissionFile[] = [];
  for (const upload of uploads) {
    const bytes = Buffer.from(await upload.file.arrayBuffer());
    const fileId = randomUUID();
    const extension = path.extname(path.basename(upload.file.name)).slice(0, 16).toLowerCase();
    const storedName = `${fileId}${extension}`;
    await writeFile(path.join(filesDirectory, storedName), bytes, { mode: 0o600 });
    files.push({
      id: fileId,
      category: upload.category,
      originalName: path.basename(upload.file.name).slice(0, 180),
      storedName,
      mime: upload.file.type || 'application/octet-stream',
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
  }

  const now = new Date().toISOString();
  const submission: TeacherSubmission = {
    ...fields,
    id,
    trackingTokenHash: hashTrackingToken(trackingToken),
    createdAt: now,
    updatedAt: now,
    status: 'pending_review',
    files,
  };
  await writeSubmission(submission);
  return { submission, trackingToken };
}

export async function readSubmission(id: string): Promise<TeacherSubmission | null> {
  if (!isSubmissionId(id)) return null;
  try {
    return JSON.parse(await readFile(metadataPath(id), 'utf8')) as TeacherSubmission;
  } catch {
    return null;
  }
}

export async function readSubmissionFile(submission: TeacherSubmission, fileId: string) {
  const file = submission.files.find((candidate) => candidate.id === fileId);
  if (!file || !/^[a-f0-9-]{36}$/.test(fileId)) return null;
  try {
    const bytes = await readFile(path.join(root(), submission.id, 'files', file.storedName));
    return { file, bytes };
  } catch {
    return null;
  }
}

export async function listSubmissions(): Promise<TeacherSubmission[]> {
  await mkdir(root(), { recursive: true, mode: 0o700 });
  const entries = await readdir(root(), { withFileTypes: true });
  const rows = await Promise.all(
    entries.filter((entry) => entry.isDirectory()).map((entry) => readSubmission(entry.name)),
  );
  return rows
    .filter((row): row is TeacherSubmission => Boolean(row))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateSubmissionReview(
  submission: TeacherSubmission,
  status: 'changes_requested' | 'queued_for_generation' | 'rejected',
  reviewNote: string,
): Promise<TeacherSubmission> {
  const now = new Date().toISOString();
  const updated: TeacherSubmission = {
    ...submission,
    status,
    reviewNote,
    reviewedAt: now,
    updatedAt: now,
    ...(status === 'queued_for_generation' ? { generationQueuedAt: now } : {}),
  };
  await writeSubmission(updated);
  return updated;
}

export async function updateSubmissionGeneration(
  submission: TeacherSubmission,
  patch: Partial<
    Pick<
      TeacherSubmission,
      | 'status'
      | 'generationStartedAt'
      | 'generationJobId'
      | 'generationPollUrl'
      | 'generationProgress'
      | 'generationStep'
      | 'generationError'
      | 'generatedAt'
      | 'hostedClassroomId'
      | 'generatedClassroomUrl'
    >
  >,
): Promise<TeacherSubmission> {
  const updated: TeacherSubmission = {
    ...submission,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeSubmission(updated);
  return updated;
}

async function writeSubmission(submission: TeacherSubmission): Promise<void> {
  const destination = metadataPath(submission.id);
  await mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
  const temporary = `${destination}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(submission, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, destination);
}

export function publicSubmissionView(submission: TeacherSubmission) {
  return {
    id: submission.id,
    courseTitle: submission.courseTitle,
    status: submission.status,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    reviewNote: submission.reviewNote,
    generationProgress: submission.generationProgress,
    generationStep: submission.generationStep,
    generationFailed: Boolean(submission.generationError),
    generatedClassroomUrl: submission.generatedClassroomUrl,
    files: submission.files.map(({ category, originalName, bytes }) => ({
      category,
      originalName,
      bytes,
    })),
  };
}

export function reviewKeyMatches(candidate: string): boolean {
  const expected = process.env.TEACHER_REVIEW_KEY || '';
  if (!candidate || !expected) return false;
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
