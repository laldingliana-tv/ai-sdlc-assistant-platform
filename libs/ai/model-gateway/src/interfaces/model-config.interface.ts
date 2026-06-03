export type ProviderType = 'openai' | 'anthropic' | 'google';

export type ModelCapability =
  | 'coding'
  | 'reasoning'
  | 'planning'
  | 'summarization'
  | 'vision'
  | 'large-context'
  | 'fast'
  | 'tool-calling';

export interface ModelDefinition {
  id: string;
  provider: ProviderType;
  modelName: string;
  capabilities: ModelCapability[];
  contextWindow: number;
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
}

export interface ProfileMapping {
  profileName: string;
  primaryModelId: string;
  temperature: number;
  maxTokens: number;
}
