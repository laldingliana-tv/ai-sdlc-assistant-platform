// Orchestration owner: LangGraph
import type { BaseAgent } from '@ai-sdlc/agents/core';
import type { ModelGateway } from '@ai-sdlc/ai/model-gateway';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StateGraph } from '@langchain/langgraph';

import { ImplementorState } from './implementor.state.js';

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
    try {
      const taskDescription = input.context.taskDescription ?? '';
      const taskTitle = input.context.taskTitle ?? '';
      const previousOutputs =
        input.context.previousOutputs.length > 0
          ? JSON.stringify(input.context.previousOutputs)
          : '';

      const messages = [
        new SystemMessage(
          'You are an implementation agent. Generate code changes for the given work items. Include file paths, code snippets, and a test strategy. Be precise and production-ready.',
        ),
        new HumanMessage(
          `Task: ${taskTitle}\n\nDescription: ${taskDescription}${previousOutputs ? `\n\nPrevious outputs:\n${previousOutputs}` : ''}`,
        ),
      ];

      const response = await this.gateway.invoke({
        profile: { name: 'coding' },
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
