// Orchestration owner: LangGraph
import type { McpClient } from '../mcp-client.interface.js';
import type { McpToolCall, McpToolResponse } from '@ai-sdlc/shared/types';

/**
 * GitHub MCP provider stub.
 * In production, connects to GitHub's MCP server for repo operations.
 */
export class GitHubProvider implements McpClient {
  readonly provider = 'github' as const;
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
      'github/search_repos',
      'github/get_file_contents',
      'github/list_pull_requests',
      'github/create_issue',
      'github/search_code',
    ];
  }

  async executeTool(call: McpToolCall): Promise<McpToolResponse> {
    const start = Date.now();

    // Stub: return mock data for golden demo
    const mockResults: Record<string, unknown> = {
      search_repos: [{ name: 'design-system', stars: 42 }],
      get_file_contents: { content: '// dark mode tokens placeholder' },
      list_pull_requests: [
        { number: 342, title: 'Add prefers-color-scheme media query', state: 'merged' },
      ],
      create_issue: { number: 502, title: call.arguments['title'] || 'New issue' },
      search_code: [{ path: 'src/themes/light.ts', matches: 3 }],
    };

    return {
      provider: 'github',
      tool: call.tool,
      success: true,
      result: mockResults[call.tool] ?? { message: 'Unknown tool' },
      durationMs: Date.now() - start,
    };
  }
}
