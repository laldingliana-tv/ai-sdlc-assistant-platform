// Orchestration owner: LangGraph
import type { BaseAgent } from '@ai-sdlc/agents/core';
import type { ModelGateway } from '@ai-sdlc/ai/model-gateway';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StateGraph } from '@langchain/langgraph';

import { RetrieverState } from './retriever.state.js';

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
    try {
      const taskDescription = input.context.taskDescription ?? '';
      const taskTitle = input.context.taskTitle ?? '';
      const previousOutputs =
        input.context.previousOutputs.length > 0
          ? JSON.stringify(input.context.previousOutputs)
          : '';

      const messages = [
        new SystemMessage(
          'You are a retrieval agent. Identify relevant code files, documentation, ADRs, RFCs, and external references for the given task. List sources with brief descriptions of their relevance.',
        ),
        new HumanMessage(
          `Task: ${taskTitle}\n\nDescription: ${taskDescription}${previousOutputs ? `\n\nPrevious outputs:\n${previousOutputs}` : ''}`,
        ),
      ];

      const response = await this.gateway.invoke({
        profile: { name: 'retrieval' },
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
