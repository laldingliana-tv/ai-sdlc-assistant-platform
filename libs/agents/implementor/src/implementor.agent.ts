// Orchestration owner: LangGraph
import type { BaseAgent } from '@ai-sdlc/agents/core';
import { parseStructuredOutput, isRetryableError } from '@ai-sdlc/agents/core';
import type { ModelGateway } from '@ai-sdlc/ai/model-gateway';
import { ImplementorOutputSchema } from '@ai-sdlc/shared/schemas';
import type { AgentInput, AgentOutput, ImplementorOutput } from '@ai-sdlc/shared/types';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StateGraph } from '@langchain/langgraph';

import { ImplementorState } from './implementor.state.js';

const SYSTEM_PROMPT = `You are an implementation agent. Generate concrete code changes for the given task.

You MUST respond with valid JSON matching this exact schema:
{
  "agent": "implementor",
  "changes": [
    {
      "filePath": "relative/path/to/file.ts",
      "action": "create" | "modify" | "delete",
      "language": "typescript",
      "description": "What this change does",
      "diff": "unified diff format (for modify)",
      "content": "full file content (for create)"
    }
  ],
  "testStrategy": {
    "approach": "Description of the testing approach",
    "testFiles": [
      {
        "filePath": "relative/path/to/file.spec.ts",
        "testCases": ["should do X", "should handle Y error"]
      }
    ]
  },
  "summary": "One-paragraph summary of all changes and their purpose"
}

Rules:
- For "modify" actions, provide a unified diff showing the change
- For "create" actions, provide the full file content
- For "delete" actions, no content/diff needed
- Include test files with specific test case descriptions
- Be production-ready: handle errors, follow project conventions
- Use TypeScript with .js extension imports (ESM project convention)`;

/**
 * ImplementorAgent — generates implementation proposals with code snippets.
 * Uses the Model Gateway for LLM calls via the 'coding' profile.
 */
export class ImplementorAgent implements BaseAgent {
  readonly name = 'implementor';

  constructor(private readonly gateway: ModelGateway) {}

  createGraph() {
    const graph = new StateGraph(ImplementorState)
      .addNode('implement', async (state) => {
        return {
          output: state.input,
          codeBlocks: [],
          filesToModify: [],
          testStrategy: '',
          messages: [],
        };
      })
      .addEdge('__start__', 'implement')
      .addEdge('implement', '__end__');

    return graph.compile();
  }

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const startTime = performance.now();
    try {
      const taskDescription = input.context.taskDescription ?? '';
      const taskTitle = input.context.taskTitle ?? '';
      const previousOutputs =
        input.context.previousOutputs.length > 0
          ? JSON.stringify(input.context.previousOutputs).slice(0, 10_000)
          : '';

      const messages = [
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(
          `Task: ${taskTitle}\n\nDescription: ${taskDescription}${previousOutputs ? `\n\nPrevious outputs:\n${previousOutputs}` : ''}`,
        ),
      ];

      const response = await this.gateway.invoke({
        profile: { name: 'coding', overrides: { responseFormat: 'json' } },
        messages,
        metadata: { agentName: this.name, taskId: input.taskId },
      });

      const structured = parseStructuredOutput<ImplementorOutput>(
        response.content,
        ImplementorOutputSchema,
        {
          onParseFailure: ({ error }) => {
            // eslint-disable-next-line no-console
            console.warn(
              `[${this.name}] Structured output parse failed (task=${input.taskId}): ${error}`,
            );
          },
        },
      );

      return {
        agentName: this.name,
        status: 'completed',
        result: {
          content: response.content,
          structuredOutput: structured ?? undefined,
        },
        durationMs: response.metadata.latencyMs,
        tokenUsage: response.usage,
      };
    } catch (error) {
      return {
        agentName: this.name,
        status: 'failed',
        result: undefined,
        durationMs: Math.round(performance.now() - startTime),
        error: {
          code: 'GATEWAY_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: isRetryableError(error),
        },
      };
    }
  }
}
