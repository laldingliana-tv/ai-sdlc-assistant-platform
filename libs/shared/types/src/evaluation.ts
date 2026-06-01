/**
 * Evaluation result and scoring types.
 */

import type { AgentName } from './agent.js';

export type EvaluationCriteria =
  | 'relevance'
  | 'quality'
  | 'completeness'
  | 'accuracy'
  | 'coherence';

export interface EvaluationScore {
  criteria: EvaluationCriteria;
  score: number; // 0.0 - 1.0
  reasoning?: string;
}

export interface EvaluationResult {
  id: string;
  taskId: string;
  agentName: AgentName;
  workflowExecutionId: string;
  scores: EvaluationScore[];
  overallScore: number;
  evaluatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface EvaluationListResponse {
  evaluations: EvaluationResult[];
  total: number;
}
