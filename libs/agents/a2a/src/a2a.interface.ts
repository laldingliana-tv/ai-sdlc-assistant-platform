// Orchestration owner: A2A (placeholder)
import type { AgentName } from '@ai-sdlc/shared/types';

/**
 * A2A (Agent-to-Agent) messaging interface.
 * Defines the protocol for direct agent-to-agent communication.
 * This is a placeholder for future implementation of the A2A protocol.
 */
export interface A2AMessage {
  id: string;
  from: AgentName;
  to: AgentName;
  type: A2AMessageType;
  payload: Record<string, unknown>;
  timestamp: string;
  correlationId?: string;
}

export type A2AMessageType = 'request' | 'response' | 'notification' | 'error';

export interface A2ACapability {
  agentName: AgentName;
  capabilities: string[];
  protocols: string[];
}

export interface A2ADiscoveryResponse {
  agents: A2ACapability[];
}
