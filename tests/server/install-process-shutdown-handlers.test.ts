import { afterEach, describe, expect, it, vi } from 'vitest';
import { installProcessShutdownHandlers } from '@/lib/server/install-process-shutdown-handlers';

afterEach(() => vi.restoreAllMocks());

describe('Node shutdown handler installation', () => {
  it('registers one-shot handlers without shutting down during installation', async () => {
    // Capture listeners; never send a real process signal in a test runner.
    const once = vi.spyOn(process, 'once').mockImplementation(() => process);
    const shutdown = vi.fn(async () => undefined);
    installProcessShutdownHandlers(shutdown);
    expect(once.mock.calls.map(([signal]) => signal)).toEqual(['SIGTERM', 'SIGINT']);
    expect(shutdown).not.toHaveBeenCalled();
    for (const [, listener] of once.mock.calls) {
      listener();
    }
    expect(shutdown).toHaveBeenCalledTimes(2);
  });
});
