// Orchestration owner: LangGraph
import type { BaseAgent } from '@ai-sdlc/agents/core';
import type { ModelGateway } from '@ai-sdlc/ai/model-gateway';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StateGraph } from '@langchain/langgraph';

import { ReviewerState } from './reviewer.state.js';

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
    try {
      const taskDescription = input.context.taskDescription ?? '';
      const taskTitle = input.context.taskTitle ?? '';
      const previousOutputs =
        input.context.previousOutputs.length > 0
          ? JSON.stringify(input.context.previousOutputs)
          : '';

      const messages = [
        new SystemMessage(
          'You are a review agent. Review the output for quality, correctness, and completeness. Provide an overall assessment with a score (1-10), list specific findings, and give a clear approve/reject verdict.',
        ),
        new HumanMessage(
          `Task: ${taskTitle}\n\nDescription: ${taskDescription}${previousOutputs ? `\n\nPrevious outputs:\n${previousOutputs}` : ''}`,
        ),
      ];

      const response = await this.gateway.invoke({
        profile: { name: 'review' },
        messages,
        metadata: { agentName: this.name, taskId: input.taskId },
      });

      return {
        agentName: this.name,
        status: 'completed',
        result: { content: response.content },
        durationMs: response.metadata.latencyMs,
        tokenUsage: response.usage,
      };
    } catch (error) {
      return {
        agentName: this.name,
        status: 'failed',
        result: undefined,
        durationMs: 0,
        error: {
          code: 'GATEWAY_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: false,
        },
      };
    }
  }
}
