import { z } from 'zod';
import { AgentOutputSchema } from './agent.schema.js';

export const WorkflowStatus = z.enum([
  'pending',
  'running',
  'awaiting_approval',
  'completed',
  'failed',
  'cancelled',
  'timed_out',
]);

export const WorkflowStep = z.enum([
  'planning',
  'retrieval',
  'architecture_review',
  'approval_gate',
  'implementation',
  'review',
  'finalization',
]);

export const WorkflowStepResultSchema = z.object({
  step: WorkflowStep,
  status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped']),
  agentOutput: AgentOutputSchema.optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

export const WorkflowExecutionSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  temporalWorkflowId: z.string(),
  temporalRunId: z.string(),
  status: WorkflowStatus,
  currentStep: WorkflowStep,
  steps: z.array(WorkflowStepResultSchema),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  error: z.string().optional(),
});

export const WorkflowTriggerRequestSchema = z.object({
  taskId: z.string().uuid(),
});

export const ApprovalDecisionSchema = z.object({
  workflowExecutionId: z.string().uuid(),
  approved: z.boolean(),
  reason: z.string().max(1000).optional(),
  decidedBy: z.string(),
  decidedAt: z.string().datetime(),
});

export const ApproveWorkflowSchema = z.object({
  approvedBy: z.string().min(1),
  comments: z.string().max(1000).optional(),
});

export const RejectWorkflowSchema = z.object({
  rejectedBy: z.string().min(1),
  reason: z.string().min(1).max(1000),
});

export type WorkflowTriggerRequestInput = z.input<typeof WorkflowTriggerRequestSchema>;
export type ApprovalDecisionInput = z.input<typeof ApprovalDecisionSchema>;
export type ApproveWorkflowInput = z.input<typeof ApproveWorkflowSchema>;
export type RejectWorkflowInput = z.input<typeof RejectWorkflowSchema>;
