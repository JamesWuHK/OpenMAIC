import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isLearnerDeployment,
  resolveDeploymentMode,
  shouldInitializeServerProviders,
} from '@/lib/config/deployment-mode';

const SERVER_MODE = 'OPENMAIC_DEPLOYMENT_MODE';
const PUBLIC_MODE = 'NEXT_PUBLIC_OPENMAIC_DEPLOYMENT_MODE';
const originalServerMode = process.env[SERVER_MODE];
const originalPublicMode = process.env[PUBLIC_MODE];

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalServerMode === undefined) delete process.env[SERVER_MODE];
  else process.env[SERVER_MODE] = originalServerMode;
  if (originalPublicMode === undefined) delete process.env[PUBLIC_MODE];
  else process.env[PUBLIC_MODE] = originalPublicMode;
});

describe('deployment mode', () => {
  it.each([
    [undefined, 'full'],
    ['', 'full'],
    ['full', 'full'],
    ['learner', 'learner'],
    [' LEARNER ', 'learner'],
    ['unknown', 'full'],
  ] as const)('resolves %j as %s', (value, expected) => {
    expect(resolveDeploymentMode(value)).toBe(expected);
  });

  it('uses the server setting before the public build setting', () => {
    process.env[SERVER_MODE] = 'full';
    process.env[PUBLIC_MODE] = 'learner';
    expect(isLearnerDeployment()).toBe(false);

    process.env[SERVER_MODE] = 'learner';
    process.env[PUBLIC_MODE] = 'full';
    expect(isLearnerDeployment()).toBe(true);
  });

  it('falls back to the public build setting in client-like environments', () => {
    delete process.env[SERVER_MODE];
    process.env[PUBLIC_MODE] = 'learner';
    expect(isLearnerDeployment()).toBe(true);
  });

  it('uses the public build setting in the browser even when the process shim has a private value', () => {
    vi.stubGlobal('window', {});
    process.env[SERVER_MODE] = 'full';
    process.env[PUBLIC_MODE] = 'learner';

    expect(isLearnerDeployment()).toBe(true);
  });

  it('does not initialize authoring provider settings in learner deployments', () => {
    process.env[SERVER_MODE] = 'learner';
    expect(shouldInitializeServerProviders()).toBe(false);

    process.env[SERVER_MODE] = 'full';
    expect(shouldInitializeServerProviders()).toBe(true);
  });
});
