import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseMessage } from '@langchain/core/messages';

export interface ModelGateway {
  invoke(request: ModelRequest): Promise<ModelResponse>;
  stream(request: ModelRequest): AsyncIterable<ModelStreamChunk>;
  getModel(profile: ModelProfile): BaseChatModel;
}

export interface ModelProfile {
  name: string;
  overrides?: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'text' | 'json';
  };
}

export interface ModelRequest {
  profile: ModelProfile;
  messages: BaseMessage[];
  tools?: ToolDefinition[];
  metadata?: RequestMetadata;
}

export interface ModelResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: TokenUsage;
  metadata: ResponseMetadata;
}

export interface ModelStreamChunk {
  content?: string;
  toolCallDelta?: Partial<ToolCall>;
  done: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface RequestMetadata {
  agentName?: string;
  taskId?: string;
  traceId?: string;
}

export interface ResponseMetadata {
  modelId: string;
  provider: string;
  latencyMs: number;
}
