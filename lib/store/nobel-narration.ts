import { create } from 'zustand';

// Explicit opt-in: existing courses retain their current playback owner.
export const NOBEL_NARRATION_STAGE = 'hk-nobel-07-sakaguchi-lecture-v1';
export const isNobelNarrationScene = (id: string) => /^nobel07-sakaguchi-page-(?:0[1-9]|1[0-2])$/.test(id);
type SavedAnswer = { answers: Record<string, number>; vote: 'A' | 'B' | null };
type Session = {
  active: string | null; blocked: boolean; reading: 'zh-Hans' | 'zh-Hant';
  voice: 'zh-CN' | 'yue-HK'; muted: boolean; volume: number; playing: boolean; transcript: string;
  saved: Record<string, SavedAnswer>;
};
const initial = (): Session => ({ active: null, blocked: true, reading: 'zh-Hant', voice: 'yue-HK', muted: false, volume: 1, playing: false, transcript: '', saved: {} });
export const useNobelNarration = create<Session>(() => initial());
const frames = new Map<string, Window>();
const visibleFrames = new Set<string>();

function sync() {
  const s = useNobelNarration.getState();
  for (const [sceneId, frame] of frames) frame.postMessage({
    type: 'nobel:narration-state', sceneId, active: s.active === sceneId && visibleFrames.has(sceneId),
    blocked: s.blocked, reading: s.reading, voice: s.voice, muted: s.muted,
    volume: s.volume, saved: s.saved[sceneId] ?? { answers: {}, vote: null },
  }, '*');
}
export function setNobelNarrationSession(active: string | null, blocked: boolean, muted: boolean, volume: number) {
  const old = useNobelNarration.getState();
  useNobelNarration.setState({ active, blocked, muted, volume,
    ...((old.active !== active || blocked) ? { playing: false } : {}),
    ...(old.active !== active ? { transcript: '' } : {}) });
  sync();
}
export function resetNobelNarration() {
  useNobelNarration.setState(initial());
  sync(); // Stop retained frames before releasing the classroom session.
}
export function toggleNobelNarration() {
  const s = useNobelNarration.getState();
  if (!s.active || s.blocked || !visibleFrames.has(s.active)) return;
  frames.get(s.active)?.postMessage({ type: 'nobel:narration-toggle', sceneId: s.active }, '*');
}
export function setNobelNarrationFrameVisible(sceneId: string, visible: boolean) {
  if (!isNobelNarrationScene(sceneId)) return;
  if (visible) visibleFrames.add(sceneId); else visibleFrames.delete(sceneId);
  if (!visible && useNobelNarration.getState().active === sceneId) useNobelNarration.setState({ playing: false });
  sync();
}
export function bindNobelNarrationFrame(sceneId: string, frame: Window) {
  if (!isNobelNarrationScene(sceneId)) return () => {};
  frames.set(sceneId, frame);
  sync();
  return () => {
    if (frames.get(sceneId) === frame) {
      frame.postMessage({ type: 'nobel:narration-stop', sceneId }, '*');
      frames.delete(sceneId);
      visibleFrames.delete(sceneId);
    }
  };
}
export function receiveNobelNarrationMessage(sceneId: string, event: MessageEvent) {
  if (!isNobelNarrationScene(sceneId) || event.source !== frames.get(sceneId)) return;
  const d = event.data;
  if (!d || typeof d !== 'object' || d.sceneId !== sceneId) return;
  if (d.type === 'nobel:narration-ready') { sync(); return; }
  const s = useNobelNarration.getState();
  if (s.active !== sceneId || !visibleFrames.has(sceneId)) return;
  if (d.type === 'nobel:narration-preferences' &&
      ['zh-Hans', 'zh-Hant'].includes(d.reading) && ['zh-CN', 'yue-HK'].includes(d.voice)) {
    useNobelNarration.setState({ reading: d.reading, voice: d.voice }); sync();
  } else if (d.type === 'nobel:narration-playing' && typeof d.playing === 'boolean') {
    useNobelNarration.setState({ playing: !s.blocked && d.playing });
  } else if (d.type === 'nobel:narration-transcript' && typeof d.text === 'string' && d.text.length <= 8000) {
    useNobelNarration.setState({ transcript: d.text });
  } else if (d.type === 'nobel:narration-answer' && d.answers && typeof d.answers === 'object' &&
      [null, 'A', 'B'].includes(d.vote)) {
    const answers: Record<string, number> = {};
    for (const k of ['0', '1', '2']) {
      if (Number.isInteger(d.answers[k]) && d.answers[k] >= 0 && d.answers[k] < 3) answers[k] = d.answers[k];
    }
    useNobelNarration.setState({ saved: { ...s.saved, [sceneId]: { answers, vote: d.vote } } });
  }
}
