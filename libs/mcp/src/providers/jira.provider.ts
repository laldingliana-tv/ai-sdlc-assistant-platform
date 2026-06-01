// Orchestration owner: LangGraph
import type { McpClient } from '../mcp-client.interface.js';
import type { McpToolCall, McpToolResponse } from '@ai-sdlc/shared/types';

/**
 * Jira MCP provider stub.
 * In production, connects to Jira for issue tracking operations.
 */
export class JiraProvider implements McpClient {
  readonly provider = 'jira' as const;
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async listTools(): Promise<string[]> {
    return [
      'jira/search_issues',
      'jira/get_issue',
      'jira/create_issue',
      'jira/update_issue',
      'jira/get_sprint',
    ];
  }

  async executeTool(call: McpToolCall): Promise<McpToolResponse> {
    const start = Date.now();

    // Stub: return mock data for golden demo
    const mockResults: Record<string, unknown> = {
      search_issues: [
        { key: 'DARK-501', summary: 'Billing MFE uses inline styles', status: 'Open' },
        { key: 'DARK-489', summary: 'Theme toggle causes FOUC', status: 'In Progress' },
      ],
      get_issue: {
        key: 'DARK-501',
        summary: 'Billing MFE uses inline styles',
        description: 'Inline styles prevent dark mode token usage',
        priority: 'High',
      },
      create_issue: {
        key: 'DARK-510',
        summary: call.arguments['summary'] || 'New dark mode task',
      },
      update_issue: { key: call.arguments['key'] || 'DARK-501', updated: true },
      get_sprint: {
        id: 42,
        name: 'Sprint 42 - Dark Mode',
        issues: ['DARK-501', 'DARK-489', 'DARK-510'],
      },
    };

    return {
      provider: 'jira',
      tool: call.tool,
      success: true,
      result: mockResults[call.tool] ?? { message: 'Unknown tool' },
      durationMs: Date.now() - start,
    };
  }
}
