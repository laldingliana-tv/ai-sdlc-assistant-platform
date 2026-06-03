import { HumanMessage } from '@langchain/core/messages';
import { describe, it, expect, vi } from 'vitest';

import { ModelGatewayService } from '../src/gateway/model-gateway.service.js';
import type { ModelDefinition, ProfileMapping } from '../src/interfaces/model-config.interface.js';
import type { ModelRequest } from '../src/interfaces/model-gateway.interface.js';
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
  profileName: 'coding',
  primaryModelId: 'test-model',
  temperature: 0.1,
  maxTokens: 8192,
};

function createMockAIMessage(content: string, options?: { toolCalls?: any[]; usage?: any }) {
  return {
    content,
    tool_calls: options?.toolCalls ?? [],
    usage_metadata: options?.usage ?? {
      input_tokens: 100,
      output_tokens: 50,
      total_tokens: 150,
    },
  };
}

function setupRegistry(mockModel: any): ModelRegistry {
  const registry = new ModelRegistry();
  const provider: ModelProviderAdapter = {
    providerType: 'openai',
    createModel: vi.fn().mockReturnValue(mockModel),
    validateConfig: vi.fn().mockReturnValue({ healthy: true, provider: 'openai' }),
  };

  registry.registerModel(mockDefinition);
  registry.registerProfile(mockProfile);
  registry.registerProvider(provider);
  return registry;
}

describe('ModelGatewayService', () => {
  describe('invoke', () => {
    it('should invoke model and return unified response', async () => {
      const mockResponse = createMockAIMessage('Hello, world!');
      const mockModel = {
        invoke: vi.fn().mockResolvedValue(mockResponse),
        stream: vi.fn(),
      };

      const registry = setupRegistry(mockModel);
      const gateway = new ModelGatewayService(registry);

      const request: ModelRequest = {
        profile: { name: 'coding' },
        messages: [new HumanMessage('Write a function')],
      };

      const result = await gateway.invoke(request);

      expect(result.content).toBe('Hello, world!');
      expect(result.usage).toEqual({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      });
      expect(result.metadata.modelId).toBe('test-model');
      expect(result.metadata.provider).toBe('openai');
      expect(result.metadata.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should extract token usage from LangChain response', async () => {
      const mockResponse = createMockAIMessage('response', {
        usage: { input_tokens: 200, output_tokens: 100, total_tokens: 300 },
      });
      const mockModel = {
        invoke: vi.fn().mockResolvedValue(mockResponse),
        stream: vi.fn(),
      };

      const registry = setupRegistry(mockModel);
      const gateway = new ModelGatewayService(registry);

      const result = await gateway.invoke({
        profile: { name: 'coding' },
        messages: [new HumanMessage('test')],
      });

      expect(result.usage).toEqual({
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300,
      });
    });

    it('should return zero usage when metadata is missing', async () => {
      const mockResponse = { content: 'response', tool_calls: [], usage_metadata: undefined };
      const mockModel = {
        invoke: vi.fn().mockResolvedValue(mockResponse),
        stream: vi.fn(),
      };

      const registry = setupRegistry(mockModel);
      const gateway = new ModelGatewayService(registry);

      const result = await gateway.invoke({
        profile: { name: 'coding' },
        messages: [new HumanMessage('test')],
      });

      expect(result.usage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it('should apply profile overrides via provider options', async () => {
      const mockResponse = createMockAIMessage('response');
      const mockModel = {
        invoke: vi.fn().mockResolvedValue(mockResponse),
        stream: vi.fn(),
      };

      const registry = new ModelRegistry();
      const provider: ModelProviderAdapter = {
        providerType: 'openai',
        createModel: vi.fn().mockReturnValue(mockModel),
        validateConfig: vi.fn().mockReturnValue({ healthy: true, provider: 'openai' }),
      };
      registry.registerModel(mockDefinition);
      registry.registerProfile(mockProfile);
      registry.registerProvider(provider);

      const gateway = new ModelGatewayService(registry);

      await gateway.invoke({
        profile: { name: 'coding', overrides: { temperature: 0.9, maxTokens: 1024 } },
        messages: [new HumanMessage('test')],
      });

      expect(provider.createModel).toHaveBeenCalledWith(
        mockDefinition,
        expect.objectContaining({
          temperature: 0.9,
          maxTokens: 1024,
        }),
      );
    });

    it('should map tool calls correctly', async () => {
      const mockResponse = createMockAIMessage('', {
        toolCalls: [
          { id: 'call_1', name: 'search', args: { query: 'hello' } },
          { id: 'call_2', name: 'read_file', args: { path: '/test.ts' } },
        ],
      });
      const mockModel = {
        invoke: vi.fn().mockResolvedValue(mockResponse),
        stream: vi.fn(),
      };

      const registry = setupRegistry(mockModel);
      const gateway = new ModelGatewayService(registry);

      const result = await gateway.invoke({
        profile: { name: 'coding' },
        messages: [new HumanMessage('test')],
      });

      expect(result.toolCalls).toEqual([
        { id: 'call_1', name: 'search', arguments: { query: 'hello' } },
        { id: 'call_2', name: 'read_file', arguments: { path: '/test.ts' } },
      ]);
    });

    it('should measure latency', async () => {
      const mockResponse = createMockAIMessage('response');
      const mockModel = {
        invoke: vi.fn().mockResolvedValue(mockResponse),
        stream: vi.fn(),
      };

      const registry = setupRegistry(mockModel);
      const gateway = new ModelGatewayService(registry);

      const result = await gateway.invoke({
        profile: { name: 'coding' },
        messages: [new HumanMessage('test')],
      });

      expect(result.metadata.latencyMs).toBeGreaterThanOrEqual(0);
      expect(typeof result.metadata.latencyMs).toBe('number');
    });
  });

  describe('stream', () => {
    it('should yield chunks and final done marker', async () => {
      const chunks = [{ content: 'Hello' }, { content: ' world' }, { content: '!' }];
      const mockModel = {
        invoke: vi.fn(),
        stream: vi.fn().mockResolvedValue(
          (async function* () {
            for (const chunk of chunks) {
              yield chunk;
            }
          })(),
        ),
      };

      const registry = setupRegistry(mockModel);
      const gateway = new ModelGatewayService(registry);

      const collected: any[] = [];
      for await (const chunk of gateway.stream({
        profile: { name: 'coding' },
        messages: [new HumanMessage('test')],
      })) {
        collected.push(chunk);
      }

      expect(collected).toHaveLength(4); // 3 content + 1 done
      expect(collected[0]).toEqual({ content: 'Hello', done: false });
      expect(collected[1]).toEqual({ content: ' world', done: false });
      expect(collected[2]).toEqual({ content: '!', done: false });
      expect(collected[3]).toEqual({ done: true });
    });

    it('should handle empty content chunks', async () => {
      const chunks = [{ content: '' }, { content: 'data' }];
      const mockModel = {
        invoke: vi.fn(),
        stream: vi.fn().mockResolvedValue(
          (async function* () {
            for (const chunk of chunks) {
              yield chunk;
            }
          })(),
        ),
      };

      const registry = setupRegistry(mockModel);
      const gateway = new ModelGatewayService(registry);

      const collected: any[] = [];
      for await (const chunk of gateway.stream({
        profile: { name: 'coding' },
        messages: [new HumanMessage('test')],
      })) {
        collected.push(chunk);
      }

      expect(collected[0]).toEqual({ content: undefined, done: false });
      expect(collected[1]).toEqual({ content: 'data', done: false });
      expect(collected[2]).toEqual({ done: true });
    });
  });

  describe('getModel', () => {
    it('should return a model for a profile', () => {
      const mockModel = {
        invoke: vi.fn(),
        stream: vi.fn(),
      };

      const registry = new ModelRegistry();
      const provider: ModelProviderAdapter = {
        providerType: 'openai',
        createModel: vi.fn().mockReturnValue(mockModel),
        validateConfig: vi.fn().mockReturnValue({ healthy: true, provider: 'openai' }),
      };
      registry.registerModel(mockDefinition);
      registry.registerProfile(mockProfile);
      registry.registerProvider(provider);

      const gateway = new ModelGatewayService(registry);

      const model = gateway.getModel({ name: 'coding' });
      expect(model).toBeDefined();
      expect(provider.createModel).toHaveBeenCalledWith(
        mockDefinition,
        expect.objectContaining({
          temperature: 0.1,
          maxTokens: 8192,
        }),
      );
    });
  });
});
