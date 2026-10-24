/** Student speech is independent of authoring settings and accepts no provider credentials. */
interface ClassroomRoster {
  stage: { generatedAgentConfigs?: Array<{ id: string; role: string }> };
}

interface SpeechDependencies {
  enabled: () => boolean;
  publishedIds: () => Promise<string[]>;
  readClassroom: (id: string) => Promise<ClassroomRoster | null>;
  synthesize: (config: {
    providerId: 'edge-tts'; voice: string; speed: number; signal: AbortSignal;
  }, text: string) => Promise<{ audio: Uint8Array; format: string }>;
  maxConcurrent?: number;
}

const ROLE_VOICES: Record<string, string> = {
  teacher: 'zh-HK-WanLungNeural',
  assistant: 'zh-HK-HiuMaanNeural',
  student: 'zh-HK-HiuGaaiNeural',
};

const MAX_BODY_BYTES = 16_384;

function json(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) throw new Error('body');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error('body');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('body');
  return body;
}

export function createLearnerSpeechHandler(deps: SpeechDependencies) {
  let active = 0;
  let windowStart = 0;
  let requestsInWindow = 0;
  return async (request: Request): Promise<Response> => {
    if (!deps.enabled()) return json({ error: 'Not found' }, 404);
    const origin = request.headers.get('origin');
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || new URL(request.url).host;
    try {
      if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && new URL(origin).host !== host)) {
        return json({ error: 'Cross-site speech requests are not allowed' }, 403);
      }
    } catch {
      return json({ error: 'Invalid origin' }, 403);
    }
    let body: Record<string, unknown>;
    try { body = await readBody(request); }
    catch { return json({ error: 'Invalid speech request' }, 400); }
    const { classroomId, agentId, text } = body;
    if (
      Object.keys(body).some(key => !['classroomId', 'agentId', 'text'].includes(key)) ||
      typeof classroomId !== 'string' || !/^[\w-]{1,128}$/.test(classroomId) ||
      typeof agentId !== 'string' || agentId.length > 128 ||
      typeof text !== 'string' || !text.trim() || text.length > 2000
    ) return json({ error: 'Invalid speech request' }, 400);

    const now = Date.now();
    if (now - windowStart >= 60_000) { windowStart = now; requestsInWindow = 0; }
    if (active >= (deps.maxConcurrent ?? 4) || requestsInWindow >= 120) {
      return json({ error: 'Speech is busy. Please try again shortly.' }, 429);
    }
    active++;
    requestsInWindow++;
    try {
      if (!(await deps.publishedIds()).includes(classroomId)) return json({ error: 'Course not found' }, 404);
      const classroom = await deps.readClassroom(classroomId);
      const agent = classroom?.stage.generatedAgentConfigs?.find(agent => agent.id === agentId);
      if (!agent || !Object.hasOwn(ROLE_VOICES, agent.role)) return json({ error: 'Classroom speaker not found' }, 404);
      const signal = AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]);
      const result = await deps.synthesize({
        providerId: 'edge-tts', voice: ROLE_VOICES[agent.role], speed: 1.2, signal,
      }, text.trim());
      if (!result.audio.byteLength) throw new Error('Empty speech');
      return json({ base64: Buffer.from(result.audio).toString('base64'), format: result.format });
    } catch (error) {
      // Log only a bounded failure class; provider output and student text are sensitive.
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
      const failureClass = code === 'ENOENT' || code === 'EACCES' ? code
        : code === 'ABORT_ERR' ? 'aborted'
        : error instanceof Error && error.name === 'TTSRequestTimeoutError' ? 'timeout'
        : typeof code === 'number' ? 'provider-exit'
        : 'provider-failure';
      console.error('Learner speech synthesis failed', { failureClass });
      return json({ error: '暫時無法播放語音，請稍後再試。' }, 502);
    } finally { active--; }
  };
}
