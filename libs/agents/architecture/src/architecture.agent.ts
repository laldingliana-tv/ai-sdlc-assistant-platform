// Orchestration owner: LangGraph
import type { BaseAgent } from '@ai-sdlc/agents/core';
import type { ModelGateway } from '@ai-sdlc/ai/model-gateway';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StateGraph } from '@langchain/langgraph';

import { ArchitectureState } from './architecture.state.js';

/**
 * ArchitectureAgent — produces architecture decisions and diagrams.
 * Uses the Model Gateway for LLM calls via the 'planning' profile.
 */
export class ArchitectureAgent implements BaseAgent {
  readonly name = 'architecture';

  constructor(private readonly gateway: ModelGateway) {}

  createGraph() {
    const graph = new StateGraph(ArchitectureState)
      .addNode('architect', async (state) => {
        return {
          output: state.input,
          decisions: [],
          diagrams: [],
          constraints: [],
          messages: [],
        };
      })
      .addEdge('__start__', 'architect')
      .addEdge('architect', '__end__');

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
          'You are an architecture agent. Review the proposal against architectural constraints, produce ADRs, system diagrams, and key technical decisions with rationale.',
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
