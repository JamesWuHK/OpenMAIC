import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveLegacyNobelRedirect} from '../../lib/learner/legacy-nobel-redirect.ts';

const courses = ['01-kagan', '02-soai', '03-halzen', '04-deisseroth', '05-hegemann', '06-nagel'];
test('each approved legacy Nobel link resolves only to its own published discussion edition', async () => {
  for (const course of courses) {
    const target = `hk-nobel-${course}-discussion-v1`;
    for (const suffix of ['', '-v1', '-v4', '-v19']) {
      assert.equal(await resolveLegacyNobelRedirect(`hk-nobel-${course}-lecture${suffix}`,
        async () => [{id: target}]), target);
    }
  }
});
test('a staged draft or another published course cannot activate the redirect', async () => {
  assert.equal(await resolveLegacyNobelRedirect('hk-nobel-01-kagan-lecture-v4', async () => []), null);
  assert.equal(await resolveLegacyNobelRedirect('hk-nobel-01-kagan-lecture-v4',
    async () => [{id: 'hk-nobel-02-soai-discussion-v1'}]), null);
});
test('other courses and discussion URLs neither redirect nor read the catalog', async () => {
  let reads = 0;
  const load = async () => {reads++; return [];};
  for (const id of ['hk-s04-01-radar-rain', 'hk-nobel-07-foo-lecture-v1',
    'hk-nobel-01-kagan-discussion-v1', 'hk-nobel-02-kagan-lecture-v4',
    'hk-nobel-01-kagan-lecture-v4/other', 'hk-nobel-01-kagan-lecture-v4-evil']) {
    assert.equal(await resolveLegacyNobelRedirect(id, load), null);
  }
  assert.equal(reads, 0);
});
test('catalog failure preserves the existing page rather than issuing an unsafe redirect', async () => {
  assert.equal(await resolveLegacyNobelRedirect('hk-nobel-01-kagan-lecture-v4', async () => {
    throw new Error('catalog unavailable');
  }), null);
});
