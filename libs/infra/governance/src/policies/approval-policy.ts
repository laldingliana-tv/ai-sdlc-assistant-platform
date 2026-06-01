import type { Policy, PolicyContext, PolicyResult } from '../policy.interface.js';

/**
 * Approval requirement policy.
 * Determines whether a task requires human approval before proceeding.
 * Ties into the Temporal HITL (Human-in-the-Loop) approval gate.
 */
export class ApprovalPolicy implements Policy {
  readonly name = 'approval-required';

  private readonly highRiskActions = new Set([
    'deploy',
    'delete',
    'modify-infrastructure',
    'change-permissions',
  ]);

  evaluate(context: PolicyContext): PolicyResult {
    const action = context.action ?? '';
    const isHighRisk = this.highRiskActions.has(action);

    if (isHighRisk) {
      return {
        allowed: true,
        requiresApproval: true,
        reason: `Action "${action}" requires human approval before execution`,
      };
    }

    return { allowed: true, requiresApproval: false };
  }

  enforce(context: PolicyContext): void {
    const result = this.evaluate(context);
    if (!result.allowed) {
      throw new Error(`Policy violation [${this.name}]: ${result.reason}`);
    }
  }
}
