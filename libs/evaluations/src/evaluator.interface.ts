// Orchestration owner: LangGraph
import type { AgentOutput, EvaluationCriteria, EvaluationScore } from '@ai-sdlc/shared/types';

/**
 * Interface for evaluator implementations.
 * Each evaluator scores agent outputs against a specific criteria.
 */
export interface Evaluator {
  readonly criteria: EvaluationCriteria;

  /**
   * Score an agent output.
   * @param output - The agent output to evaluate
   * @param context - Optional additional context for evaluation
   * @returns An evaluation score between 0.0 and 1.0 with reasoning
   */
  evaluate(output: AgentOutput, context?: Record<string, unknown>): Promise<EvaluationScore>;
}
