// Orchestration owner: LangGraph
import type { AgentOutput, EvaluationScore } from '@ai-sdlc/shared/types';
import type { Evaluator } from '../evaluator.interface.js';

/**
 * Quality evaluator stub.
 * Scores the overall quality of an agent's output (structure, depth, clarity).
 * In production, uses LLM-as-judge with a rubric.
 */
export class QualityEvaluator implements Evaluator {
  readonly criteria = 'quality' as const;

  async evaluate(output: AgentOutput, context?: Record<string, unknown>): Promise<EvaluationScore> {
    // Stub: return fixed score based on output characteristics
    const content = output.result?.content ?? '';
    const hasStructuredOutput = output.result?.structuredOutput !== undefined;
    const hasReasonableLength = content.length > 100;

    let score = 0.5;
    if (hasStructuredOutput) score += 0.2;
    if (hasReasonableLength) score += 0.18;

    return {
      criteria: 'quality',
      score: Math.min(score, 1.0),
      reasoning: hasStructuredOutput
        ? 'Output includes structured data and comprehensive content with good formatting.'
        : 'Output lacks structured data; consider adding structured output for downstream consumption.',
    };
  }
}
