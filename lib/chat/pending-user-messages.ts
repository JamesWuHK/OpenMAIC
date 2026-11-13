/**
 * A new user message is scheduled through React state before the agent loop starts.
 * Until that state reaches the ref, preserve the send's snapshot. Resume and
 * initial discussion callers do not supply a pending ID and keep live semantics.
 */
export function selectPendingUserMessages<T extends { id: string }>(
  current: T[] | undefined,
  snapshot: T[],
  pendingUserMessageId?: string,
): T[] {
  if (
    pendingUserMessageId &&
    !current?.some(message => message.id === pendingUserMessageId)
  ) {
    return snapshot;
  }
  return current ?? snapshot;
}
