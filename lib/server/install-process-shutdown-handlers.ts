/**
 * Drain background workers after Next finishes its HTTP shutdown, before exit.
 * Next installs its handlers before it invokes instrumentation.register().
 * Next's signal handler returns void and ultimately calls process.exit; defer
 * that final exit only during signal shutdown so active requests retain access
 * to shared resources until the HTTP server has finished draining.
 */
export function installProcessShutdownHandlers(shutdown: () => Promise<void>): void {
  const signals = ['SIGTERM', 'SIGINT'] as const;
  const previous = new Map(
    signals.map(
      (signal) =>
        [signal, process.rawListeners(signal) as Array<(signal: NodeJS.Signals) => void>] as const,
    ),
  );
  let started = false;

  for (const signal of signals) {
    for (const listener of previous.get(signal)!) {
      process.removeListener(signal, listener);
    }
    process.on(signal, () => {
      if (started) return;
      started = true;
      const exit = process.exit;
      let draining = false;
      process.exit = ((code?: Parameters<typeof process.exit>[0]) => {
        if (draining) return;
        draining = true;
        // A pending promise alone does not keep Node alive after server.close().
        const keepAlive = setInterval(() => {}, 1000);
        void Promise.resolve()
          .then(shutdown)
          .catch((error: unknown) => {
            console.error('[instrumentation] Process shutdown failed', error);
          })
          .finally(() => {
            clearInterval(keepAlive);
            process.exit = exit;
            exit.call(process, code);
          });
      }) as typeof process.exit;
      const listeners = previous.get(signal)!;
      if (listeners.length === 0) {
        process.exit(signal === 'SIGTERM' ? 143 : 130);
      }
      for (const listener of listeners) {
        listener.call(process, signal);
      }
    });
  }
}
