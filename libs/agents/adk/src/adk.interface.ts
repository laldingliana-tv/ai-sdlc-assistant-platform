// Orchestration owner: ADK (placeholder)
import type { AgentName, AgentInput, AgentOutput } from '@ai-sdlc/shared/types';

/**
 * Google ADK (Agent Development Kit) integration interface placeholder.
 * Defines how agents could be exposed as ADK-compatible agents for
 * interoperability with Google's agent ecosystem.
 */
export interface AdkAgentConfig {
  name: AgentName;
  displayName: string;
  description: string;
  version: string;
  capabilities: AdkCapability[];
}

export type AdkCapability =
  | 'text-generation'
  | 'code-generation'
  | 'analysis'
  | 'planning'
  | 'review';

export interface AdkAgentAdapter {
  /** Convert platform AgentInput to ADK-compatible format. */
  toAdkRequest(input: AgentInput): AdkRequest;

  /** Convert ADK response back to platform AgentOutput. */
  fromAdkResponse(response: AdkResponse): AgentOutput;
}

export interface AdkRequest {
  input: string;
  context?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

export interface AdkResponse {
  output: string;
  metadata?: Record<string, unknown>;
}
