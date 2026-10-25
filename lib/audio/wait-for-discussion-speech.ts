export type DiscussionSpeechSnapshot = boolean | { holding: boolean; segmentDone: number };

/** Wait for the whole speech queue, rather than just one completed audio clause. */
export async function waitForDiscussionSpeechDrain(
  read: () => DiscussionSpeechSnapshot,
  signal: AbortSignal,
): Promise<void> {
  const aborted = () => new DOMException('Discussion stopped', 'AbortError');
  while (true) {
    if (signal.aborted) throw aborted();
    const snapshot = read();
    if (!(typeof snapshot === 'boolean' ? snapshot : snapshot.holding)) return;
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
      };
      const onAbort = () => { cleanup(); reject(aborted()); };
      const timer = setTimeout(() => { cleanup(); resolve(); }, 50);
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) onAbort();
    });
  }
}
