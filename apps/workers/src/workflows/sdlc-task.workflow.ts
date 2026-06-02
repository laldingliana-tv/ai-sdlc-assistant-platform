// Orchestration owner: Temporal
import type { AgentOutput } from '@ai-sdlc/shared/types';
import { proxyActivities, setHandler, condition } from '@temporalio/workflow';

import { approveSignal, rejectSignal, getStatusQuery } from './signals.js';

// Activity interfaces — typed stubs for proxyActivities
interface Activities {
  runPlannerActivity(input: ActivityInput): Promise<AgentOutput>;
  runRetrieverActivity(input: ActivityInput): Promise<AgentOutput>;
  runArchitectureActivity(input: ActivityInput): Promise<AgentOutput>;
  runImplementorActivity(input: ActivityInput): Promise<AgentOutput>;
  runReviewerActivity(input: ActivityInput): Promise<AgentOutput>;
}

export interface ActivityInput {
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  previousOutputs: AgentOutput[];
}

export interface SdlcWorkflowInput {
  taskId: string;
  taskTitle?: string;
  taskDescription?: string;
}

export interface SdlcWorkflowResult {
  taskId: string;
  status: 'completed' | 'rejected' | 'timed_out';
  steps: AgentOutput[];
  approvalInfo?: {
    approvedBy?: string;
    rejectedBy?: string;
    reason?: string;
    comments?: string;
  };
}

const activities = proxyActivities<Activities>({
  startToCloseTimeout: '60s',
  retry: {
    maximumAttempts: 3,
  },
});

/**
 * Main AI SDLC orchestration workflow.
 *
 * Sequence: Planner → Retriever → Architecture Review → Approval Gate → Implementor → Reviewer
 */
export async function aiSdlcWorkflow(input: SdlcWorkflowInput): Promise<SdlcWorkflowResult> {
  let currentStep = 'planning';
  let status = 'running';
  let approvalState = 'pending' as 'pending' | 'approved' | 'rejected';
  let approvalInfo: SdlcWorkflowResult['approvalInfo'] = undefined;

  const steps: AgentOutput[] = [];

  // Register signal handlers
  setHandler(approveSignal, (payload) => {
    approvalState = 'approved';
    approvalInfo = { approvedBy: payload.approvedBy, comments: payload.comments };
  });

  setHandler(rejectSignal, (payload) => {
    approvalState = 'rejected';
    approvalInfo = { rejectedBy: payload.rejectedBy, reason: payload.reason };
  });

  // Register status query handler
  setHandler(getStatusQuery, () => ({
    status,
    currentStep,
    approvalState,
  }));

  const taskTitle = input.taskTitle ?? 'Implement dark mode support across all MFEs';
  const taskDescription =
    input.taskDescription ??
    'Add dark mode toggle and theme support to all micro-frontends with shared design tokens.';

  // Step 1: Planner
  currentStep = 'planning';
  const plannerOutput = await activities.runPlannerActivity({
    taskId: input.taskId,
    taskTitle,
    taskDescription,
    previousOutputs: [],
  });
  steps.push(plannerOutput);

  // Step 2: Retriever
  currentStep = 'retrieval';
  const retrieverOutput = await activities.runRetrieverActivity({
    taskId: input.taskId,
    taskTitle,
    taskDescription,
    previousOutputs: steps,
  });
  steps.push(retrieverOutput);

  // Step 3: Architecture Review
  currentStep = 'architecture_review';
  const architectureOutput = await activities.runArchitectureActivity({
    taskId: input.taskId,
    taskTitle,
    taskDescription,
    previousOutputs: steps,
  });
  steps.push(architectureOutput);

  // Step 4: Approval Gate (HITL)
  currentStep = 'approval_gate';
  status = 'awaiting_approval';

  // Wait for approval/rejection signal or timeout after 24 hours
  const approved = await condition(() => approvalState !== 'pending', '24h');

  if (!approved) {
    status = 'timed_out';
    return { taskId: input.taskId, status: 'timed_out', steps, approvalInfo };
  }

  if (approvalState === 'rejected') {
    status = 'rejected';
    return { taskId: input.taskId, status: 'rejected', steps, approvalInfo };
  }

  status = 'running';

  // Step 5: Implementor
  currentStep = 'implementation';
  const implementorOutput = await activities.runImplementorActivity({
    taskId: input.taskId,
    taskTitle,
    taskDescription,
    previousOutputs: steps,
  });
  steps.push(implementorOutput);

  // Step 6: Reviewer
  currentStep = 'review';
  const reviewerOutput = await activities.runReviewerActivity({
    taskId: input.taskId,
    taskTitle,
    taskDescription,
    previousOutputs: steps,
  });
  steps.push(reviewerOutput);

  // Complete
  currentStep = 'finalization';
  status = 'completed';

  return { taskId: input.taskId, status: 'completed', steps, approvalInfo };
}
