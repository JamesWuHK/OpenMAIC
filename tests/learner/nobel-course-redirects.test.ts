import { afterEach, describe, expect, it, vi } from 'vitest';
import { nobelCourseRedirects } from '@/lib/config/nobel-course-redirects';
import config from '../../next.config';

describe('Nobel learner edition redirects', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('enables the edition mapping only in learner deployments', async () => {
    vi.stubEnv('NEXT_PUBLIC_OPENMAIC_DEPLOYMENT_MODE', '');
    vi.stubEnv('OPENMAIC_DEPLOYMENT_MODE', '');
    expect(await config.redirects!()).toEqual([]);
    vi.stubEnv('OPENMAIC_DEPLOYMENT_MODE', 'learner');
    expect(await config.redirects!()).toEqual(nobelCourseRedirects());
    vi.stubEnv('OPENMAIC_DEPLOYMENT_MODE', '');
    vi.stubEnv('NEXT_PUBLIC_OPENMAIC_DEPLOYMENT_MODE', 'learner');
    expect(await config.redirects!()).toEqual(nobelCourseRedirects());
  });
  it('moves every previous lecture edition to its current edition without loops', () => {
    const rules = nobelCourseRedirects();
    const sources = new Set(rules.map(r => r.source));
    expect(sources.size).toBe(rules.length);
    for (const rule of rules) {
      expect(sources.has(rule.destination)).toBe(false);
      expect(rule.permanent).toBe(false);
      expect(rule.source).toMatch(/^\/classroom\/hk-nobel-/);
    }
  });
  it('updates saved links for all six lessons, including the open sixth lesson', () => {
    const rules = nobelCourseRedirects();
    expect(rules.find(r => r.source === '/classroom/hk-nobel-06-nagel-lecture-v1')?.destination).toBe('/classroom/hk-nobel-06-nagel-lecture-v2');
    expect(rules.find(r => r.source === '/classroom/hk-nobel-03-halzen-lecture-v2')?.destination).toBe('/classroom/hk-nobel-03-halzen-lecture-v4');
    expect(new Set(rules.map(r => r.destination)).size).toBe(6);
    expect(rules.some(r => r.source.includes('hk-c01'))).toBe(false);
  });
});
