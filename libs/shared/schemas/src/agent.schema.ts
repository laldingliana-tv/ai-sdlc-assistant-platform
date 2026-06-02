import { z } from 'zod';

export const AgentName = z.enum([
  'planner',
  'retriever',
  'reviewer',
  'architecture',
  'implementor',
]);

export const AgentExecutionStatus = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

export const TokenUsageSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
});

export const AgentArtifactSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  content: z.string(),
});

export const AgentResultSchema = z.object({
  content: z.string(),
  structuredOutput: z.record(z.unknown()).optional(),
  artifacts: z.array(AgentArtifactSchema).optional(),
});

export const AgentErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  retryable: z.boolean(),
});

export const AgentOutputSchema = z.object({
  agentName: AgentName,
  status: AgentExecutionStatus,
  result: AgentResultSchema.optional(),
  error: AgentErrorSchema.optional(),
  durationMs: z.number().nonnegative(),
  tokenUsage: TokenUsageSchema.optional(),
  traceId: z.string().optional(),
});

export const AgentConfigSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  tools: z.array(z.string()).optional(),
});

export type AgentOutputInput = z.input<typeof AgentOutputSchema>;
