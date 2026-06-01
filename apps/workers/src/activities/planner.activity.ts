// Orchestration owner: Temporal
import { PlannerAgent } from '@ai-sdlc/agents/planner';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';

import type { ActivityInput } from '../workflows/sdlc-task.workflow.js';

/**
 * Temporal activity that invokes the Planner agent.
 * Non-deterministic — calls agent reasoning via LangGraph.
 */
export async function runPlannerActivity(input: ActivityInput): Promise<AgentOutput> {
  const agent = new PlannerAgent();

  const agentInput: AgentInput = {
    taskId: input.taskId,
    agentName: 'planner',
    context: {
      taskTitle: input.taskTitle,
      taskDescription: input.taskDescription,
      previousOutputs: input.previousOutputs,
    },
  };

  return agent.invoke(agentInput);
}
