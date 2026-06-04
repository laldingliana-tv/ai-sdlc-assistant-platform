// Orchestration owner: LangGraph
import type { BaseAgent } from '@ai-sdlc/agents/core';
import { parseStructuredOutput, isRetryableError } from '@ai-sdlc/agents/core';
import type { ModelGateway } from '@ai-sdlc/ai/model-gateway';
import { ReviewerOutputSchema } from '@ai-sdlc/shared/schemas';
import type { AgentInput, AgentOutput, ReviewerOutput } from '@ai-sdlc/shared/types';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StateGraph } from '@langchain/langgraph';

import { ReviewerState } from './reviewer.state.js';

const SYSTEM_PROMPT = `You are a code review agent. Evaluate the implementation output for quality, correctness, security, and completeness.

You MUST respond with valid JSON matching this exact schema:
{
  "agent": "reviewer",
  "verdict": "approved" | "changes_requested" | "rejected",
  "score": 1-10,
  "findings": [
    {
      "severity": "critical" | "major" | "minor" | "suggestion",
      "category": "correctness" | "security" | "performance" | "style" | "completeness",
      "file": "relative/path/to/file.ts",
      "line": 42,
      "message": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "summary": "Overall assessment explaining the verdict and key observations"
}

Rules:
- Score: 1-3 = rejected, 4-6 = changes requested, 7-10 = approved
- Critical findings → reject; major findings → changes_requested; only minor/suggestions → approved
- Be specific: cite file paths and line numbers where possible
- Include at least one positive observation in the summary
- Suggestions should be actionable and include code examples when helpful`;

/**
 * ReviewerAgent — evaluates plans and implementations against quality criteria.
 * Uses the Model Gateway for LLM calls via the 'review' profile.
 */
export class ReviewerAgent implements BaseAgent {
  readonly name = 'reviewer';

  constructor(private readonly gateway: ModelGateway) {}

  createGraph() {
    const graph = new StateGraph(ReviewerState)
      .addNode('review', async (state) => {
        return {
          output: state.input,
          findings: [],
          approved: false,
          score: 0,
          messages: [],
        };
      })
      .addEdge('__start__', 'review')
      .addEdge('review', '__end__');

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
        profile: { name: 'review', overrides: { responseFormat: 'json' } },
        messages,
        metadata: { agentName: this.name, taskId: input.taskId },
      });

      const structured = parseStructuredOutput<ReviewerOutput>(
        response.content,
        ReviewerOutputSchema,
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
