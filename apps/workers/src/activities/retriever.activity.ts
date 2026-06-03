// Orchestration owner: Temporal
import { RetrieverAgent } from '@ai-sdlc/agents/retriever';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';

import type { ActivityInput } from '../workflows/sdlc-task.workflow.js';

import { gateway } from './shared-gateway.js';

/**
 * Temporal activity that invokes the Retriever agent.
 * Non-deterministic — calls agent reasoning via LangGraph.
 */
export async function runRetrieverActivity(input: ActivityInput): Promise<AgentOutput> {
  const agent = new RetrieverAgent(gateway);

  const agentInput: AgentInput = {
    taskId: input.taskId,
    agentName: 'retriever',
    context: {
      taskTitle: input.taskTitle,
      taskDescription: input.taskDescription,
      previousOutputs: input.previousOutputs,
    },
  };

  return agent.invoke(agentInput);
}
