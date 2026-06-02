/**
 * Agent input/output contract types.
 */

export type AgentName = 'planner' | 'retriever' | 'reviewer' | 'architecture' | 'implementor';

export type AgentExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AgentInput {
  taskId: string;
  agentName: AgentName;
  context: AgentContext;
  config?: AgentConfig;
}

export interface AgentContext {
  taskTitle: string;
  taskDescription: string;
  previousOutputs: AgentOutput[];
  additionalContext?: Record<string, unknown>;
}

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
}

export interface AgentOutput {
  agentName: AgentName;
  status: AgentExecutionStatus;
  result?: AgentResult;
  error?: AgentError;
  durationMs: number;
  tokenUsage?: TokenUsage;
  traceId?: string;
}

export interface AgentResult {
  content: string;
  structuredOutput?: Record<string, unknown>;
  artifacts?: AgentArtifact[];
}

export interface AgentArtifact {
  name: string;
  type: string;
  content: string;
}

export interface AgentError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
