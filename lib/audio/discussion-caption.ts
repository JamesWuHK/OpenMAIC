import type { PlaybackView } from '../playback/derived-state';

export interface DiscussionCaption {
  messageId: string;
  partId: string;
  agentId: string | null;
  text: string;
}

/** Audio owns the caption until its ended event, followed by a short reading tail. */
export function createDiscussionCaptionController(
  onChange: (caption: DiscussionCaption | null) => void,
  options: {
    schedule?: (callback: () => void, milliseconds: number) => unknown;
    cancel?: (timer: unknown) => void;
    tailMs?: number;
  } = {},
) {
  const schedule = options.schedule ?? ((callback, ms) => setTimeout(callback, ms));
  const cancel = options.cancel ?? (timer => clearTimeout(timer as ReturnType<typeof setTimeout>));
  let current: DiscussionCaption | null = null;
  let timer: unknown;
  let epoch = 0;
  const cancelTail = () => {
    if (timer !== undefined) cancel(timer);
    timer = undefined;
  };
  return {
    start(caption: DiscussionCaption) {
      cancelTail();
      epoch++;
      current = caption;
      onChange(caption);
    },
    finish(caption: DiscussionCaption) {
      if (current !== caption) return;
      cancelTail();
      const finishedEpoch = epoch;
      timer = schedule(() => {
        if (epoch !== finishedEpoch || current !== caption) return;
        timer = undefined;
        current = null;
        onChange(null);
      }, options.tailMs ?? 1200);
    },
    clear() {
      epoch++;
      cancelTail();
      current = null;
      onChange(null);
    },
  };
}

/** SSE may finish ahead of speech. It must not hide or misattribute an audible segment. */
export function withDiscussionCaption(
  view: PlaybackView,
  caption: DiscussionCaption | null,
  speakingStudent: boolean,
): PlaybackView {
  if (!caption) return view;
  const paused = view.phase === 'discussionPaused';
  return {
    ...view,
    audioCaptionActive: true,
    phase: paused ? 'discussionPaused' : 'discussionActive',
    sourceText: caption.text,
    bubbleRole: speakingStudent ? 'agent' : 'teacher',
    activeRole: speakingStudent ? 'agent' : 'teacher',
    buttonState: paused ? 'play' : 'bars',
    isInLiveFlow: true,
    isTopicActive: true,
  };
}
