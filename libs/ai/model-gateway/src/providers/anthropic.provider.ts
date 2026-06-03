import { ChatAnthropic } from '@langchain/anthropic';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

import type { ModelDefinition } from '../interfaces/model-config.interface.js';

import type {
  ModelProviderAdapter,
  ProviderHealthStatus,
  ProviderOptions,
} from './provider.interface.js';

const DEFAULT_TIMEOUT = 120_000;

export class AnthropicProvider implements ModelProviderAdapter {
  readonly providerType = 'anthropic' as const;

  createModel(definition: ModelDefinition, options?: ProviderOptions): BaseChatModel {
    return new ChatAnthropic({
      model: definition.modelName,
      anthropicApiKey: options?.apiKey ?? process.env['ANTHROPIC_API_KEY'],
      maxRetries: 0,
      ...(options?.temperature !== undefined && { temperature: options.temperature }),
      ...(options?.maxTokens !== undefined && { maxTokens: options.maxTokens }),
      clientOptions: {
        timeout: options?.timeout ?? DEFAULT_TIMEOUT,
        ...(options?.baseUrl && { baseURL: options.baseUrl }),
      },
    });
  }

  validateConfig(): ProviderHealthStatus {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      return {
        healthy: false,
        provider: 'anthropic',
        error: 'ANTHROPIC_API_KEY environment variable is not set',
      };
    }
    return { healthy: true, provider: 'anthropic' };
  }
}
