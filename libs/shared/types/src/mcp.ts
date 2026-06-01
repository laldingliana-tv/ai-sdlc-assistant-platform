/**
 * MCP (Model Context Protocol) tool response types.
 */

export type McpProviderName = 'github' | 'jira' | 'docs';

export interface McpToolCall {
  provider: McpProviderName;
  tool: string;
  arguments: Record<string, unknown>;
}

export interface McpToolResponse {
  provider: McpProviderName;
  tool: string;
  success: boolean;
  result?: unknown;
  error?: McpError;
  durationMs: number;
}

export interface McpError {
  code: string;
  message: string;
}

export interface McpProviderConfig {
  name: McpProviderName;
  endpoint?: string;
  transport: 'stdio' | 'http';
  enabled: boolean;
}
