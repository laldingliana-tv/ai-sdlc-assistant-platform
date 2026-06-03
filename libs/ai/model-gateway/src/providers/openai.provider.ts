import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';

import type { ModelDefinition } from '../interfaces/model-config.interface.js';

import type {
  ModelProviderAdapter,
  ProviderHealthStatus,
  ProviderOptions,
} from './provider.interface.js';

const DEFAULT_TIMEOUT = 60_000;

export class OpenAIProvider implements ModelProviderAdapter {
  readonly providerType = 'openai' as const;

  createModel(definition: ModelDefinition, options?: ProviderOptions): BaseChatModel {
    return new ChatOpenAI({
      model: definition.modelName,
      maxRetries: 0,
      apiKey: options?.apiKey ?? process.env['OPENAI_API_KEY'],
      timeout: options?.timeout ?? DEFAULT_TIMEOUT,
      ...(options?.temperature !== undefined && { temperature: options.temperature }),
      ...(options?.maxTokens !== undefined && { maxTokens: options.maxTokens }),
      ...(options?.baseUrl && { configuration: { baseURL: options.baseUrl } }),
    });
  }

  validateConfig(): ProviderHealthStatus {
    const apiKey = process.env['OPENAI_API_KEY'];
    if (!apiKey) {
      return {
        healthy: false,
        provider: 'openai',
        error: 'OPENAI_API_KEY environment variable is not set',
      };
    }
    return { healthy: true, provider: 'openai' };
  }
}
