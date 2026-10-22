export const C02_ROUTE = '/classroom/hk-c01-02-reason-evidence';
export const C02_KEY = 'wanli:c01-02:portfolio:v1';
export const C02_SCENES = Object.freeze({
  'c01-02-baseline': 'baseline',
  'c01-02-lens': 'lens',
  'c01-02-bridge': 'bridge',
  'c01-02-workspace': 'workspace',
  'c01-02-peer': 'peer',
  'c01-02-transfer': 'transfer',
  'c01-02-exit': 'exit',
});

function usableSlot(slot, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  for (const key of ['attempts', 'history']) {
    if (value[key] !== undefined && (!Array.isArray(value[key]) || value[key].some(v => !v || typeof v !== 'object' || Array.isArray(v)))) return false;
  }
  if (slot === 'lens' && value.entries !== undefined) {
    if (!value.entries || typeof value.entries !== 'object' || Array.isArray(value.entries)) return false;
    for (const [id, entry] of Object.entries(value.entries)) {
      if (!['openings', 'preferences', 'staff', 'ai'].includes(id) || !entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
      for (const field of ['identity', 'date', 'support', 'missing']) if (entry[field] !== undefined && typeof entry[field] !== 'string') return false;
    }
  }
  for (const key of ['roles','confidence']) {
    if (value[key] !== undefined && (!value[key] || typeof value[key] !== 'object' || Array.isArray(value[key]) || Object.values(value[key]).some(v=>typeof v!=='string'||v.length>80))) return false;
  }
  if (value.initial !== undefined && (!value.initial || typeof value.initial !== 'object' || Array.isArray(value.initial) || value.initial.initial !== undefined || !usableSlot('baseline',value.initial))) return false;
  for (const field of ['problem','scope','explanation','prior','plan','reason','evidence','limit','next','boundary','review','restatement','learnerReply','missingEvidence','identity','reflection']) {
    if (value[field] !== undefined && (typeof value[field] !== 'string' || value[field].length > 2000)) return false;
  }
  return true;
}

// A null-origin frame gets only this lesson's explicitly scoped data slots, never a
// general localStorage proxy. The caller supplies the actual iframe window.
export function portfolioReply(event, frameWindow, sceneId, pathname, storage) {
  const slot = C02_SCENES[sceneId];
  if (!frameWindow || event.source !== frameWindow || event.origin !== 'null' ||
      pathname !== C02_ROUTE || !slot) return null;
  const d = event.data;
  if (!d || d.channel !== 'wanli-c02-v1' || typeof d.requestId !== 'string' ||
      d.requestId.length > 80 || !['load', 'save'].includes(d.op)) return null;
  const reply = { channel: 'wanli-c02-v1', requestId: d.requestId };
  try {
    const raw = storage.getItem(C02_KEY);
    const doc = raw ? JSON.parse(raw) : { version: 1 };
    if (!doc || doc.version !== 1 || typeof doc !== 'object' || Array.isArray(doc)) {
      throw new Error('invalid stored document');
    }
    for (const name of Object.values(C02_SCENES)) {
      if (doc[name] != null && !usableSlot(name, doc[name])) throw new Error('invalid slot');
    }
    if (d.op === 'save') {
      const json = JSON.stringify(d.value);
      if (!usableSlot(slot, d.value) ||
          json.length > 60000 || /"(?:__proto__|constructor|prototype)"\s*:/.test(json)) {
        return { ...reply, ok: false, error: 'invalid-data' };
      }
      doc[slot] = JSON.parse(json);
      storage.setItem(C02_KEY, JSON.stringify(doc));
    }
    return { ...reply, ok: true, document: {
      version: 1, ...Object.fromEntries(Object.values(C02_SCENES).map(name=>[name,doc[name]??null])),
    } };
  } catch {
    // Never overwrite corrupt or unavailable storage with an empty "success".
    return { ...reply, ok: false, error: 'storage-unavailable' };
  }
}
