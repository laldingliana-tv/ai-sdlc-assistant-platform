// Orchestration owner: LangGraph
import type { AgentOutput, EvaluationScore } from '@ai-sdlc/shared/types';
import type { Evaluator } from '../evaluator.interface.js';

/**
 * Relevance evaluator stub.
 * Scores how relevant an agent's output is to the original task.
 * In production, uses LLM-as-judge or embedding similarity.
 */
export class RelevanceEvaluator implements Evaluator {
  readonly criteria = 'relevance' as const;

  async evaluate(output: AgentOutput, context?: Record<string, unknown>): Promise<EvaluationScore> {
    // Stub: return fixed high score for golden demo
    const hasContent = output.result?.content && output.result.content.length > 0;

    return {
      criteria: 'relevance',
      score: hasContent ? 0.92 : 0.0,
      reasoning: hasContent
        ? 'Output directly addresses the dark mode implementation task with specific, actionable steps.'
        : 'No content produced by the agent.',
    };
  }
}
