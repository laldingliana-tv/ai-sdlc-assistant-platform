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

// ── Structured Output Schemas ────────────────────────────────────────────────

export const PlanStepSchema = z.object({
  id: z.number().int().positive(),
  action: z.string().min(1),
  acceptanceCriteria: z.string().min(1),
  estimatedEffort: z.enum(['small', 'medium', 'large']).optional(),
});

export const PlanPhaseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  steps: z.array(PlanStepSchema).min(1),
  dependencies: z.array(z.number().int().positive()).optional(),
});

export const PlannerOutputSchema = z.object({
  agent: z.literal('planner'),
  phases: z.array(PlanPhaseSchema).min(1),
  summary: z.string().min(1),
  estimatedComplexity: z.enum(['low', 'medium', 'high']),
});

export const RetrievalSourceSchema = z.object({
  path: z.string().min(1),
  type: z.enum(['code', 'documentation', 'adr', 'rfc', 'external']),
  relevance: z.number().min(0).max(1),
  snippet: z.string().optional(),
  reason: z.string().min(1),
});

export const RetrieverOutputSchema = z.object({
  agent: z.literal('retriever'),
  sources: z.array(RetrievalSourceSchema),
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const ArchitectureDecisionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(['proposed', 'accepted', 'rejected']),
  context: z.string().min(1),
  decision: z.string().min(1),
  consequences: z.array(z.string()),
});

export const ArchitectureDiagramSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['mermaid', 'plantuml', 'ascii']),
  content: z.string().min(1),
});

export const ArchitectureOutputSchema = z.object({
  agent: z.literal('architecture'),
  decisions: z.array(ArchitectureDecisionSchema),
  constraints: z.array(z.string()),
  diagrams: z.array(ArchitectureDiagramSchema).optional(),
  verdict: z.enum(['approved', 'needs_changes', 'rejected']),
  rationale: z.string().min(1),
});

export const CodeChangeSchema = z.object({
  filePath: z.string().min(1),
  action: z.enum(['create', 'modify', 'delete']),
  language: z.string().min(1),
  description: z.string().min(1),
  diff: z.string().optional(),
  content: z.string().optional(),
});

export const TestFileSchema = z.object({
  filePath: z.string().min(1),
  testCases: z.array(z.string().min(1)),
});

export const TestStrategySchema = z.object({
  approach: z.string().min(1),
  testFiles: z.array(TestFileSchema),
});

export const ImplementorOutputSchema = z.object({
  agent: z.literal('implementor'),
  changes: z.array(CodeChangeSchema).min(1),
  testStrategy: TestStrategySchema,
  summary: z.string().min(1),
});

export const ReviewFindingSchema = z.object({
  severity: z.enum(['critical', 'major', 'minor', 'suggestion']),
  category: z.enum(['correctness', 'security', 'performance', 'style', 'completeness']),
  file: z.string().optional(),
  line: z.number().int().positive().optional(),
  message: z.string().min(1),
  suggestion: z.string().optional(),
});

export const ReviewerOutputSchema = z.object({
  agent: z.literal('reviewer'),
  verdict: z.enum(['approved', 'changes_requested', 'rejected']),
  score: z.number().min(1).max(10),
  findings: z.array(ReviewFindingSchema),
  summary: z.string().min(1),
});

export const StructuredAgentOutputSchema = z.discriminatedUnion('agent', [
  PlannerOutputSchema,
  RetrieverOutputSchema,
  ArchitectureOutputSchema,
  ImplementorOutputSchema,
  ReviewerOutputSchema,
]);

// ── Core Agent Schemas ───────────────────────────────────────────────────────

export const AgentResultSchema = z.object({
  content: z.string(),
  structuredOutput: StructuredAgentOutputSchema.optional(),
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
