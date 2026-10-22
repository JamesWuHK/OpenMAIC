import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('learner OpenRouter discussion model config', () => {
  it('uses the free OpenRouter router and removes the Volcengine discussion model', async () => {
    const example = await readFile(`${process.cwd()}/learner.env.example`, 'utf8');

    expect(example).toContain('OPENROUTER_API_KEY=');
    expect(example).toContain('OPENROUTER_BASE_URL=https://openrouter.ai/api/v1');
    expect(example).toContain('OPENROUTER_MODELS=openrouter/free');
    expect(example).toContain('DEFAULT_MODEL=openrouter:openrouter/free');
    expect(example).not.toMatch(/^DOUBAO_(?:API_KEY|BASE_URL|MODELS)=/m);
    expect(example).not.toMatch(/sk-[A-Za-z0-9]/);
  });
});
