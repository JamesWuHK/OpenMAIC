type SegmentAudio = Pick<HTMLAudioElement, 'play' | 'onended' | 'onerror'>;

interface SegmentOptions {
  isCurrent(): boolean;
  isPaused(): boolean;
  setPaused(value: boolean): void;
  onPlaying(): void;
  onFinish(): void;
  onError(): void;
  onBlocked(retry: () => void, skip: () => void): void;
  onUnblocked(): void;
}

// Safari's reusable element outlives a clip. Completion and permission actions
// belong to this segment instead, so old events cannot control the next clip.
export function createDiscussionAudioSegment(audio: SegmentAudio, options: SegmentOptions) {
  let finished = false;
  let playAttempt = 0;
  const current = () => !finished && options.isCurrent();
  const finish = () => {
    if (!current()) return;
    finished = true;
    options.onUnblocked();
    options.onFinish();
  };
  const fail = () => {
    if (!current()) return;
    options.onError();
    finish();
  };
  const play = async () => {
    if (!current() || options.isPaused()) return;
    const attempt = ++playAttempt;
    options.onUnblocked();
    options.onPlaying();
    try {
      await audio.play();
    } catch (error) {
      // A deliberate pause or cleanup can reject an in-flight play promise.
      if (!current() || attempt !== playAttempt || options.isPaused()) return;
      if ((error as Error).name === 'NotAllowedError') {
        options.setPaused(true);
        options.onBlocked(
          () => {
            if (!current()) return;
            options.setPaused(false);
            void play();
          },
          () => {
            if (!current()) return;
            options.setPaused(false);
            finish();
          },
        );
      } else {
        fail();
      }
    }
  };
  audio.onended = finish;
  audio.onerror = fail;
  return {
    play,
    invalidate() {
      if (finished) return;
      finished = true;
      options.onUnblocked();
    },
  };
}
