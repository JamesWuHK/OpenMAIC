import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

test('image workflow is bounded, manual on the recovery branch, and contains no deployment authority', () => {
  const workflow = JSON.parse(fs.readFileSync(new URL('../../.github/workflows/learner-cloud-image.yml', import.meta.url)));
  assert.deepEqual(workflow.on, {workflow_dispatch: {}});
  assert.deepEqual(workflow.permissions, {contents: 'read'});
  const job = workflow.jobs.candidate;
  assert.deepEqual(job['runs-on'], ['self-hosted', 'Linux', 'X64', 'openmaic', 'cloud-ci']);
  const builder = job.steps.find(step => step.id === 'builder');
  assert.match(builder.uses, /^docker\/setup-buildx-action@[0-9a-f]{40}$/);
  assert.equal(builder.with.use, false);
  assert.equal(builder.with.install, false);
  assert.match(builder.with['driver-opts'], /memory=5g/);
  assert.match(builder.with['driver-opts'], /cpu-quota=150000/);
  assert.equal(builder.with.cleanup, true);
  const scripts = job.steps.map(step => step.run || '').join('\n');
  assert.match(scripts, /nobel-resources.py capacity --after-install/);
  assert.match(scripts, /nobel-resources.py prompts/);
  assert.match(scripts, /nobel-resources.py cleanup/);
  assert(!/secrets\.|docker\s+(prune|system\s+prune|push)|--with-deps|learner-candidate/.test(JSON.stringify(workflow)));
  assert(job.steps.some(step => step.if === 'always()' && step.run?.includes('nobel-resources.py cleanup')));
});
