import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { AIMessage } from '@langchain/core/messages';

import type { ProviderType } from '../interfaces/model-config.interface.js';
import type {
  ModelGateway,
  ModelProfile,
  ModelRequest,
  ModelResponse,
  ModelStreamChunk,
  TokenUsage,
  ToolCall,
} from '../interfaces/model-gateway.interface.js';
import type { ModelRegistry } from '../registry/model-registry.js';

export class ModelGatewayService implements ModelGateway {
  constructor(private readonly registry: ModelRegistry) {}

  getModel(profile: ModelProfile): BaseChatModel {
    const { definition, mapping } = this.registry.resolveProfile(profile.name);
    return this.registry.createModel(definition, {
      temperature: profile.overrides?.temperature ?? mapping.temperature,
      maxTokens: profile.overrides?.maxTokens ?? mapping.maxTokens,
    });
  }

  async invoke(request: ModelRequest): Promise<ModelResponse> {
    const { definition, mapping } = this.registry.resolveProfile(request.profile.name);
    const model = this.registry.createModel(definition, {
      temperature: request.profile.overrides?.temperature ?? mapping.temperature,
      maxTokens: request.profile.overrides?.maxTokens ?? mapping.maxTokens,
    });

    let invocableModel = model;

    // Apply JSON response format if requested (provider-aware)
    if (request.profile.overrides?.responseFormat === 'json') {
      const bindParams = this.getJsonModeParams(definition.provider);
      invocableModel = (
        invocableModel as unknown as {
          bind: (kwargs: Record<string, unknown>) => BaseChatModel;
        }
      ).bind(bindParams);
    }

    if (request.tools && request.tools.length > 0) {
      invocableModel = (
        invocableModel as unknown as { bindTools: (tools: unknown[]) => BaseChatModel }
      ).bindTools(
        request.tools.map((t) => ({
          name: t.name,
          description: t.description,
          schema: t.parameters,
        })),
      );
    }

    const start = performance.now();
    const response = (await invocableModel.invoke(request.messages)) as unknown as AIMessage;
    const latencyMs = Math.round(performance.now() - start);

    const usage = this.extractUsage(response);
    const toolCalls = this.extractToolCalls(response);

    return {
      content: typeof response.content === 'string' ? response.content : '',
      ...(toolCalls.length > 0 && { toolCalls }),
      usage,
      metadata: {
        modelId: definition.id,
        provider: definition.provider,
        latencyMs,
      },
    };
  }

  async *stream(request: ModelRequest): AsyncIterable<ModelStreamChunk> {
    // TODO: responseFormat: 'json' is not applied during streaming.
    // Most providers don't support JSON mode with streaming. If needed,
    // replicate the bind logic here or throw if responseFormat is requested via stream.
    const { definition, mapping } = this.registry.resolveProfile(request.profile.name);
    const model = this.registry.createModel(definition, {
      temperature: request.profile.overrides?.temperature ?? mapping.temperature,
      maxTokens: request.profile.overrides?.maxTokens ?? mapping.maxTokens,
    });

    const stream = await model.stream(request.messages);

    for await (const chunk of stream) {
      const content = typeof chunk.content === 'string' ? chunk.content : '';
      yield {
        content: content || undefined,
        done: false,
      };
    }

    yield { done: true };
  }

  private extractUsage(response: AIMessage): TokenUsage {
    const metadata = response.usage_metadata;
    if (metadata) {
      return {
        promptTokens: metadata.input_tokens ?? 0,
        completionTokens: metadata.output_tokens ?? 0,
        totalTokens: metadata.total_tokens ?? 0,
      };
    }
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  private extractToolCalls(response: AIMessage): ToolCall[] {
    if (!response.tool_calls || response.tool_calls.length === 0) {
      return [];
    }

    return response.tool_calls.map((tc) => ({
      id: tc.id ?? '',
      name: tc.name,
      arguments: (tc.args as Record<string, unknown>) ?? {},
    }));
  }

  /**
   * Returns provider-specific bind parameters for JSON mode.
   * - OpenAI: `response_format: { type: 'json_object' }`
   * - Anthropic: handled via system prompt (LangChain Anthropic doesn't use response_format);
   *   we still pass the OpenAI-style param since @langchain/anthropic silently ignores it.
   * - Google: `response_mime_type: 'application/json'`
   */
  private getJsonModeParams(provider: ProviderType): Record<string, unknown> {
    switch (provider) {
      case 'google':
        return { response_mime_type: 'application/json' };
      case 'anthropic':
        // Anthropic doesn't have a native JSON mode parameter.
        // JSON output is enforced via the system prompt instruction.
        // Pass response_format anyway — LangChain adapters may support it in the future.
        return { response_format: { type: 'json_object' } };
      case 'openai':
      default:
        return { response_format: { type: 'json_object' } };
    }
  }
}
