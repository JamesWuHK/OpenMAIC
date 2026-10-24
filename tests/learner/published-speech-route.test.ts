import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  readPublishedClassroom: vi.fn(),
  listFilesystemPublishedCourses: vi.fn(),
  generateTTS: vi.fn(),
}));

vi.mock('@/lib/config/deployment-mode', () => ({ isLearnerDeployment: () => true }));
vi.mock('@/lib/learner/published-classroom', () => ({
  readPublishedClassroom: mocks.readPublishedClassroom,
}));
vi.mock('@/lib/learner/filesystem-public-courses', () => ({
  listFilesystemPublishedCourses: mocks.listFilesystemPublishedCourses,
}));
vi.mock('@/lib/audio/tts-providers', () => ({ generateTTS: mocks.generateTTS }));

import { POST } from '@/app/api/learner/speech/route';

function speechRequest(classroomId = 'published-lesson'): Request {
  return new Request('https://class.wanli.ai/api/learner/speech', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://class.wanli.ai' },
    body: JSON.stringify({ classroomId, agentId: 'teacher', text: '早晨，一齊討論。' }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listFilesystemPublishedCourses.mockResolvedValue([{ id: 'published-lesson' }]);
  mocks.readPublishedClassroom.mockResolvedValue({
    stage: { generatedAgentConfigs: [{ id: 'teacher', role: 'teacher' }] },
  });
  mocks.generateTTS.mockResolvedValue({ audio: new Uint8Array([73, 68, 51, 1]), format: 'mp3' });
});

describe('learner discussion speech source', () => {
  it('uses the published file-backed roster and synthesizes speech', async () => {
    const response = await POST(speechRequest());
    expect(response.status).toBe(200);
    expect(mocks.readPublishedClassroom).toHaveBeenCalledExactlyOnceWith('published-lesson');
    expect(mocks.generateTTS).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toMatchObject({ format: 'mp3' });
  });

  it('does not read or speak an unpublished classroom', async () => {
    const response = await POST(speechRequest('draft-lesson'));
    expect(response.status).toBe(404);
    expect(mocks.readPublishedClassroom).not.toHaveBeenCalled();
    expect(mocks.generateTTS).not.toHaveBeenCalled();
  });

  it('does not speak if a catalog entry has no valid classroom file', async () => {
    mocks.readPublishedClassroom.mockResolvedValue(null);
    const response = await POST(speechRequest());
    expect(response.status).toBe(404);
    expect(mocks.generateTTS).not.toHaveBeenCalled();
  });
});
