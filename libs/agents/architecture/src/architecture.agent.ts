// Orchestration owner: LangGraph
import { StateGraph } from '@langchain/langgraph';
import type { BaseAgent } from '@ai-sdlc/agents/core';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';
import { ArchitectureState } from './architecture.state.js';

const GOLDEN_DEMO_RESPONSE = `## Architecture Decision: Dark Mode Theming

### ADR: Theme Architecture for Multi-MFE Dark Mode

**Status:** Proposed
**Context:** Need to implement dark mode across 5 independently deployed MFEs sharing a common design system.

### Decision

**Approach:** CSS Custom Properties + ThemeProvider Context

\`\`\`
┌─────────────────────────────────────────────────┐
│                  Shell App                        │
│  ┌─────────────────────────────────────────┐    │
│  │         ThemeProvider (Context)          │    │
│  │  - theme state (light/dark/system)      │    │
│  │  - persistence (localStorage + API)     │    │
│  │  - emits theme-changed event            │    │
│  └─────────────────────────────────────────┘    │
│                      │                           │
│    ┌─────────┬───────┼───────┬─────────┐       │
│    ▼         ▼       ▼       ▼         ▼       │
│  [MFE-1]  [MFE-2] [MFE-3] [MFE-4] [MFE-5]   │
│  Each subscribes to theme-changed event         │
│  Each uses CSS custom properties from tokens    │
└─────────────────────────────────────────────────┘
\`\`\`

### Key Decisions
1. **CSS Custom Properties** over CSS-in-JS runtime theming (performance)
2. **Event bus** for cross-MFE sync (decoupled from shell framework)
3. **Design tokens** as single source of truth (JSON → CSS vars build step)
4. **Feature flag** per-MFE for gradual rollout
5. **System preference** detection via \`prefers-color-scheme\`

### Constraints
- No breaking changes to existing component APIs
- Must support SSR (no FOUC)
- Bundle size increase < 2KB per MFE
- Transition animation ≤ 200ms`;

/**
 * ArchitectureAgent — produces architecture decisions and diagrams.
 */
export class ArchitectureAgent implements BaseAgent {
  readonly name = 'architecture';

  createGraph() {
    const graph = new StateGraph(ArchitectureState)
      .addNode('architect', async (state) => {
        return {
          output: GOLDEN_DEMO_RESPONSE,
          decisions: [
            'CSS Custom Properties over CSS-in-JS',
            'Event bus for cross-MFE sync',
            'Design tokens as source of truth',
            'Feature flag per-MFE',
            'System preference detection',
          ],
          diagrams: ['ThemeProvider architecture diagram'],
          constraints: [
            'No breaking changes',
            'Must support SSR',
            'Bundle size < 2KB per MFE',
            'Transition ≤ 200ms',
          ],
          messages: [{ role: 'assistant', content: GOLDEN_DEMO_RESPONSE }],
        };
      })
      .addEdge('__start__', 'architect')
      .addEdge('architect', '__end__');

    return graph.compile();
  }

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const start = Date.now();
    const compiled = this.createGraph();
    const result = await compiled.invoke({
      input: `${input.context.taskTitle}: ${input.context.taskDescription}`,
    });

    return {
      agentName: 'architecture',
      status: 'completed',
      result: {
        content: result.output,
        structuredOutput: {
          decisions: result.decisions,
          diagrams: result.diagrams,
          constraints: result.constraints,
        },
      },
      durationMs: Date.now() - start,
      tokenUsage: { promptTokens: 420, completionTokens: 550, totalTokens: 970 },
    };
  }
}
