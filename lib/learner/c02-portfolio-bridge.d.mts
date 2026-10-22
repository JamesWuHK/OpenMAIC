export const C02_ROUTE: string;
export const C02_KEY: string;
export const C02_SCENES: Readonly<Record<string, string>>;
export function portfolioReply(
  event: MessageEvent, frameWindow: Window | null | undefined,
  sceneId: string, pathname: string,
  storage: Pick<Storage, 'getItem' | 'setItem'>,
): Record<string, unknown> | null;
