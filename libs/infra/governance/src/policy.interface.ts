/**
 * Policy interface for governance checks.
 * Policies are evaluated before and during workflow execution
 * to enforce organizational constraints.
 */
export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  requiresApproval?: boolean;
}

export interface PolicyContext {
  taskId: string;
  agentName?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface Policy {
  /** Unique policy name */
  readonly name: string;

  /** Evaluate whether an action is allowed */
  evaluate(context: PolicyContext): PolicyResult | Promise<PolicyResult>;

  /** Enforce a policy (throw if violated) */
  enforce(context: PolicyContext): void | Promise<void>;
}
