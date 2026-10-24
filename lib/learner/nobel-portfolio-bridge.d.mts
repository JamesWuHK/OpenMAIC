export const NOBEL_ID: string;
export const NOBEL_CHANNEL: string;
export const NOBEL_KEY: string;
export const NOBEL_SLOTS: string[];
export function nobelPortfolioReply(event: MessageEvent, frameWindow: Window | null | undefined, sceneId: string, pathname: string, storage: Pick<Storage, 'getItem' | 'setItem'>): Record<string, unknown> | null;
