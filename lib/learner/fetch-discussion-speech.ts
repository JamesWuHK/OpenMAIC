/** Retry one transient gateway response; never retry cancellation or a client error. */
export async function fetchLearnerDiscussionSpeech(
  init: RequestInit & { signal: AbortSignal },
  request: typeof fetch = fetch,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    init.signal.throwIfAborted();
    const response = await request('/api/learner/speech', init);
    init.signal.throwIfAborted();
    if (attempt === 0 && [502, 503, 504].includes(response.status)) {
      await response.body?.cancel().catch(() => {});
      continue;
    }
    return response;
  }
}

