import { createHash } from 'node:crypto';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 10;
const buckets = new Map<string, { startedAt: number; count: number }>();

/**
 * The student app is normally reachable only through the trusted Caddy proxy.
 * Keep one conservative shared bucket unless the operator explicitly enables
 * proxy identity; then use the rightmost forwarded address (the proxy-appended
 * client address) and retain only a one-way hash in process memory.
 */
export function teacherSubmissionIdentity(headers: Headers): string {
  if (process.env.TRUST_PROXY_HEADERS !== 'true') return 'direct';
  const forwarded = headers.get('x-forwarded-for');
  const address = forwarded?.split(',').at(-1)?.trim() || headers.get('x-real-ip')?.trim();
  return address
    ? createHash('sha256').update(address).digest('hex')
    : 'anonymous-proxy-client';
}

export function takeTeacherSubmissionSlot(identity: string, now = Date.now()): boolean {
  const current = buckets.get(identity);
  if (!current || now - current.startedAt >= WINDOW_MS || now < current.startedAt) {
    buckets.set(identity, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= MAX_SUBMISSIONS_PER_WINDOW) return false;
  current.count += 1;
  return true;
}

/** Test-only reset; rate-limit state is intentionally process-local. */
export function resetTeacherSubmissionRateLimitForTests(): void {
  buckets.clear();
}
