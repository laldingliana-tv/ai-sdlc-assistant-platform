// Orchestration owner: LangGraph
import { StateGraph } from '@langchain/langgraph';
import type { BaseAgent } from '@ai-sdlc/agents/core';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';
import { ImplementorState } from './implementor.state.js';

const GOLDEN_DEMO_RESPONSE = `## Implementation Proposal: Dark Mode Support

### Files to Create/Modify

#### 1. Design Tokens (\`packages/design-tokens/src/themes/dark.json\`)
\`\`\`json
{
  "color": {
    "background": { "primary": "#121212", "secondary": "#1E1E1E", "tertiary": "#2C2C2C" },
    "text": { "primary": "#FFFFFF", "secondary": "#B3B3B3", "disabled": "#666666" },
    "border": { "default": "#333333", "hover": "#555555" },
    "accent": { "primary": "#BB86FC", "secondary": "#03DAC6" }
  }
}
\`\`\`

#### 2. Theme Provider (\`apps/shell/src/providers/ThemeProvider.tsx\`)
\`\`\`typescript
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('theme') as Theme) || 'system'
  );
  // ... implementation with prefers-color-scheme listener
}

export const useTheme = () => useContext(ThemeContext)!;
\`\`\`

#### 3. CSS Variables Build Step (\`packages/design-tokens/scripts/build.ts\`)
\`\`\`typescript
// Transforms JSON tokens → CSS custom properties
// Output: themes/light.css, themes/dark.css
\`\`\`

### Test Strategy
- Unit tests: ThemeProvider state transitions, useTheme hook
- Integration: Theme toggle persists across page reload
- Visual regression: Chromatic snapshots for light/dark variants
- Accessibility: axe-core contrast ratio validation

### Migration Steps per MFE
1. Import shared CSS variables file
2. Replace hardcoded colors with \`var(--color-*)\` references
3. Add component-level dark mode stories
4. Run visual regression tests`;

/**
 * ImplementorAgent — generates implementation proposals with code snippets.
 */
export class ImplementorAgent implements BaseAgent {
  readonly name = 'implementor';

  createGraph() {
    const graph = new StateGraph(ImplementorState)
      .addNode('implement', async (state) => {
        return {
          output: GOLDEN_DEMO_RESPONSE,
          codeBlocks: [
            'dark.json token definitions',
            'ThemeProvider.tsx component',
            'build.ts token pipeline',
          ],
          filesToModify: [
            'packages/design-tokens/src/themes/dark.json',
            'apps/shell/src/providers/ThemeProvider.tsx',
            'packages/design-tokens/scripts/build.ts',
          ],
          testStrategy: 'Unit + Integration + Visual regression + Accessibility testing',
          messages: [{ role: 'assistant', content: GOLDEN_DEMO_RESPONSE }],
        };
      })
      .addEdge('__start__', 'implement')
      .addEdge('implement', '__end__');

    return graph.compile();
  }

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const start = Date.now();
    const compiled = this.createGraph();
    const result = await compiled.invoke({
      input: `${input.context.taskTitle}: ${input.context.taskDescription}`,
    });

    return {
      agentName: 'implementor',
      status: 'completed',
      result: {
        content: result.output,
        structuredOutput: {
          codeBlocks: result.codeBlocks,
          filesToModify: result.filesToModify,
          testStrategy: result.testStrategy,
        },
        artifacts: [
          {
            name: 'dark-tokens',
            type: 'json',
            content: '{"color":{"background":{"primary":"#121212"}}}',
          },
        ],
      },
      durationMs: Date.now() - start,
      tokenUsage: { promptTokens: 680, completionTokens: 720, totalTokens: 1400 },
    };
  }
}
