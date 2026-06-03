// Orchestration owner: Temporal
import { ImplementorAgent } from '@ai-sdlc/agents/implementor';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';

import type { ActivityInput } from '../workflows/sdlc-task.workflow.js';

import { gateway } from './shared-gateway.js';

/**
 * Temporal activity that invokes the Implementor agent.
 * Non-deterministic — calls agent reasoning via LangGraph.
 */
export async function runImplementorActivity(input: ActivityInput): Promise<AgentOutput> {
  const agent = new ImplementorAgent(gateway);

  const agentInput: AgentInput = {
    taskId: input.taskId,
    agentName: 'implementor',
    context: {
      taskTitle: input.taskTitle,
      taskDescription: input.taskDescription,
      previousOutputs: input.previousOutputs,
    },
  };

  return agent.invoke(agentInput);
}
