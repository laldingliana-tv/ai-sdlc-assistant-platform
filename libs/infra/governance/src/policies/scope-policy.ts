import type { Policy, PolicyContext, PolicyResult } from '../policy.interface.js';

/**
 * Task scope boundary policy.
 * Prevents agents from performing actions outside the defined scope of the task.
 * This is a safety mechanism to contain agent behavior.
 */
export class ScopePolicy implements Policy {
  readonly name = 'scope-boundary';

  private readonly forbiddenPatterns = [
    /rm\s+-rf\s+\//,
    /DROP\s+DATABASE/i,
    /DELETE\s+FROM\s+(?!.*WHERE)/i,
  ];

  evaluate(context: PolicyContext): PolicyResult {
    const action = context.action ?? '';

    for (const pattern of this.forbiddenPatterns) {
      if (pattern.test(action)) {
        return {
          allowed: false,
          reason: `Action matches forbidden pattern: ${pattern.source}`,
        };
      }
    }

    return { allowed: true };
  }

  enforce(context: PolicyContext): void {
    const result = this.evaluate(context);
    if (!result.allowed) {
      throw new Error(`Policy violation [${this.name}]: ${result.reason}`);
    }
  }
}
