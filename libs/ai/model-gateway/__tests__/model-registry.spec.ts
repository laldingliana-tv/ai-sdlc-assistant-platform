import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { ModelDefinition, ProfileMapping } from '../src/interfaces/model-config.interface.js';
import type { ModelProviderAdapter } from '../src/providers/provider.interface.js';
import { ModelRegistry } from '../src/registry/model-registry.js';

const mockDefinition: ModelDefinition = {
  id: 'test-model',
  provider: 'openai',
  modelName: 'gpt-test',
  capabilities: ['coding', 'reasoning'],
  contextWindow: 128_000,
  maxOutputTokens: 4096,
  supportsStreaming: true,
  supportsToolCalling: true,
};

const mockProfile: ProfileMapping = {
  profileName: 'test-profile',
  primaryModelId: 'test-model',
  temperature: 0.5,
  maxTokens: 2048,
};

function createMockProvider(): ModelProviderAdapter {
  const mockModel = { invoke: vi.fn(), stream: vi.fn(), bind: vi.fn() } as any;
  return {
    providerType: 'openai',
    createModel: vi.fn().mockReturnValue(mockModel),
    validateConfig: vi.fn().mockReturnValue({ healthy: true, provider: 'openai' }),
  };
}

describe('ModelRegistry', () => {
  let registry: ModelRegistry;

  beforeEach(() => {
    registry = new ModelRegistry();
  });

  describe('registerModel / getModelDefinition', () => {
    it('should register and retrieve a model definition', () => {
      registry.registerModel(mockDefinition);
      const result = registry.getModelDefinition('test-model');
      expect(result).toEqual(mockDefinition);
    });

    it('should throw on unknown model', () => {
      expect(() => registry.getModelDefinition('nonexistent')).toThrow(
        "Model 'nonexistent' not found in registry",
      );
    });
  });

  describe('registerProfile / resolveProfile', () => {
    it('should register and resolve a profile', () => {
      registry.registerModel(mockDefinition);
      registry.registerProfile(mockProfile);

      const result = registry.resolveProfile('test-profile');
      expect(result.definition).toEqual(mockDefinition);
      expect(result.mapping).toEqual(mockProfile);
    });

    it('should throw on unknown profile', () => {
      expect(() => registry.resolveProfile('nonexistent')).toThrow(
        "Profile 'nonexistent' not found in registry",
      );
    });

    it('should throw when profile references missing model', () => {
      registry.registerProfile(mockProfile);
      expect(() => registry.resolveProfile('test-profile')).toThrow(
        "Model 'test-model' referenced by profile 'test-profile' not found in registry",
      );
    });
  });

  describe('registerProvider / createModel', () => {
    it('should create a model via provider', () => {
      const provider = createMockProvider();
      registry.registerModel(mockDefinition);
      registry.registerProvider(provider);

      const model = registry.createModel(mockDefinition);
      expect(provider.createModel).toHaveBeenCalledWith(mockDefinition, undefined);
      expect(model).toBeDefined();
    });

    it('should throw when provider is missing', () => {
      registry.registerModel(mockDefinition);
      expect(() => registry.createModel(mockDefinition)).toThrow(
        "Provider 'openai' not registered",
      );
    });

    it('should cache model instances by id', () => {
      const provider = createMockProvider();
      registry.registerModel(mockDefinition);
      registry.registerProvider(provider);

      const model1 = registry.createModel(mockDefinition);
      const model2 = registry.createModel(mockDefinition);
      expect(model1).toBe(model2);
      expect(provider.createModel).toHaveBeenCalledTimes(1);
    });
  });

  describe('healthCheck', () => {
    it('should aggregate provider health statuses', () => {
      const healthyProvider = createMockProvider();
      const unhealthyProvider: ModelProviderAdapter = {
        providerType: 'anthropic',
        createModel: vi.fn(),
        validateConfig: vi.fn().mockReturnValue({
          healthy: false,
          provider: 'anthropic',
          error: 'ANTHROPIC_API_KEY not set',
        }),
      };

      registry.registerProvider(healthyProvider);
      registry.registerProvider(unhealthyProvider);

      const statuses = registry.healthCheck();
      expect(statuses).toHaveLength(2);
      expect(statuses[0]).toEqual({ healthy: true, provider: 'openai' });
      expect(statuses[1]).toEqual({
        healthy: false,
        provider: 'anthropic',
        error: 'ANTHROPIC_API_KEY not set',
      });
    });

    it('should return empty array when no providers registered', () => {
      const statuses = registry.healthCheck();
      expect(statuses).toHaveLength(0);
    });
  });

  describe('registeredModels / registeredProfiles', () => {
    it('should list all registered models', () => {
      registry.registerModel(mockDefinition);
      expect(registry.registeredModels).toEqual([mockDefinition]);
    });

    it('should list all registered profiles', () => {
      registry.registerProfile(mockProfile);
      expect(registry.registeredProfiles).toEqual([mockProfile]);
    });
  });
});
