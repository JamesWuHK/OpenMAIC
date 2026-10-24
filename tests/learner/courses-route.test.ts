import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  learner: true,
  listFilesystemPublishedCourses: vi.fn(),
}));

vi.mock('@/lib/config/deployment-mode', () => ({
  isLearnerDeployment: () => mocks.learner,
}));
vi.mock('@/lib/learner/filesystem-public-courses', () => ({
  listFilesystemPublishedCourses: mocks.listFilesystemPublishedCourses,
}));

import { GET } from '@/app/api/learner/courses/route';

const originalDatabaseUrl = process.env.DATABASE_URL;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.learner = true;
  process.env.DATABASE_URL = 'postgres://learner';
  mocks.listFilesystemPublishedCourses.mockResolvedValue([
    {
      id: 'filesystem-course',
      name: 'Filesystem Course',
      language: 'zh-hk',
      gradeRange: '小四至中一',
      series: '香港 AI 素養',
      createdAt: 4,
      updatedAt: 5,
      sceneCount: 10,
      publishedAt: 6,
    },
  ]);
});

describe('GET /api/learner/courses', () => {
  it('preserves the explicit learner catalog and its labels with PostgreSQL configured', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    await expect(response.json()).resolves.toEqual({
      courses: [
        {
          id: 'filesystem-course',
          name: 'Filesystem Course',
          language: 'zh-hk',
          gradeRange: '小四至中一',
          series: '香港 AI 素養',
          createdAt: 4,
          updatedAt: 5,
          sceneCount: 10,
          publishedAt: 6,
        },
      ],
    });
    expect(mocks.listFilesystemPublishedCourses).toHaveBeenCalledOnce();
  });

  it('is absent from full authoring deployments', async () => {
    mocks.learner = false;
    const response = await GET();
    expect(response.status).toBe(404);
    expect(mocks.listFilesystemPublishedCourses).not.toHaveBeenCalled();
  });

  it('uses the explicit filesystem catalog when server persistence is not configured', async () => {
    delete process.env.DATABASE_URL;
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      courses: [
        {
          id: 'filesystem-course',
          name: 'Filesystem Course',
          language: 'zh-hk',
          gradeRange: '小四至中一',
          series: '香港 AI 素養',
          createdAt: 4,
          updatedAt: 5,
          sceneCount: 10,
          publishedAt: 6,
        },
      ],
    });
    expect(mocks.listFilesystemPublishedCourses).toHaveBeenCalledOnce();
  });
});

afterAll(() => {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
});
