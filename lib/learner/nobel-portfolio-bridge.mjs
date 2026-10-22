export const NOBEL_ID = 'hk-nobel-01-kagan';
export const NOBEL_CHANNEL = 'wanli-nobel-01-v1';
export const NOBEL_KEY = 'wanli:nobel:01:portfolio:v1';
export const NOBEL_SLOTS = ['baseline','lab','diagnostic','evidence','peer','workspace','transfer','exit'];

function valid(value, depth = 0) {
  if (depth > 6) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'string') return value.length <= 4000;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.length <= 100 && value.every(v => valid(v, depth + 1));
  return value && typeof value === 'object' && Object.keys(value).length <= 30 &&
    Object.entries(value).every(([k,v]) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(k) &&
      !['__proto__','prototype','constructor'].includes(k) && valid(v, depth + 1));
}

/** Only this lesson's null-origin frames can access its bounded evidence document. */
export function nobelPortfolioReply(event, frameWindow, sceneId, pathname, storage) {
  const slot = sceneId.replace(/^nobel01-/, '');
  if (!frameWindow || event.source !== frameWindow || event.origin !== 'null' ||
      pathname !== `/classroom/${NOBEL_ID}` || !NOBEL_SLOTS.includes(slot)) return null;
  const d = event.data;
  if (!d || d.channel !== NOBEL_CHANNEL || !['load','save'].includes(d.op) ||
      typeof d.requestId !== 'string' || d.requestId.length > 80) return null;
  const reply = {channel:NOBEL_CHANNEL,requestId:d.requestId};
  try {
    const raw = storage.getItem(NOBEL_KEY);
    if (raw && raw.length > 200000) throw Error('oversize');
    const doc = raw ? JSON.parse(raw) : {version:1};
    if (!doc || doc.version !== 1 || !valid(doc)) throw Error('corrupt');
    if (d.op === 'save') {
      if (!d.value || Array.isArray(d.value) || !valid(d.value) ||
          JSON.stringify(d.value).length > 20000) return {...reply,ok:false,error:'invalid-data'};
      // An initial judgment is a historical record; later scenes cannot rewrite it.
      if (slot === 'baseline' && doc.baseline?.locked) return {...reply,ok:false,error:'baseline-locked'};
      doc[slot] = structuredClone(d.value);
      if (JSON.stringify(doc).length > 200000) throw Error('oversize');
      storage.setItem(NOBEL_KEY, JSON.stringify(doc));
    }
    return {...reply,ok:true,document:doc};
  } catch {return {...reply,ok:false,error:'storage-unavailable'};}
}
