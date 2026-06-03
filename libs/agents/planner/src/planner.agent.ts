// Orchestration owner: LangGraph
import type { BaseAgent } from '@ai-sdlc/agents/core';
import type { ModelGateway } from '@ai-sdlc/ai/model-gateway';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StateGraph } from '@langchain/langgraph';

import { PlannerState } from './planner.state.js';

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
    try {
      const taskDescription = input.context.taskDescription ?? '';
      const taskTitle = input.context.taskTitle ?? '';
      const previousOutputs =
        input.context.previousOutputs.length > 0
          ? JSON.stringify(input.context.previousOutputs)
          : '';

      const messages = [
        new SystemMessage(
          'You are a planning agent. Break down the following task into structured work items with clear acceptance criteria. Output a phased plan with numbered steps.',
        ),
        new HumanMessage(
          `Task: ${taskTitle}\n\nDescription: ${taskDescription}${previousOutputs ? `\n\nPrevious outputs:\n${previousOutputs}` : ''}`,
        ),
      ];

      const response = await this.gateway.invoke({
        profile: { name: 'planning' },
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
