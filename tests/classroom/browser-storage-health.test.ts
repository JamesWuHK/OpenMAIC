import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isBrowserStorageUnavailable,
  markBrowserStorageUnavailable,
  probeBrowserStorage,
  resetBrowserStorageHealthForTests,
} from '@/lib/utils/browser-storage-health';

describe('browser storage health', () => {
  beforeEach(() => resetBrowserStorageHealthForTests());
  afterEach(() => vi.unstubAllGlobals());

  it('stays offline for the rest of the page session after the first failure', () => {
    expect(isBrowserStorageUnavailable()).toBe(false);

    markBrowserStorageUnavailable();

    expect(isBrowserStorageUnavailable()).toBe(true);
  });

  it('reports unavailable when Chromium throws before opening a database', async () => {
    vi.stubGlobal('indexedDB', {
      open: vi.fn(() => {
        throw new DOMException('Internal error', 'UnknownError');
      }),
    });

    await expect(probeBrowserStorage()).resolves.toBe(false);
  });
});
