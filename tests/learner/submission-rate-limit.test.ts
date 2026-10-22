import { afterEach, describe, expect, it } from 'vitest';

import {
  resetTeacherSubmissionRateLimitForTests,
  takeTeacherSubmissionSlot,
  teacherSubmissionIdentity,
} from '@/lib/learner/submission-rate-limit';

afterEach(() => {
  delete process.env.TRUST_PROXY_HEADERS;
  resetTeacherSubmissionRateLimitForTests();
});

describe('teacher submission rate limit', () => {
  it('uses a conservative shared identity unless a trusted proxy is configured', () => {
    expect(teacherSubmissionIdentity(new Headers({ 'x-forwarded-for': '198.51.100.1' }))).toBe(
      'direct',
    );
  });

  it('uses a hash of the proxy-appended client address when proxy headers are trusted', () => {
    process.env.TRUST_PROXY_HEADERS = 'true';
    const identity = teacherSubmissionIdentity(
      new Headers({ 'x-forwarded-for': 'spoofed, 198.51.100.23' }),
    );

    expect(identity).toMatch(/^[a-f0-9]{64}$/);
    expect(identity).not.toContain('198.51.100.23');
  });

  it('allows ten submissions per hour and rejects the next until the window expires', () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(takeTeacherSubmissionSlot('teacher', 1_000)).toBe(true);
    }
    expect(takeTeacherSubmissionSlot('teacher', 1_001)).toBe(false);
    expect(takeTeacherSubmissionSlot('teacher', 3_601_000)).toBe(true);
  });
});
