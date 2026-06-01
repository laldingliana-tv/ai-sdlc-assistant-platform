// Orchestration owner: Temporal
import { ArchitectureAgent } from '@ai-sdlc/agents/architecture';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';

import type { ActivityInput } from '../workflows/sdlc-task.workflow.js';

/**
 * Temporal activity that invokes the Architecture agent.
 * Non-deterministic — calls agent reasoning via LangGraph.
 */
export async function runArchitectureActivity(input: ActivityInput): Promise<AgentOutput> {
  const agent = new ArchitectureAgent();

  const agentInput: AgentInput = {
    taskId: input.taskId,
    agentName: 'architecture',
    context: {
      taskTitle: input.taskTitle,
      taskDescription: input.taskDescription,
      previousOutputs: input.previousOutputs,
    },
  };

  return agent.invoke(agentInput);
}
