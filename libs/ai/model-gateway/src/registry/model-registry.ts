import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

import type {
  ModelDefinition,
  ProfileMapping,
  ProviderType,
} from '../interfaces/model-config.interface.js';
import type {
  ModelProviderAdapter,
  ProviderHealthStatus,
  ProviderOptions,
} from '../providers/provider.interface.js';

export class ModelRegistry {
  private models = new Map<string, ModelDefinition>();
  private profiles = new Map<string, ProfileMapping>();
  private providers = new Map<ProviderType, ModelProviderAdapter>();
  private instanceCache = new Map<string, BaseChatModel>();

  registerModel(definition: ModelDefinition): void {
    this.models.set(definition.id, definition);
  }

  registerProfile(mapping: ProfileMapping): void {
    this.profiles.set(mapping.profileName, mapping);
  }

  registerProvider(adapter: ModelProviderAdapter): void {
    this.providers.set(adapter.providerType, adapter);
  }

  getModelDefinition(modelId: string): ModelDefinition {
    const definition = this.models.get(modelId);
    if (!definition) {
      throw new Error(`Model '${modelId}' not found in registry`);
    }
    return definition;
  }

  resolveProfile(profileName: string): { definition: ModelDefinition; mapping: ProfileMapping } {
    const mapping = this.profiles.get(profileName);
    if (!mapping) {
      throw new Error(`Profile '${profileName}' not found in registry`);
    }

    const definition = this.models.get(mapping.primaryModelId);
    if (!definition) {
      throw new Error(
        `Model '${mapping.primaryModelId}' referenced by profile '${profileName}' not found in registry`,
      );
    }

    return { definition, mapping };
  }

  createModel(definition: ModelDefinition, options?: ProviderOptions): BaseChatModel {
    const cacheKey = this.buildCacheKey(definition.id, options);
    const cached = this.instanceCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const provider = this.providers.get(definition.provider);
    if (!provider) {
      throw new Error(`Provider '${definition.provider}' not registered`);
    }

    const model = provider.createModel(definition, options);
    this.instanceCache.set(cacheKey, model);
    return model;
  }

  healthCheck(): ProviderHealthStatus[] {
    const statuses: ProviderHealthStatus[] = [];
    for (const provider of this.providers.values()) {
      statuses.push(provider.validateConfig());
    }
    return statuses;
  }

  get registeredModels(): ModelDefinition[] {
    return [...this.models.values()];
  }

  get registeredProfiles(): ProfileMapping[] {
    return [...this.profiles.values()];
  }

  private buildCacheKey(modelId: string, options?: ProviderOptions): string {
    if (!options?.temperature && !options?.maxTokens && !options?.baseUrl) {
      return modelId;
    }
    const baseUrlPart = options?.baseUrl ? `:u=${options.baseUrl}` : '';
    return `${modelId}:t=${options?.temperature ?? ''}:m=${options?.maxTokens ?? ''}${baseUrlPart}`;
  }
}
