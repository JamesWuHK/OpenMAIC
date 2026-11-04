import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiscussionAudioSegment } from '../../lib/audio/discussion-audio-segment.ts';

function fixture(play = async () => {}) {
  const state = { paused: false, current: true, finished: 0, errors: 0, plays: 0, dismissals: 0 };
  const audio = { play: async () => { state.plays++; await play(); }, onended: null, onerror: null };
  const segment = createDiscussionAudioSegment(audio, {
    isCurrent: () => state.current, isPaused: () => state.paused,
    setPaused: value => { state.paused = value; }, onPlaying() {},
    onFinish: () => { state.finished++; }, onError: () => { state.errors++; },
    onUnblocked: () => { state.dismissals++; },
    onBlocked: (retry, skip) => { state.retry = retry; state.skip = skip; },
  });
  return { state, audio, segment };
}

for (const event of ['onended', 'onerror']) {
  test(`${event} while paused completes once and cannot replay the old clip`, async () => {
    const { state, audio, segment } = fixture();
    await segment.play();
    state.paused = true;
    audio[event]();
    state.paused = false;
    await segment.play();
    assert.equal(state.finished, 1);
    assert.equal(state.plays, 1);
  });
}

test('ordinary Resume rejection offers guarded retry and Skip', async () => {
  let blocked = false;
  const f = fixture(async () => { if (blocked) throw Object.assign(new Error(), { name: 'NotAllowedError' }); });
  await f.segment.play();
  blocked = true;
  await f.segment.play();
  assert.equal(f.state.paused, true);
  assert.equal(f.state.finished, 0);
  blocked = false;
  f.state.retry();
  await Promise.resolve();
  assert.equal(f.state.paused, false);
  assert.equal(f.state.plays, 3);
  f.audio.onended();
  assert.equal(f.state.finished, 1);
  const plays = f.state.plays;
  f.state.retry(); f.state.skip();
  assert.equal(f.state.plays, plays);
  assert.equal(f.state.finished, 1);
});

test('media error plus rejected play promise completes once', async () => {
  let reject;
  const f = fixture(() => new Promise((_, no) => { reject = no; }));
  const playing = f.segment.play();
  f.audio.onerror();
  reject(new Error('play failed'));
  await playing;
  assert.equal(f.state.finished, 1);
  assert.equal(f.state.errors, 1);
});

test('intentional pause during pending play retains unfinished segment for Resume', async () => {
  let reject;
  let pending = true;
  const f = fixture(() => pending ? new Promise((_, no) => { reject = no; }) : Promise.resolve());
  const playing = f.segment.play();
  f.state.paused = true;
  reject(Object.assign(new Error(), { name: 'AbortError' }));
  await playing;
  assert.equal(f.state.finished, 0);
  assert.equal(f.state.errors, 0);
  pending = false;
  f.state.paused = false;
  await f.segment.play();
  f.audio.onended();
  assert.equal(f.state.finished, 1);
});

test('stale permission actions and pending rejection cannot change a replacement segment', async () => {
  const f = fixture(async () => { throw Object.assign(new Error(), { name: 'NotAllowedError' }); });
  await f.segment.play();
  f.segment.invalidate();
  f.state.current = false;
  f.state.retry(); f.state.skip();
  assert.equal(f.state.plays, 1);
  assert.equal(f.state.finished, 0);
  assert.equal(f.state.paused, true);
  assert.equal(f.state.dismissals, 2);
});

test('late rejection of pre-pause play cannot complete the successful resumed attempt', async () => {
  let rejectFirst;
  let count = 0;
  const f = fixture(() => ++count === 1 ? new Promise((_, no) => { rejectFirst = no; }) : Promise.resolve());
  const initial = f.segment.play();
  f.state.paused = true;
  f.state.paused = false;
  await f.segment.play();
  rejectFirst(Object.assign(new Error(), { name: 'AbortError' }));
  await initial;
  assert.equal(f.state.plays, 2);
  assert.equal(f.state.finished, 0);
  assert.equal(f.state.errors, 0);
  f.audio.onended();
  assert.equal(f.state.finished, 1);
});
