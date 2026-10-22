import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createTeacherSubmission,
  listSubmissions,
  publicSubmissionView,
  readSubmission,
  trackingTokenMatches,
  updateSubmissionReview,
} from '@/lib/learner/teacher-submissions';

describe('teacher submission review gate', () => {
  let directory = '';

  beforeEach(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'teacher-submission-test-'));
    process.env.TEACHER_SUBMISSIONS_PATH = directory;
  });

  afterEach(async () => {
    delete process.env.TEACHER_SUBMISSIONS_PATH;
    await rm(directory, { recursive: true, force: true });
  });

  it('stores uploaded evidence as pending review and never persists the tracking token', async () => {
    const { submission, trackingToken } = await createTeacherSubmission(
      {
        teacherName: '陳老師',
        email: 'teacher@example.edu.hk',
        courseTitle: '城市聲音地圖',
        subject: '跨學科',
        gradeBand: '小五至中一',
        teachingLanguage: '香港粵語',
        lessonDuration: '45 分鐘',
        learningGoals: '辨認聲音資料與推論的分別。',
        teacherNotes: '保留學生實地觀察。',
      },
      [
        {
          category: 'lesson_plan',
          file: new File(['lesson'], '教案.md', { type: 'text/markdown' }),
        },
      ],
    );

    expect(submission.status).toBe('pending_review');
    expect(submission.files).toHaveLength(1);
    expect(trackingTokenMatches(submission, trackingToken)).toBe(true);
    const persisted = await readFile(
      path.join(directory, submission.id, 'submission.json'),
      'utf8',
    );
    expect(persisted).not.toContain(trackingToken);
    expect(publicSubmissionView(submission)).not.toHaveProperty('email');
  });

  it('only enters the generation queue through an explicit approval update', async () => {
    const created = await createTeacherSubmission(
      {
        teacherName: 'Lee Sir',
        email: 'lee@example.edu.hk',
        courseTitle: 'AI 判斷練習',
        subject: 'AI 素養',
        gradeBand: '中一',
        teachingLanguage: '香港粵語',
        lessonDuration: '40 分鐘',
        learningGoals: '用證據作判斷。',
        teacherNotes: '',
      },
      [{ category: 'assignment', file: new File(['work'], '工作紙.txt', { type: 'text/plain' }) }],
    );

    expect((await listSubmissions())[0]?.status).toBe('pending_review');
    const approved = await updateSubmissionReview(
      created.submission,
      'queued_for_generation',
      '來源與學生安全檢查通過。',
    );
    expect(approved.status).toBe('queued_for_generation');
    expect(approved.generationQueuedAt).toBeTruthy();
    expect((await readSubmission(approved.id))?.status).toBe('queued_for_generation');
  });
});
