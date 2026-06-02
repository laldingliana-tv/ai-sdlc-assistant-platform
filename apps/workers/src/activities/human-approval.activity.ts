// Orchestration owner: Temporal
import type { AgentOutput } from '@ai-sdlc/shared/types';

/**
 * Temporal activity placeholder for human approval notifications.
 * In production, this would send notifications (email, Slack, etc.)
 * to the designated approver. The actual approval is handled via
 * Temporal signals (approveSignal/rejectSignal).
 */
export async function notifyApprovalRequired(_input: {
  taskId: string;
  stepOutputs: AgentOutput[];
}): Promise<{ notified: boolean; requestedAt: string }> {
  // In production: send notification to approver via email/Slack/webhook
  // For now, just acknowledge the request
  return {
    notified: true,
    requestedAt: new Date().toISOString(),
  };
}
