// Orchestration owner: A2A (placeholder)
import type { AgentName } from '@ai-sdlc/shared/types';
import type { A2AMessage } from './a2a.interface.js';

/**
 * A2A message router placeholder.
 * Routes messages between agents using the A2A protocol.
 * In production, this will handle message serialization, delivery, and acknowledgment.
 */
export class A2ARouter {
  private handlers = new Map<AgentName, (message: A2AMessage) => Promise<A2AMessage>>();

  /** Register a message handler for an agent. */
  registerHandler(agent: AgentName, handler: (message: A2AMessage) => Promise<A2AMessage>): void {
    this.handlers.set(agent, handler);
  }

  /** Unregister a handler. */
  unregisterHandler(agent: AgentName): void {
    this.handlers.delete(agent);
  }

  /** Route a message to the target agent. */
  async route(message: A2AMessage): Promise<A2AMessage> {
    const handler = this.handlers.get(message.to);
    if (!handler) {
      return {
        id: `a2a-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        from: message.to,
        to: message.from,
        type: 'error',
        payload: { error: `No handler registered for agent: ${message.to}` },
        timestamp: new Date().toISOString(),
        correlationId: message.id,
      };
    }
    return handler(message);
  }

  /** List agents with registered handlers. */
  listRegisteredAgents(): AgentName[] {
    return [...this.handlers.keys()];
  }
}
