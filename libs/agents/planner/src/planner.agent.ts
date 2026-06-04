// Orchestration owner: LangGraph
import type { BaseAgent } from '@ai-sdlc/agents/core';
import { parseStructuredOutput, isRetryableError } from '@ai-sdlc/agents/core';
import type { ModelGateway } from '@ai-sdlc/ai/model-gateway';
import { PlannerOutputSchema } from '@ai-sdlc/shared/schemas';
import type { AgentInput, AgentOutput, PlannerOutput } from '@ai-sdlc/shared/types';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StateGraph } from '@langchain/langgraph';

import { PlannerState } from './planner.state.js';

const SYSTEM_PROMPT = `You are a planning agent. Break down the following task into a structured, phased plan.

You MUST respond with valid JSON matching this exact schema:
{
  "agent": "planner",
  "phases": [
    {
      "id": 1,
      "title": "Phase title",
      "description": "What this phase accomplishes",
      "steps": [
        {
          "id": 1,
          "action": "Specific action to take",
          "acceptanceCriteria": "How to verify this step is complete",
          "estimatedEffort": "small" | "medium" | "large"
        }
      ],
      "dependencies": []
    }
  ],
  "summary": "One-paragraph summary of the overall plan",
  "estimatedComplexity": "low" | "medium" | "high"
}

Rules:
- Each phase should have clear, numbered steps with acceptance criteria
- Dependencies reference phase IDs that must complete first
- Effort estimates: small (<1h), medium (1-4h), large (4h+)
- Be specific and actionable — avoid vague steps`;

/**
 * PlannerAgent — decomposes a high-level task into an actionable plan.
 * Uses the Model Gateway for LLM calls via the 'planning' profile.
 */
export class PlannerAgent implements BaseAgent {
  readonly name = 'planner';

  constructor(private readonly gateway: ModelGateway) {}

  createGraph() {
    const graph = new StateGraph(PlannerState)
      .addNode('planTask', async (state) => {
        return {
          output: state.input,
          plan: [],
          reasoning: '',
          messages: [],
        };
      })
      .addEdge('__start__', 'planTask')
      .addEdge('planTask', '__end__');

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
        profile: { name: 'planning', overrides: { responseFormat: 'json' } },
        messages,
        metadata: { agentName: this.name, taskId: input.taskId },
      });

      const structured = parseStructuredOutput<PlannerOutput>(
        response.content,
        PlannerOutputSchema,
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
