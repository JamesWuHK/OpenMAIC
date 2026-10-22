import { describe, expect, it } from 'vitest';

import { learnerBoundaryDecision } from '@/lib/learner/boundary';

describe('learner deployment boundary', () => {
  it.each([
    ['GET', '/'],
    ['GET', '/classroom/course-1'],
    ['GET', '/open-source-licenses'],
    ['GET', '/api/health'],
    ['POST', '/api/chat'],
    ['POST', '/api/chat/pi'],
    ['GET', '/api/classroom?id=course-1'],
    ['GET', '/api/classroom-media/course-1/image.png'],
    ['GET', '/api/learner/courses'],
    ['POST', '/api/learner/speech'],
    ['POST', '/api/quiz-grade'],
    ['POST', '/api/transcription'],
    ['POST', '/api/pbl/v2/task/update'],
  ])('allows %s %s', (method, pathname) => {
    expect(learnerBoundaryDecision({ method, pathname })).toBe('allow');
  });

  it.each([
    ['GET', '/generation-preview'],
    ['GET', '/workbench'],
    ['GET', '/workspace/session-1'],
    ['POST', '/api/generate-classroom'],
    ['GET', '/api/generate-classroom/job-1'],
    ['POST', '/api/generate/scene-content'],
    ['POST', '/api/generate/tts'],
    ['POST', '/api/extract-document'],
    ['POST', '/api/parse-pdf'],
    ['POST', '/api/verify-model'],
    ['GET', '/api/server-providers'],
    ['GET', '/api/skills'],
    ['POST', '/api/materials'],
    ['POST', '/api/export-video/render'],
    ['GET', '/api/agent/runtime'],
    ['POST', '/api/classroom'],
    ['POST', '/api/stages'],
    ['PATCH', '/api/stages/course-1'],
    ['POST', '/api/stages/course-1/publish'],
    ['DELETE', '/api/folders/folder-1'],
    ['PUT', '/api/persistence/documents/course-1'],
  ])('hides %s %s', (method, pathname) => {
    expect(learnerBoundaryDecision({ method, pathname })).toBe('not-found');
  });

  it('allows read-only document and stage requests', () => {
    expect(
      learnerBoundaryDecision({ method: 'GET', pathname: '/api/persistence/documents/course-1' }),
    ).toBe('allow');
    expect(learnerBoundaryDecision({ method: 'GET', pathname: '/api/stages/course-1' })).toBe(
      'allow',
    );
  });
});
