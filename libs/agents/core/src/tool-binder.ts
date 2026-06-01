// Orchestration owner: LangGraph
import type { McpToolCall, McpToolResponse } from '@ai-sdlc/shared/types';

/**
 * Utility to bind MCP tools to an agent graph node.
 * Translates MCP tool calls into the format expected by the agent runtime.
 */
export interface BoundTool {
  name: string;
  provider: string;
  execute(args: Record<string, unknown>): Promise<McpToolResponse>;
}

/**
 * Bind a list of MCP tool definitions to callable tool objects.
 * In production, this connects to the MCP registry; for stubs, returns mock executors.
 */
export function bindTools(
  toolNames: string[],
  executor: (call: McpToolCall) => Promise<McpToolResponse>,
): BoundTool[] {
  return toolNames.map((name) => {
    const [provider, tool] = name.includes('/')
      ? (name.split('/') as [string, string])
      : ['unknown', name];

    return {
      name: tool,
      provider,
      execute: (args: Record<string, unknown>) =>
        executor({ provider: provider as McpToolCall['provider'], tool, arguments: args }),
    };
  });
}
