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
  structuredOutput?: StructuredAgentOutput;
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

// ── Structured Output Types ──────────────────────────────────────────────────

import type {
  PlannerOutputSchema,
  RetrieverOutputSchema,
  ArchitectureOutputSchema,
  ImplementorOutputSchema,
  ReviewerOutputSchema,
  PlanPhaseSchema,
  PlanStepSchema,
  RetrievalSourceSchema,
  ArchitectureDecisionSchema,
  ArchitectureDiagramSchema,
  CodeChangeSchema,
  TestStrategySchema,
  TestFileSchema,
  ReviewFindingSchema,
} from '@ai-sdlc/shared/schemas';
import type { z } from 'zod';

/**
 * Discriminated union of structured outputs, keyed by agent name.
 */
export type StructuredAgentOutput =
  | PlannerOutput
  | RetrieverOutput
  | ArchitectureOutput
  | ImplementorOutput
  | ReviewerOutput;

// ── Planner ──────────────────────────────────────────────────────────────────

export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;
export type PlanPhase = z.infer<typeof PlanPhaseSchema>;
export type PlanStep = z.infer<typeof PlanStepSchema>;

// ── Retriever ────────────────────────────────────────────────────────────────

export type RetrieverOutput = z.infer<typeof RetrieverOutputSchema>;
export type RetrievalSource = z.infer<typeof RetrievalSourceSchema>;

// ── Architecture ─────────────────────────────────────────────────────────────

export type ArchitectureOutput = z.infer<typeof ArchitectureOutputSchema>;
export type ArchitectureDecision = z.infer<typeof ArchitectureDecisionSchema>;
export type ArchitectureDiagram = z.infer<typeof ArchitectureDiagramSchema>;

// ── Implementor ──────────────────────────────────────────────────────────────

export type ImplementorOutput = z.infer<typeof ImplementorOutputSchema>;
export type CodeChange = z.infer<typeof CodeChangeSchema>;
export type TestStrategy = z.infer<typeof TestStrategySchema>;
export type TestFile = z.infer<typeof TestFileSchema>;

// ── Reviewer ─────────────────────────────────────────────────────────────────

export type ReviewerOutput = z.infer<typeof ReviewerOutputSchema>;
export type ReviewFinding = z.infer<typeof ReviewFindingSchema>;
