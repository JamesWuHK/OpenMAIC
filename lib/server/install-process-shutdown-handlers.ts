/**
 * Keep Node-only process APIs out of the Edge instrumentation bundle.
 *
 * Next compiles the root instrumentation entry for both runtimes. Loading this
 * module only after the root entry has confirmed `NEXT_RUNTIME=nodejs` lets the
 * Edge build omit the signal-listener implementation entirely.
 */
export function installProcessShutdownHandlers(shutdown: () => Promise<void>): void {
  process.once('SIGTERM', () => void shutdown());
  process.once('SIGINT', () => void shutdown());
}
