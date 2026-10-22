/**
 * Drain background workers before Next's signal handler exits the process.
 * Next installs its handlers before it invokes instrumentation.register().
 * Merely adding another async listener would let its process.exit race the drain.
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
      void Promise.resolve()
        .then(shutdown)
        .catch((error: unknown) => {
          console.error('[instrumentation] Process shutdown failed', error);
        })
        .then(() => {
          const listeners = previous.get(signal)!;
          if (listeners.length === 0) {
            process.exit(signal === 'SIGTERM' ? 143 : 130);
          }
          for (const listener of listeners) {
            listener.call(process, signal);
          }
        });
    });
  }
}
