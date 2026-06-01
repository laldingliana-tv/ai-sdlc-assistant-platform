// Orchestration owner: LangGraph
import { StateGraph } from '@langchain/langgraph';
import type { BaseAgent } from '@ai-sdlc/agents/core';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';
import { PlannerState } from './planner.state.js';

const GOLDEN_DEMO_RESPONSE = `## Implementation Plan: Dark Mode Support

### Phase 1: Design System Updates
1. Define dark mode color tokens in the shared design system
2. Create CSS custom properties for light/dark theme switching
3. Update component library primitives with theme-aware styles

### Phase 2: MFE Infrastructure
4. Add ThemeProvider context to shell application
5. Implement theme persistence (localStorage + user preferences API)
6. Create useTheme() hook for MFE consumption

### Phase 3: MFE Migration (per-MFE)
7. Audit existing hardcoded colors in each MFE
8. Replace with theme tokens
9. Test contrast ratios (WCAG AA compliance)

### Phase 4: Integration & QA
10. Cross-MFE theme synchronization via shell events
11. E2E visual regression tests
12. Performance audit (no layout shifts on toggle)

**Estimated effort:** 3 sprints across 5 MFEs
**Risk:** Legacy components in billing MFE may need refactoring`;

/**
 * PlannerAgent — decomposes a high-level task into an actionable plan.
 * Uses LangGraph for reasoning; returns canned golden demo response for stubs.
 */
export class PlannerAgent implements BaseAgent {
  readonly name = 'planner';

  createGraph() {
    const graph = new StateGraph(PlannerState)
      .addNode('plan', async (state) => {
        // Stub: return golden demo response instead of calling LLM
        return {
          output: GOLDEN_DEMO_RESPONSE,
          plan: [
            'Design system updates',
            'MFE infrastructure',
            'MFE migration',
            'Integration & QA',
          ],
          reasoning: 'Decomposed dark mode task into 4 phases with 12 steps.',
          messages: [{ role: 'assistant', content: GOLDEN_DEMO_RESPONSE }],
        };
      })
      .addEdge('__start__', 'plan')
      .addEdge('plan', '__end__');

    return graph.compile();
  }

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const start = Date.now();
    const compiled = this.createGraph();
    const result = await compiled.invoke({
      input: `${input.context.taskTitle}: ${input.context.taskDescription}`,
    });

    return {
      agentName: 'planner',
      status: 'completed',
      result: {
        content: result.output,
        structuredOutput: { plan: result.plan, reasoning: result.reasoning },
      },
      durationMs: Date.now() - start,
      tokenUsage: { promptTokens: 250, completionTokens: 480, totalTokens: 730 },
    };
  }
}
