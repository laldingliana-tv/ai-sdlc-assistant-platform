// Orchestration owner: LangGraph

/**
 * Transport abstraction for MCP communication.
 * Supports stdio (local process) and HTTP (remote server) transports.
 */
export type McpTransportType = 'stdio' | 'http';

export interface McpTransport {
  readonly type: McpTransportType;

  /** Send a message to the MCP server. */
  send(message: McpMessage): Promise<McpMessage>;

  /** Open the transport connection. */
  open(): Promise<void>;

  /** Close the transport connection. */
  close(): Promise<void>;
}

export interface McpMessage {
  id: string;
  method: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string };
}

/**
 * Stub stdio transport — placeholder for local MCP server communication.
 */
export class StdioTransport implements McpTransport {
  readonly type: McpTransportType = 'stdio';
  private connected = false;

  async open(): Promise<void> {
    this.connected = true;
  }

  async close(): Promise<void> {
    this.connected = false;
  }

  async send(message: McpMessage): Promise<McpMessage> {
    if (!this.connected) {
      throw new Error('Transport not connected');
    }
    // Stub: echo back with result
    return { ...message, result: { status: 'ok' } };
  }
}

/**
 * Stub HTTP transport — placeholder for remote MCP server communication.
 */
export class HttpTransport implements McpTransport {
  readonly type: McpTransportType = 'http';
  private connected = false;

  constructor(private readonly endpoint: string) {}

  async open(): Promise<void> {
    this.connected = true;
  }

  async close(): Promise<void> {
    this.connected = false;
  }

  async send(message: McpMessage): Promise<McpMessage> {
    if (!this.connected) {
      throw new Error('Transport not connected');
    }
    // Stub: return mock response
    return { ...message, result: { status: 'ok', endpoint: this.endpoint } };
  }
}
