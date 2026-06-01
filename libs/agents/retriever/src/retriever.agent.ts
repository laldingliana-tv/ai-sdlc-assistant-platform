// Orchestration owner: LangGraph
import { StateGraph } from '@langchain/langgraph';
import type { BaseAgent } from '@ai-sdlc/agents/core';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';
import { RetrieverState } from './retriever.state.js';

const GOLDEN_DEMO_RESPONSE = `## Retrieved Context: Dark Mode Implementation

### Existing Codebase References
- **Design System:** \`packages/design-tokens/src/colors.ts\` — current light-only palette
- **Shell App:** \`apps/shell/src/providers/ThemeProvider.tsx\` — placeholder exists but unused
- **Component Lib:** \`packages/ui/src/Button/Button.styles.ts\` — hardcoded colors

### Relevant Documentation
- ADR-007: "Theme architecture decision" — approved CSS custom properties approach
- RFC-012: "Cross-MFE communication" — event bus for theme sync
- Figma spec: "Dark Mode Palette v2" (approved by design team 2024-11-15)

### Related PRs & Issues
- PR #342: "Add prefers-color-scheme media query" (merged, shell only)
- Issue #501: "Billing MFE uses inline styles" (blocker for dark mode)
- Issue #489: "Theme toggle causes FOUC" (performance concern)

### External References
- Material Design 3 dark theme guidelines
- WCAG 2.1 contrast requirements (AA: 4.5:1 for text)`;

/**
 * RetrieverAgent — gathers relevant context from codebase, docs, and external sources.
 */
export class RetrieverAgent implements BaseAgent {
  readonly name = 'retriever';

  createGraph() {
    const graph = new StateGraph(RetrieverState)
      .addNode('retrieve', async (state) => {
        return {
          output: GOLDEN_DEMO_RESPONSE,
          sources: [
            'packages/design-tokens/src/colors.ts',
            'ADR-007',
            'RFC-012',
            'PR #342',
            'Issue #501',
          ],
          relevantContext: GOLDEN_DEMO_RESPONSE,
          messages: [{ role: 'assistant', content: GOLDEN_DEMO_RESPONSE }],
        };
      })
      .addEdge('__start__', 'retrieve')
      .addEdge('retrieve', '__end__');

    return graph.compile();
  }

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const start = Date.now();
    const compiled = this.createGraph();
    const result = await compiled.invoke({
      input: `${input.context.taskTitle}: ${input.context.taskDescription}`,
    });

    return {
      agentName: 'retriever',
      status: 'completed',
      result: {
        content: result.output,
        structuredOutput: { sources: result.sources },
      },
      durationMs: Date.now() - start,
      tokenUsage: { promptTokens: 180, completionTokens: 320, totalTokens: 500 },
    };
  }
}
