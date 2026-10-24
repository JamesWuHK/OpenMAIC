import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isAllowlistedLearnerCourseId: vi.fn(),
  readStageAccessIncludingDeleted: vi.fn(),
}));

vi.mock('@/lib/config/deployment-mode', () => ({ isLearnerDeployment: () => true }));
vi.mock('@/lib/learner/filesystem-public-courses', () => ({
  isAllowlistedLearnerCourseId: mocks.isAllowlistedLearnerCourseId,
}));
vi.mock('@/lib/server/stage-access', () => ({
  readStageAccessIncludingDeleted: mocks.readStageAccessIncludingDeleted,
}));

import { GET } from '@/app/api/classroom-media/[classroomId]/[...path]/route';

describe('learner classroom media allowlist', () => {
  it('returns 404 for draft media before accessing the database or filesystem', async () => {
    mocks.isAllowlistedLearnerCourseId.mockResolvedValue(false);
    const response = await GET(
      new NextRequest('http://localhost/api/classroom-media/draft/media/image.png'),
      { params: Promise.resolve({ classroomId: 'draft', path: ['media', 'image.png'] }) },
    );
    expect(response.status).toBe(404);
    expect(mocks.readStageAccessIncludingDeleted).not.toHaveBeenCalled();
  });

  it('uses the file-backed publication allowlist without a database lookup', async () => {
    mocks.isAllowlistedLearnerCourseId.mockResolvedValue(true);
    const response = await GET(
      new NextRequest('http://localhost/api/classroom-media/lesson-1/media/missing.png'),
      { params: Promise.resolve({ classroomId: 'lesson-1', path: ['media', 'missing.png'] }) },
    );
    expect(response.status).toBe(404);
    expect(mocks.readStageAccessIncludingDeleted).not.toHaveBeenCalled();
  });
});
