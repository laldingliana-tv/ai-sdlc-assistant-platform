// Orchestration owner: Temporal
import { ReviewerAgent } from '@ai-sdlc/agents/reviewer';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';

import type { ActivityInput } from '../workflows/sdlc-task.workflow.js';

/**
 * Temporal activity that invokes the Reviewer agent.
 * Non-deterministic — calls agent reasoning via LangGraph.
 */
export async function runReviewerActivity(input: ActivityInput): Promise<AgentOutput> {
  const agent = new ReviewerAgent();

  const agentInput: AgentInput = {
    taskId: input.taskId,
    agentName: 'reviewer',
    context: {
      taskTitle: input.taskTitle,
      taskDescription: input.taskDescription,
      previousOutputs: input.previousOutputs,
    },
  };

  return agent.invoke(agentInput);
}
