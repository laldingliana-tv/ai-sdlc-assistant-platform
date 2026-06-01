// Orchestration owner: LangGraph
import { StateGraph } from '@langchain/langgraph';
import type { BaseAgent } from '@ai-sdlc/agents/core';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';
import { ReviewerState } from './reviewer.state.js';

const GOLDEN_DEMO_RESPONSE = `## Review: Dark Mode Implementation Plan

### Overall Assessment: APPROVED ✓ (Score: 8.5/10)

### Strengths
- Phased approach minimizes risk of regressions
- CSS custom properties strategy aligns with ADR-007
- WCAG AA compliance explicitly addressed
- Cross-MFE synchronization via event bus is scalable

### Concerns (Minor)
1. **No fallback strategy** — What happens if a user's browser doesn't support CSS custom properties? (Edge case, <1% of users)
2. **Missing testing strategy for visual regressions** — Recommend adding Chromatic or Percy integration
3. **Sprint estimate may be optimistic** — Billing MFE refactoring (Issue #501) could add 1 sprint

### Recommendations
- Add a progressive enhancement step for legacy browser support
- Include a rollback plan (feature flag to disable dark mode per-MFE)
- Consider adding a "system preference" option alongside manual toggle

### Verdict
The plan is well-structured and comprehensive. Approve with minor suggestions above.`;

/**
 * ReviewerAgent — evaluates plans and implementations against quality criteria.
 */
export class ReviewerAgent implements BaseAgent {
  readonly name = 'reviewer';

  createGraph() {
    const graph = new StateGraph(ReviewerState)
      .addNode('review', async (state) => {
        return {
          output: GOLDEN_DEMO_RESPONSE,
          findings: [
            'No fallback strategy for legacy browsers',
            'Missing visual regression testing plan',
            'Sprint estimate may be optimistic',
          ],
          approved: true,
          score: 8.5,
          messages: [{ role: 'assistant', content: GOLDEN_DEMO_RESPONSE }],
        };
      })
      .addEdge('__start__', 'review')
      .addEdge('review', '__end__');

    return graph.compile();
  }

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const start = Date.now();
    const compiled = this.createGraph();
    const result = await compiled.invoke({
      input: `${input.context.taskTitle}: ${input.context.taskDescription}`,
    });

    return {
      agentName: 'reviewer',
      status: 'completed',
      result: {
        content: result.output,
        structuredOutput: {
          findings: result.findings,
          approved: result.approved,
          score: result.score,
        },
      },
      durationMs: Date.now() - start,
      tokenUsage: { promptTokens: 520, completionTokens: 380, totalTokens: 900 },
    };
  }
}
