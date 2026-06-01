// Orchestration owner: LangGraph
import type { McpProviderName, McpToolCall, McpToolResponse } from '@ai-sdlc/shared/types';

/**
 * Interface for MCP (Model Context Protocol) client implementations.
 * Each provider (GitHub, Jira, Docs) implements this interface.
 */
export interface McpClient {
  readonly provider: McpProviderName;

  /** Initialize the client connection. */
  connect(): Promise<void>;

  /** Disconnect and clean up resources. */
  disconnect(): Promise<void>;

  /** List available tools for this provider. */
  listTools(): Promise<string[]>;

  /** Execute a tool call against this provider. */
  executeTool(call: McpToolCall): Promise<McpToolResponse>;

  /** Check if the provider is healthy and connected. */
  isConnected(): boolean;
}
