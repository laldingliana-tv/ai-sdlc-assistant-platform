// Orchestration owner: LangGraph
import type {
  McpProviderName,
  McpProviderConfig,
  McpToolCall,
  McpToolResponse,
} from '@ai-sdlc/shared/types';
import type { McpClient } from './mcp-client.interface.js';

/**
 * Registry for MCP provider clients.
 * Manages provider lifecycle and routes tool calls to the correct provider.
 */
export class McpRegistry {
  private providers = new Map<McpProviderName, McpClient>();

  /** Register a provider client. */
  register(client: McpClient): void {
    this.providers.set(client.provider, client);
  }

  /** Unregister a provider client. */
  unregister(provider: McpProviderName): void {
    this.providers.delete(provider);
  }

  /** Get a registered provider client. */
  get(provider: McpProviderName): McpClient | undefined {
    return this.providers.get(provider);
  }

  /** Get all registered provider names. */
  listProviders(): McpProviderName[] {
    return [...this.providers.keys()];
  }

  /** Connect all registered providers. */
  async connectAll(): Promise<void> {
    const connections = [...this.providers.values()].map((p) => p.connect());
    await Promise.all(connections);
  }

  /** Disconnect all registered providers. */
  async disconnectAll(): Promise<void> {
    const disconnections = [...this.providers.values()].map((p) => p.disconnect());
    await Promise.all(disconnections);
  }

  /** Route a tool call to the appropriate provider. */
  async executeTool(call: McpToolCall): Promise<McpToolResponse> {
    const client = this.providers.get(call.provider);
    if (!client) {
      return {
        provider: call.provider,
        tool: call.tool,
        success: false,
        error: { code: 'PROVIDER_NOT_FOUND', message: `Provider ${call.provider} not registered` },
        durationMs: 0,
      };
    }
    return client.executeTool(call);
  }
}
