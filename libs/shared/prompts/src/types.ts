/**
 * Prompt template type definitions.
 */

export interface PromptVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

export interface ModelConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: PromptVariable[];
  modelConfig?: ModelConfig;
  version: string;
}

export type PromptVariables = Record<string, string>;
