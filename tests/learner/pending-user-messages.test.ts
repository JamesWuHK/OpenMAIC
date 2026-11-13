import { describe, expect, it } from 'vitest';
import { selectPendingUserMessages } from '@/lib/chat/pending-user-messages';

describe('pending user snapshot before React ref catches up', () => {
  const old = [{ id: 'old' }];
  const sent = [...old, { id: 'new-user' }];
  it('keeps this send while an existing ref is stale', () => {
    expect(selectPendingUserMessages(old, sent, 'new-user')).toBe(sent);
  });
  it('preserves an absent or empty session snapshot', () => {
    expect(selectPendingUserMessages(undefined, sent, 'new-user')).toBe(sent);
    expect(selectPendingUserMessages([], sent, 'new-user')).toBe(sent);
  });
  it('uses new assistant messages once the user is visible in the ref', () => {
    const live = [...sent, { id: 'assistant' }];
    expect(selectPendingUserMessages(live, sent, 'new-user')).toBe(live);
  });
  it('does not resurrect historical users on resume', () => {
    expect(selectPendingUserMessages(old, sent)).toBe(old);
    expect(selectPendingUserMessages([], sent)).toEqual([]);
  });
  it('leaves initial discussion reads live', () => {
    expect(selectPendingUserMessages(old, [])).toBe(old);
  });
});
