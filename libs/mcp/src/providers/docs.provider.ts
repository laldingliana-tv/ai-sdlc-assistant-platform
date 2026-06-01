// Orchestration owner: LangGraph
import type { McpClient } from '../mcp-client.interface.js';
import type { McpToolCall, McpToolResponse } from '@ai-sdlc/shared/types';

/**
 * Docs MCP provider stub.
 * In production, connects to documentation search and retrieval.
 */
export class DocsProvider implements McpClient {
  readonly provider = 'docs' as const;
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
    return ['docs/search', 'docs/get_document', 'docs/list_adrs', 'docs/get_adr'];
  }

  async executeTool(call: McpToolCall): Promise<McpToolResponse> {
    const start = Date.now();

    // Stub: return mock data for golden demo
    const mockResults: Record<string, unknown> = {
      search: [
        { title: 'ADR-007: Theme Architecture', relevance: 0.95 },
        { title: 'RFC-012: Cross-MFE Communication', relevance: 0.82 },
      ],
      get_document: {
        title: 'Dark Mode Design Spec',
        content: 'CSS custom properties approach with design tokens...',
      },
      list_adrs: [
        { id: 'ADR-007', title: 'Theme Architecture', status: 'approved' },
        { id: 'ADR-008', title: 'MFE Communication', status: 'approved' },
      ],
      get_adr: {
        id: 'ADR-007',
        title: 'Theme Architecture',
        decision: 'Use CSS custom properties for theming',
      },
    };

    return {
      provider: 'docs',
      tool: call.tool,
      success: true,
      result: mockResults[call.tool] ?? { message: 'Unknown tool' },
      durationMs: Date.now() - start,
    };
  }
}
