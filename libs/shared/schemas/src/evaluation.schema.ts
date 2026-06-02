import { z } from 'zod';

export const EvaluationCriteria = z.enum([
  'relevance',
  'quality',
  'completeness',
  'accuracy',
  'coherence',
]);

export const EvaluationScoreSchema = z.object({
  criteria: EvaluationCriteria,
  score: z.number().min(0).max(1),
  reasoning: z.string().optional(),
});

export const EvaluationResultSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  agentName: z.enum(['planner', 'retriever', 'reviewer', 'architecture', 'implementor']),
  workflowExecutionId: z.string().uuid(),
  scores: z.array(EvaluationScoreSchema),
  overallScore: z.number().min(0).max(1),
  evaluatedAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export type EvaluationResultInput = z.input<typeof EvaluationResultSchema>;
