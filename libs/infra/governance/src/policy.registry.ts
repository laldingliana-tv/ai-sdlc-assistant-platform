import type { Policy } from './policy.interface.js';

/**
 * Registry for governance policies.
 * Policies are registered by name and can be resolved at runtime.
 */
export class PolicyRegistry {
  private readonly policies = new Map<string, Policy>();

  register(policy: Policy): void {
    this.policies.set(policy.name, policy);
  }

  resolve(name: string): Policy | undefined {
    return this.policies.get(name);
  }

  resolveAll(): Policy[] {
    return [...this.policies.values()];
  }

  has(name: string): boolean {
    return this.policies.has(name);
  }

  remove(name: string): boolean {
    return this.policies.delete(name);
  }
}
