import test from 'node:test';
import assert from 'node:assert/strict';
import {
  D01_PORTFOLIO_CHANNEL,
  d01PortfolioKey,
  d01PortfolioReply,
  readD01SubmissionDraft,
  validD01Portfolio,
} from '../../lib/learner/d01-portfolio-bridge.mjs';

const route = '/classroom/hk-d01-01-desk-creature';
const frame = {};

function fixture() {
  const map = new Map();
  const storage = { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
  const call = (data, sceneId = 'd01-scene-05', eventPatch = {}, pathname = route) =>
    d01PortfolioReply({
      source: frame,
      origin: 'null',
      data: { channel: D01_PORTFOLIO_CHANNEL, requestId: 'request-1', lessonId: 'D01-01', op: 'load', ...data },
      ...eventPatch,
    }, frame, sceneId, pathname, storage);
  return { map, storage, call };
}

test('D01 bridge persists only the scene slot and returns it after a fresh load', () => {
  const { map, call } = fixture();
  const evidence = { values: ['測試不同角度', '側面看不到耳朵'], checked: true, passed: true };
  assert.equal(call({ op: 'save', value: evidence }).ok, true);
  const reloaded = call({ op: 'load' });
  assert.deepEqual(reloaded.document.investigation, evidence);
  assert.deepEqual([...map.keys()], [d01PortfolioKey('D01-01')]);
});

test('D01 storage is isolated by lesson and rejects wrong routes, scenes, windows and origins', () => {
  const { call } = fixture();
  assert.equal(call({ op: 'save', value: { reason: 'student choice' } }, 'd01-scene-04').ok, true);
  assert.equal(call({}, 'd01-scene-01'), null);
  assert.equal(call({}, undefined, { source: {} }), null);
  assert.equal(call({}, undefined, { origin: 'https://attacker.test' }), null);
  assert.equal(call({}, undefined, {}, '/classroom/hk-d01-02-monster-organizer'), null);
  assert.equal(call({}, undefined, {}, '/classroom/other'), null);
});

test('D01 bridge rejects malformed, oversized, or prototype-bearing learner data', () => {
  const { call } = fixture();
  assert.equal(call({ op: 'save', value: { values: 'not-an-array' } }).ok, false);
  assert.equal(call({ op: 'save', value: { values: ['x'.repeat(501)] } }).ok, false);
  assert.equal(call({ op: 'save', value: { values: ['x'.repeat(60001)] } }).ok, false);
  assert.equal(call({ op: 'save', value: JSON.parse('{"__proto__":{"polluted":true}}') }).ok, false);
  assert.equal(validD01Portfolio({ version: 1, lessonId: 'D01-01', arbitraryKey: 'x' }, 'D01-01'), false);
});

test('corrupt or unavailable host storage is not overwritten as an empty portfolio', () => {
  const { map, call } = fixture();
  map.set(d01PortfolioKey('D01-01'), 'broken');
  assert.equal(call({ op: 'save', value: { values: ['x'] } }).ok, false);
  assert.equal(map.get(d01PortfolioKey('D01-01')), 'broken');
  const unavailable = d01PortfolioReply({
    source: frame, origin: 'null', data: { channel: D01_PORTFOLIO_CHANNEL, requestId: 'r', lessonId: 'D01-01', op: 'load' },
  }, frame, 'd01-scene-05', route, { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } });
  assert.equal(unavailable.ok, false);
});

test('active PBL task can import only its matching saved activity as an editable draft', () => {
  const { map } = fixture();
  map.set(d01PortfolioKey('D01-01'), JSON.stringify({
    version: 1, lessonId: 'D01-01',
    investigation: { values: ['固定正面和側面', '只改耳朵角度', '觀察側視圖'], checked: true, passed: true },
    critique: { values: ['目前只有正面圖', '缺少側面檢查', '從側面重新查看'], checked: true, passed: true },
  }));
  const storage = { getItem: (key) => map.get(key) ?? null };
  const investigation = readD01SubmissionDraft(route, 'd01-d01-01-ms-investigation', 'zh-HK', storage);
  assert.match(investigation, /固定正面和側面/);
  assert.match(investigation, /實際產出需另附/);
  assert.equal(readD01SubmissionDraft(route, 'd01-d01-01-ms-revision', 'zh-HK', storage), null);
  assert.equal(readD01SubmissionDraft('/classroom/other', 'd01-d01-01-ms-investigation', 'en', storage), null);
});

test('the six current real-player preview routes can save and restore their own evidence', () => {
  const { call } = fixture();
  for (let number = 1; number <= 6; number++) {
    const suffix = String(number).padStart(2, '0');
    const lessonId = `D01-${suffix}`;
    const preview = `/classroom/d01-${suffix}-pbl-review-20261021-r03`;
    const value = { values: [`Evidence for ${lessonId}`] };
    assert.equal(call({ lessonId, op: 'save', value }, undefined, {}, preview)?.ok, true);
    assert.deepEqual(call({ lessonId }, undefined, {}, preview)?.document.investigation, value);
  }
  assert.equal(call({}, undefined, {}, '/classroom/d01-01-pbl-review-unknown'), null);
  assert.equal(call({}, undefined, {}, '/classroom/d01-07-pbl-review-20261021-r03'), null);
});

test('prototype draft labels follow field names, not object insertion order or missing fields', () => {
  const { map, storage } = fixture();
  map.set(d01PortfolioKey('D01-01'), JSON.stringify({
    version: 1, lessonId: 'D01-01',
    workbench: { evidence: 'Side-view screenshot', reason: 'Make both ears recognisable' },
  }));
  const draft = readD01SubmissionDraft(route, 'd01-d01-01-ms-prototype', 'en', storage);
  assert.match(draft, /Reason: Make both ears recognisable/);
  assert.match(draft, /Comparison evidence: Side-view screenshot/);
  assert.doesNotMatch(draft, /Design choice: Side-view screenshot/);
  assert.equal(readD01SubmissionDraft(route, 'd01-d01-02-ms-prototype', 'en', storage), null);
});
