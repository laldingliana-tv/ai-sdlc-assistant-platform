/**
 * Workflow state and execution types.
 */

import type { AgentOutput } from './agent.js';

export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timed_out';

export type WorkflowStep =
  | 'planning'
  | 'retrieval'
  | 'architecture_review'
  | 'approval_gate'
  | 'implementation'
  | 'review'
  | 'finalization';

export interface WorkflowExecution {
  id: string;
  taskId: string;
  temporalWorkflowId: string;
  temporalRunId: string;
  status: WorkflowStatus;
  currentStep: WorkflowStep;
  steps: WorkflowStepResult[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface WorkflowStepResult {
  step: WorkflowStep;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  agentOutput?: AgentOutput;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowTriggerRequest {
  taskId: string;
}

export interface WorkflowTriggerResponse {
  workflowExecutionId: string;
  temporalWorkflowId: string;
}

export interface ApprovalRequest {
  workflowExecutionId: string;
  stepOutputs: AgentOutput[];
  requestedAt: string;
  expiresAt?: string;
}

export interface ApprovalDecision {
  workflowExecutionId: string;
  approved: boolean;
  reason?: string;
  decidedBy: string;
  decidedAt: string;
}
