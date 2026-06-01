// Orchestration owner: Temporal
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';
import { ImplementorAgent } from '@ai-sdlc/agents/implementor';
import type { ActivityInput } from '../workflows/sdlc-task.workflow.js';

/**
 * Temporal activity that invokes the Implementor agent.
 * Non-deterministic — calls agent reasoning via LangGraph.
 */
export async function runImplementorActivity(input: ActivityInput): Promise<AgentOutput> {
  const agent = new ImplementorAgent();

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
