import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildTeacherGenerationRequirement,
  runTeacherGenerationCycle,
} from '@/lib/learner/teacher-generation-worker';
import {
  createTeacherSubmission,
  publicSubmissionView,
  readSubmission,
  updateSubmissionReview,
} from '@/lib/learner/teacher-submissions';

describe('teacher generation worker', () => {
  let directory = '';

  beforeEach(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'teacher-generation-test-'));
    process.env.TEACHER_SUBMISSIONS_PATH = directory;
    process.env.OPENMAIC_HOSTED_ACCESS_CODE = 'test-access-code';
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    delete process.env.TEACHER_SUBMISSIONS_PATH;
    delete process.env.OPENMAIC_HOSTED_ACCESS_CODE;
    await rm(directory, { recursive: true, force: true });
  });

  async function queuedSubmission() {
    const created = await createTeacherSubmission(
      {
        teacherName: '陳老師',
        email: 'teacher@example.edu.hk',
        courseTitle: '城市聲音地圖',
        subject: '跨學科',
        gradeBand: '小五至中一',
        teachingLanguage: '香港粵語',
        lessonDuration: '45 分鐘',
        learningGoals: '辨認觀察與推論。',
        teacherNotes: '使用學生熟悉的香港生活情境。',
      },
      [{ category: 'lesson_plan', file: new File(['先觀察，再提出有證據的推論。'], '教案.md') }],
    );
    return updateSubmissionReview(created.submission, 'queued_for_generation', '人工審核通過。');
  }

  it('builds the requirement from approved fields and uploaded text', async () => {
    const submission = await queuedSubmission();
    const requirement = await buildTeacherGenerationRequirement(submission);
    expect(requirement).toContain('城市聲音地圖');
    expect(requirement).toContain('先觀察，再提出有證據的推論。');
    expect(requirement).toContain('香港繁體中文');
  });

  it('submits once, persists the job, then exposes a preview only after success', async () => {
    const submission = await queuedSubmission();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'ok', capabilities: { webSearch: true } }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ jobId: 'job-123', status: 'queued' }), { status: 202 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 'succeeded',
            step: 'completed',
            progress: 100,
            result: { classroomId: 'class-123' },
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    await runTeacherGenerationCycle();
    const generating = await readSubmission(submission.id);
    expect(generating?.status).toBe('generating');
    expect(generating?.generationJobId).toBe('job-123');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const submittedBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(submittedBody).not.toHaveProperty('model');
    expect(submittedBody.enableWebSearch).toBe(true);
    expect(submittedBody.enableTTS).toBeUndefined();

    await runTeacherGenerationCycle();
    const generated = await readSubmission(submission.id);
    expect(generated?.status).toBe('generated');
    expect(generated?.generatedClassroomUrl).toBe('https://open.maic.chat/classroom/class-123');
    expect(publicSubmissionView(generated!)).not.toHaveProperty('generationJobId');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('never sends an unapproved submission to OpenMAIC', async () => {
    const created = await createTeacherSubmission(
      {
        teacherName: '未審核教師',
        email: 'pending@example.edu.hk',
        courseTitle: '未審核課程',
        subject: '測試',
        gradeBand: '中一',
        teachingLanguage: '香港粵語',
        lessonDuration: '40 分鐘',
        learningGoals: '尚待審核。',
        teacherNotes: '',
      },
      [{ category: 'reference', file: new File(['private'], 'reference.txt') }],
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await runTeacherGenerationCycle();
    expect(fetchMock).not.toHaveBeenCalled();
    expect((await readSubmission(created.submission.id))?.status).toBe('pending_review');
  });
});
