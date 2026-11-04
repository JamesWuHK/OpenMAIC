'use client';

import { useEffect } from 'react';
import { resetNobelNarration, setNobelNarrationSession } from '@/lib/store/nobel-narration';

/** One owner coordinates the authored narration with the native discussion UI. */
export function NobelNarrationSession({ sceneId, blocked, muted, volume }: {
  sceneId: string | null; blocked: boolean; muted: boolean; volume: number;
}) {
  useEffect(() => {
    setNobelNarrationSession(sceneId, blocked, muted, volume);
  }, [sceneId, blocked, muted, volume]);
  useEffect(() => () => resetNobelNarration(), []);
  return null;
}
