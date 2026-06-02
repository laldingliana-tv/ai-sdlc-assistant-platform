// Orchestration owner: LangGraph
import type { EvaluationCriteria, AgentOutput, EvaluationScore } from '@ai-sdlc/shared/types';
import type { Evaluator } from './evaluator.interface.js';

/**
 * Registry for evaluator implementations.
 * Uses strategy pattern to allow scoring with multiple evaluation methods.
 */
export class EvaluatorRegistry {
  private evaluators = new Map<EvaluationCriteria, Evaluator>();

  /** Register an evaluator for a specific criteria. */
  register(evaluator: Evaluator): void {
    this.evaluators.set(evaluator.criteria, evaluator);
  }

  /** Unregister an evaluator. */
  unregister(criteria: EvaluationCriteria): void {
    this.evaluators.delete(criteria);
  }

  /** Get a registered evaluator. */
  get(criteria: EvaluationCriteria): Evaluator | undefined {
    return this.evaluators.get(criteria);
  }

  /** List all registered criteria. */
  listCriteria(): EvaluationCriteria[] {
    return [...this.evaluators.keys()];
  }

  /**
   * Evaluate an agent output against all registered criteria.
   * @returns Array of evaluation scores from all registered evaluators.
   */
  async evaluateAll(
    output: AgentOutput,
    context?: Record<string, unknown>,
  ): Promise<EvaluationScore[]> {
    const evaluations = [...this.evaluators.values()].map((e) => e.evaluate(output, context));
    return Promise.all(evaluations);
  }

  /**
   * Evaluate an agent output against specific criteria.
   */
  async evaluate(
    output: AgentOutput,
    criteria: EvaluationCriteria[],
    context?: Record<string, unknown>,
  ): Promise<EvaluationScore[]> {
    const evaluations = criteria
      .map((c) => this.evaluators.get(c))
      .filter((e): e is Evaluator => e !== undefined)
      .map((e) => e.evaluate(output, context));
    return Promise.all(evaluations);
  }
}
