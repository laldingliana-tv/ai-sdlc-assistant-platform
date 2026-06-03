import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

import type { ModelDefinition, ProviderType } from '../interfaces/model-config.interface.js';

export interface ModelProviderAdapter {
  readonly providerType: ProviderType;
  createModel(definition: ModelDefinition, options?: ProviderOptions): BaseChatModel;
  validateConfig(): ProviderHealthStatus;
}

export interface ProviderOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface ProviderHealthStatus {
  healthy: boolean;
  provider: ProviderType;
  error?: string;
}
