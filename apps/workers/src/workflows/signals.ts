// Orchestration owner: Temporal
import { defineSignal, defineQuery } from '@temporalio/workflow';

/**
 * Signal to approve the workflow at the approval gate.
 * Payload contains the approver identifier and optional comments.
 */
export const approveSignal = defineSignal<[{ approvedBy: string; comments?: string }]>('approve');

/**
 * Signal to reject the workflow at the approval gate.
 * Payload contains the rejector identifier and rejection reason.
 */
export const rejectSignal = defineSignal<[{ rejectedBy: string; reason: string }]>('reject');

/**
 * Query to get the current workflow status and step.
 */
export const getStatusQuery = defineQuery<{
  status: string;
  currentStep: string;
  approvalState?: 'pending' | 'approved' | 'rejected';
}>('getStatus');
