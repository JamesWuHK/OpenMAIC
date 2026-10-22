import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  learner: true,
  listFilesystemPublishedCourses: vi.fn(),
  listPublishedCourses: vi.fn(),
  pool: { query: vi.fn() },
}));

vi.mock('@/lib/config/deployment-mode', () => ({
  isLearnerDeployment: () => mocks.learner,
}));
vi.mock('@/lib/persistence/server-provider', () => ({
  getServerPersistenceProvider: async () => ({ pool: mocks.pool }),
}));
vi.mock('@/lib/learner/filesystem-public-courses', () => ({
  listFilesystemPublishedCourses: mocks.listFilesystemPublishedCourses,
}));
vi.mock('@/lib/learner/public-courses', () => ({
  listPublishedCourses: mocks.listPublishedCourses,
}));

import { GET } from '@/app/api/learner/courses/route';

const originalDatabaseUrl = process.env.DATABASE_URL;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.learner = true;
  process.env.DATABASE_URL = 'postgres://learner';
  mocks.listPublishedCourses.mockResolvedValue([
    {
      id: 'course-1',
      name: 'Hong Kong Stories',
      createdAt: 1,
      updatedAt: 2,
      sceneCount: 8,
      publishedAt: 3,
    },
  ]);
  mocks.listFilesystemPublishedCourses.mockResolvedValue([
    {
      id: 'filesystem-course',
      name: 'Filesystem Course',
      createdAt: 4,
      updatedAt: 5,
      sceneCount: 10,
      publishedAt: 6,
    },
  ]);
});

describe('GET /api/learner/courses', () => {
  it('returns the published course catalog without caching it', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    await expect(response.json()).resolves.toEqual({
      courses: [
        {
          id: 'course-1',
          name: 'Hong Kong Stories',
          createdAt: 1,
          updatedAt: 2,
          sceneCount: 8,
          publishedAt: 3,
        },
      ],
    });
    expect(mocks.listPublishedCourses).toHaveBeenCalledExactlyOnceWith(mocks.pool);
    expect(mocks.listFilesystemPublishedCourses).not.toHaveBeenCalled();
  });

  it('is absent from full authoring deployments', async () => {
    mocks.learner = false;
    const response = await GET();
    expect(response.status).toBe(404);
    expect(mocks.listPublishedCourses).not.toHaveBeenCalled();
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
          createdAt: 4,
          updatedAt: 5,
          sceneCount: 10,
          publishedAt: 6,
        },
      ],
    });
    expect(mocks.listPublishedCourses).not.toHaveBeenCalled();
    expect(mocks.listFilesystemPublishedCourses).toHaveBeenCalledOnce();
  });
});

afterAll(() => {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
});
