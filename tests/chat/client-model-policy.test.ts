import { describe, expect, it } from 'vitest';

import {
  clientModelConfigurationError,
  toChatModelRequestFields,
  toPBLModelRequestHeaders,
} from '@/lib/chat/client-model-policy';

const configuredModel = {
  modelId: 'gpt-test',
  modelString: 'openai:gpt-test',
  apiKey: 'browser-secret',
  baseUrl: 'https://example.test/v1',
  providerType: 'openai-compatible',
  requiresApiKey: true,
  isServerConfigured: false,
  thinkingConfig: undefined,
};

describe('classroom chat model policy', () => {
  it('uses the server-managed model in learner mode without asking the student to configure one', () => {
    expect(clientModelConfigurationError({ ...configuredModel, modelId: '' }, true)).toBeNull();
    expect(toChatModelRequestFields(configuredModel, true)).toEqual({ apiKey: '' });
  });

  it('keeps model selection and API-key validation in the full authoring app', () => {
    expect(clientModelConfigurationError({ ...configuredModel, modelId: '' }, false)).toBe('model');
    expect(clientModelConfigurationError({ ...configuredModel, apiKey: '' }, false)).toBe(
      'api-key',
    );
    expect(toChatModelRequestFields(configuredModel, false)).toMatchObject({
      apiKey: 'browser-secret',
      model: 'openai:gpt-test',
      baseUrl: 'https://example.test/v1',
      providerType: 'openai-compatible',
    });
  });

  it('keeps browser model, key and endpoint overrides out of learner PBL coach and evaluation requests', () => {
    expect(toPBLModelRequestHeaders(configuredModel, true, 'zh-HK')).toEqual({
      'Content-Type': 'application/json',
      'x-user-locale': 'zh-HK',
    });
    expect(toPBLModelRequestHeaders(configuredModel, false)).toMatchObject({
      'x-model': 'openai:gpt-test',
      'x-api-key': 'browser-secret',
      'x-base-url': 'https://example.test/v1',
    });
  });
});
