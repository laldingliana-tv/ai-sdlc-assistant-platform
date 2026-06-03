import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

import type { ModelDefinition } from '../interfaces/model-config.interface.js';

import type {
  ModelProviderAdapter,
  ProviderHealthStatus,
  ProviderOptions,
} from './provider.interface.js';

export class GoogleProvider implements ModelProviderAdapter {
  readonly providerType = 'google' as const;

  createModel(definition: ModelDefinition, options?: ProviderOptions): BaseChatModel {
    return new ChatGoogleGenerativeAI({
      model: definition.modelName,
      apiKey: options?.apiKey ?? process.env['GOOGLE_API_KEY'],
      maxRetries: 0,
      ...(options?.temperature !== undefined && { temperature: options.temperature }),
      ...(options?.maxTokens !== undefined && { maxOutputTokens: options.maxTokens }),
    }) as unknown as BaseChatModel;
  }

  validateConfig(): ProviderHealthStatus {
    const apiKey = process.env['GOOGLE_API_KEY'];
    if (!apiKey) {
      return {
        healthy: false,
        provider: 'google',
        error: 'GOOGLE_API_KEY environment variable is not set',
      };
    }
    return { healthy: true, provider: 'google' };
  }
}
