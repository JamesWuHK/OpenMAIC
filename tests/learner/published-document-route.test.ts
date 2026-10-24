import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  learner: true,
  readPublishedClassroom: vi.fn(),
}));

vi.mock('@/lib/config/deployment-mode', () => ({
  isLearnerDeployment: () => mocks.learner,
}));
vi.mock('@/lib/learner/published-classroom', () => ({
  readPublishedClassroom: mocks.readPublishedClassroom,
}));

import { handlePersistenceRequest } from '@/app/api/persistence/[...path]/route';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.learner = true;
  mocks.readPublishedClassroom.mockResolvedValue({
    stage: { id: 'lesson-1', name: '香港課堂' },
    scenes: [{ id: 'scene-1' }],
    sourceSha256: 'test-source-hash',
  });
});

describe('published document route on learner deployments', () => {
  it('serves the current file-backed lesson without a database connection', async () => {
    const response = await handlePersistenceRequest(
      new Request('http://localhost/api/persistence/documents/lesson-1'),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('x-learner-classroom-sha256')).toBe('test-source-hash');
    expect(response.headers.get('x-request-id')).toBeTruthy();
    await expect(response.json()).resolves.toEqual({
      stage: { id: 'lesson-1', name: '香港課堂' },
      scenes: [{ id: 'scene-1' }],
      sourceSha256: 'test-source-hash',
    });
    expect(mocks.readPublishedClassroom).toHaveBeenCalledExactlyOnceWith('lesson-1');
  });

  it('does not expose an unpublished document even if it exists in PostgreSQL', async () => {
    mocks.readPublishedClassroom.mockResolvedValue(null);
    const response = await handlePersistenceRequest(
      new Request('http://localhost/api/persistence/documents/draft-lesson'),
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'DOCUMENT_NOT_FOUND' },
    });
  });

  it('refuses document writes on the student site', async () => {
    const response = await handlePersistenceRequest(
      new Request('http://localhost/api/persistence/documents/lesson-1', { method: 'DELETE' }),
    );
    expect(response.status).toBe(403);
    expect(mocks.readPublishedClassroom).not.toHaveBeenCalled();
  });
});
