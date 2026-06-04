// Orchestration owner: LangGraph
import type { BaseAgent } from '@ai-sdlc/agents/core';
import { parseStructuredOutput, isRetryableError } from '@ai-sdlc/agents/core';
import type { ModelGateway } from '@ai-sdlc/ai/model-gateway';
import { RetrieverOutputSchema } from '@ai-sdlc/shared/schemas';
import type { AgentInput, AgentOutput, RetrieverOutput } from '@ai-sdlc/shared/types';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StateGraph } from '@langchain/langgraph';

import { RetrieverState } from './retriever.state.js';

const SYSTEM_PROMPT = `You are a retrieval agent. Identify relevant code files, documentation, ADRs, RFCs, and external references for the given task.

You MUST respond with valid JSON matching this exact schema:
{
  "agent": "retriever",
  "sources": [
    {
      "path": "relative/path/to/file.ts",
      "type": "code" | "documentation" | "adr" | "rfc" | "external",
      "relevance": 0.0-1.0,
      "snippet": "optional relevant code/text snippet",
      "reason": "Why this source is relevant to the task"
    }
  ],
  "summary": "Brief summary of what was found and how it relates to the task",
  "confidence": 0.0-1.0
}

Rules:
- Order sources by relevance (highest first)
- Be specific about file paths — use the actual project structure
- Relevance is a float 0.0 to 1.0 (1.0 = directly addresses the task)
- Confidence reflects how well the retrieved context covers the task needs
- Include snippets only when they add value (key interfaces, function signatures)`;

/**
 * RetrieverAgent — gathers relevant context from codebase, docs, and external sources.
 * Uses the Model Gateway for LLM calls via the 'retrieval' profile.
 */
export class RetrieverAgent implements BaseAgent {
  readonly name = 'retriever';

  constructor(private readonly gateway: ModelGateway) {}

  createGraph() {
    const graph = new StateGraph(RetrieverState)
      .addNode('retrieve', async (state) => {
        return {
          output: state.input,
          sources: [],
          relevantContext: '',
          messages: [],
        };
      })
      .addEdge('__start__', 'retrieve')
      .addEdge('retrieve', '__end__');

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
        profile: { name: 'retrieval', overrides: { responseFormat: 'json' } },
        messages,
        metadata: { agentName: this.name, taskId: input.taskId },
      });

      const structured = parseStructuredOutput<RetrieverOutput>(
        response.content,
        RetrieverOutputSchema,
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
