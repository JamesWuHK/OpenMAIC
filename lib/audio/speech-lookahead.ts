/** One queued clip may be synthesized while the current clip plays. This cache
 * never plays media or changes queue order. Session cleanup invalidates even a
 * loader that resolves after abort, so old classroom audio cannot be reused.
 */
export function createSpeechLookahead<Item, Value>(options: {
  key: (item: Item) => string;
  load: (item: Item, signal: AbortSignal) => Promise<Value>;
}) {
  type Outcome = { ok: true; value: Value } | { ok: false; error: unknown };
  type Entry = { key: string; epoch: number; controller: AbortController; result: Promise<Outcome> };
  let epoch = 0;
  let pending: Entry | undefined;
  const active = new Set<Entry>();
  const aborted = () => new DOMException('Speech request retired', 'AbortError');

  const create = (item: Item): Entry => {
    const controller = new AbortController();
    const entry: Entry = { key: options.key(item), epoch, controller, result: null! };
    active.add(entry);
    entry.result = Promise.resolve().then(async (): Promise<Outcome> => {
      try {
        if (controller.signal.aborted || entry.epoch !== epoch) return { ok: false, error: aborted() };
        const value = await options.load(item, controller.signal);
        return controller.signal.aborted || entry.epoch !== epoch
          ? { ok: false, error: aborted() } : { ok: true, value };
      } catch (error) { return { ok: false, error }; }
      finally { active.delete(entry); }
    });
    return entry;
  };

  return {
    warm(item: Item) {
      const key = options.key(item);
      if (pending?.key === key && pending.epoch === epoch) return;
      pending?.controller.abort();
      pending = create(item);
    },
    read(item: Item, signal: AbortSignal): Promise<Value> {
      if (signal.aborted) return Promise.reject(aborted());
      const key = options.key(item);
      const entry = pending?.key === key && pending.epoch === epoch ? pending : create(item);
      if (entry === pending) pending = undefined;
      return new Promise<Value>((resolve, reject) => {
        let settled = false;
        const finish = (result: Outcome) => {
          if (settled) return;
          settled = true;
          signal.removeEventListener('abort', stop);
          entry.controller.signal.removeEventListener('abort', retired);
          if (result.ok) resolve(result.value); else reject(result.error);
        };
        const retired = () => finish({ ok: false, error: aborted() });
        const stop = () => { entry.controller.abort(); retired(); };
        signal.addEventListener('abort', stop, { once: true });
        entry.controller.signal.addEventListener('abort', retired, { once: true });
        if (signal.aborted || entry.controller.signal.aborted) stop();
        void entry.result.then(result => {
          if (signal.aborted || entry.epoch !== epoch) { retired(); return; }
          finish(result);
        });
      });
    },
    clear() {
      epoch++;
      pending = undefined;
      for (const entry of active) entry.controller.abort();
      active.clear();
    },
  };
}
