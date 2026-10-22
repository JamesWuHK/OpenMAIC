/**
 * Session-scoped browser persistence health.
 *
 * Learner playback can continue from the immutable published classroom when
 * IndexedDB is unavailable. Once that failure is observed, later best-effort
 * persistence must stay offline for this page session: repeatedly reopening a
 * broken database creates noisy retries and, in Chromium, Dexie can surface a
 * second unhandled DatabaseClosedError even when the original read is caught.
 */
let unavailable = false;

const PROBE_DATABASE_NAME = 'openmaic-browser-storage-probe';
const PROBE_TIMEOUT_MS = 2_000;

/**
 * Probe IndexedDB without constructing Dexie.
 *
 * Chromium can accept the `indexedDB` global while every database open fails
 * with `UnknownError: Internal error`. Starting Dexie in that state is too
 * late: its Chrome workaround retries the open and may surface an unhandled
 * `DatabaseClosedError` after the classroom loader has already recovered.
 * A tiny native open/close probe lets learner playback take the server-only
 * path before Dexie is touched.
 */
export async function probeBrowserStorage(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') return false;

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (available: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(available);
    };
    const timeout = setTimeout(() => finish(false), PROBE_TIMEOUT_MS);

    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(PROBE_DATABASE_NAME);
    } catch {
      finish(false);
      return;
    }

    request.onerror = () => finish(false);
    request.onblocked = () => finish(false);
    request.onsuccess = () => {
      request.result.close();
      try {
        indexedDB.deleteDatabase(PROBE_DATABASE_NAME);
      } catch {
        // A successful open is sufficient evidence. Cleanup is best-effort.
      }
      finish(true);
    };
  });
}

export function markBrowserStorageUnavailable(): void {
  unavailable = true;
}

export function isBrowserStorageUnavailable(): boolean {
  return unavailable;
}

/** Test hook: browser storage is re-probed by a real page reload. */
export function resetBrowserStorageHealthForTests(): void {
  unavailable = false;
}
