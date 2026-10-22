import type { ThinkingConfig } from '@/lib/types/provider';

export interface ClientModelConfiguration {
  readonly modelId: string;
  readonly modelString: string;
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly providerType?: string;
  readonly requiresApiKey?: boolean;
  readonly isServerConfigured?: boolean;
  readonly thinkingConfig?: ThinkingConfig;
}

export type ClientModelConfigurationError = 'model' | 'api-key' | null;

/**
 * Learner deployments are operated as a hosted service: students must never
 * have to choose a provider or supply credentials before joining a discussion.
 */
export function clientModelConfigurationError(
  config: ClientModelConfiguration,
  learnerDeployment: boolean,
): ClientModelConfigurationError {
  if (learnerDeployment) return null;
  if (!config.modelId) return 'model';
  if (config.requiresApiKey && !config.apiKey && !config.isServerConfigured) return 'api-key';
  return null;
}

/**
 * Omitting browser model fields lets /api/chat resolve the operator-owned
 * chat-adapter route (or DEFAULT_MODEL) without leaking editor preferences.
 */
export function toChatModelRequestFields(
  config: ClientModelConfiguration,
  learnerDeployment: boolean,
) {
  if (learnerDeployment) return { apiKey: '' };
  return {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.modelString,
    providerType: config.providerType,
    thinkingConfig: config.thinkingConfig,
  };
}

/** PBL coach and evaluator requests follow the same operator-owned model
 * policy as learner discussions; authoring preferences never reach a learner
 * request. Locale is independent of model/provider selection. */
export function toPBLModelRequestHeaders(
  config: ClientModelConfiguration,
  learnerDeployment: boolean,
  locale?: string,
): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!learnerDeployment) {
    headers['x-model'] = config.modelString || '';
    headers['x-api-key'] = config.apiKey || '';
    if (config.baseUrl) headers['x-base-url'] = config.baseUrl;
    if (config.providerType) headers['x-provider-type'] = config.providerType;
  }
  if (locale) headers['x-user-locale'] = locale;
  return headers;
}
