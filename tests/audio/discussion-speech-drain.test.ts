import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForDiscussionSpeechDrain } from '@/lib/audio/wait-for-discussion-speech';

afterEach(() => vi.useRealTimers());

describe('discussion speech completion', () => {
  it('does not finish when only the first queued clause has ended', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const snapshot = { holding: true, segmentDone: 0 };
    let completed = false;
    const result = waitForDiscussionSpeechDrain(() => snapshot, controller.signal).then(() => { completed = true; });
    snapshot.segmentDone = 1;
    await vi.advanceTimersByTimeAsync(150);
    expect(completed).toBe(false);
    snapshot.segmentDone = 2;
    await vi.advanceTimersByTimeAsync(100);
    expect(completed).toBe(false);
    snapshot.holding = false;
    await vi.advanceTimersByTimeAsync(50);
    await result;
    expect(completed).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserves a paused queue until actual speech completes', async () => {
    vi.useFakeTimers();
    let holding = true;
    let completed = false;
    const result = waitForDiscussionSpeechDrain(() => holding, new AbortController().signal).then(() => { completed = true; });
    await vi.advanceTimersByTimeAsync(5000);
    expect(completed).toBe(false);
    holding = false;
    await vi.advanceTimersByTimeAsync(50);
    await result;
  });

  it('aborts promptly for manual stop or scene change and removes its timer', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const result = waitForDiscussionSpeechDrain(() => true, controller.signal);
    const assertion = expect(result).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects an already aborted conversation without reading or starting a timer', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    controller.abort();
    const read = vi.fn(() => false);
    await expect(waitForDiscussionSpeechDrain(read, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(read).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('finishes immediately when discussion audio is disabled or already drained', async () => {
    vi.useFakeTimers();
    await waitForDiscussionSpeechDrain(() => false, new AbortController().signal);
    await waitForDiscussionSpeechDrain(() => ({ holding: false, segmentDone: 8 }), new AbortController().signal);
    expect(vi.getTimerCount()).toBe(0);
  });
});
