// Orchestration owner: LangGraph
import type { ModelGateway, ModelResponse } from '@ai-sdlc/ai/model-gateway';
import type { AgentInput } from '@ai-sdlc/shared/types';
import { describe, it, expect, vi } from 'vitest';

import { ImplementorAgent } from './implementor.agent.js';

function createMockGateway(response?: Partial<ModelResponse>): ModelGateway {
  return {
    invoke: vi.fn().mockResolvedValue({
      content: response?.content ?? '## Implementation: ThemeProvider.tsx + dark.json tokens',
      toolCalls: response?.toolCalls,
      usage: response?.usage ?? { promptTokens: 300, completionTokens: 500, totalTokens: 800 },
      metadata: response?.metadata ?? {
        modelId: 'claude-4-sonnet',
        provider: 'anthropic',
        latencyMs: 250,
      },
    }),
    stream: vi.fn(),
    getModel: vi.fn(),
  } as unknown as ModelGateway;
}

describe('ImplementorAgent', () => {
  const mockGateway = createMockGateway();
  const agent = new ImplementorAgent(mockGateway);

  const mockInput: AgentInput = {
    taskId: 'task-001',
    agentName: 'implementor',
    context: {
      taskTitle: 'Implement dark mode support across all MFEs',
      taskDescription:
        'Add dark mode theming to all micro-frontend applications with shared design tokens.',
      previousOutputs: [
        {
          agentName: 'planner',
          status: 'completed',
          result: { content: 'Plan: 4 phases' },
          durationMs: 100,
        },
        {
          agentName: 'architecture',
          status: 'completed',
          result: { content: 'CSS custom properties approach' },
          durationMs: 120,
        },
        {
          agentName: 'reviewer',
          status: 'completed',
          result: { content: 'Approved with suggestions' },
          durationMs: 90,
        },
      ],
    },
  };

  it('should have correct name', () => {
    expect(agent.name).toBe('implementor');
  });

  it('should create a compiled graph', () => {
    const graph = agent.createGraph();
    expect(graph).toBeDefined();
    expect(graph.invoke).toBeInstanceOf(Function);
  });

  it('should return implementation content from gateway', async () => {
    const output = await agent.invoke(mockInput);

    expect(output.agentName).toBe('implementor');
    expect(output.status).toBe('completed');
    expect(output.result).toBeDefined();
    expect(output.result!.content).toContain('ThemeProvider');
    expect(output.durationMs).toBe(250);
    expect(output.tokenUsage).toEqual({
      promptTokens: 300,
      completionTokens: 500,
      totalTokens: 800,
    });
  });

  it('should call gateway with coding profile and JSON format', async () => {
    await agent.invoke(mockInput);

    expect(mockGateway.invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: { name: 'coding', overrides: { responseFormat: 'json' } },
        metadata: { agentName: 'implementor', taskId: 'task-001' },
      }),
    );
  });

  it('should parse structured output when gateway returns valid JSON', async () => {
    const structured = JSON.stringify({
      agent: 'implementor',
      changes: [
        {
          filePath: 'src/theme.ts',
          action: 'create',
          language: 'typescript',
          description: 'Theme provider',
        },
      ],
      testStrategy: {
        approach: 'Unit tests',
        testFiles: [{ filePath: 'src/theme.spec.ts', testCases: ['should toggle dark mode'] }],
      },
      summary: 'Created theme provider',
    });
    const structuredGateway = createMockGateway({ content: structured });
    const structuredAgent = new ImplementorAgent(structuredGateway);

    const output = await structuredAgent.invoke(mockInput);

    expect(output.result!.structuredOutput).toBeDefined();
    expect(output.result!.structuredOutput!.agent).toBe('implementor');
  });

  it('should return failed status on gateway error', async () => {
    const errorGateway = createMockGateway();
    (errorGateway.invoke as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Model overloaded'),
    );
    const failAgent = new ImplementorAgent(errorGateway);

    const output = await failAgent.invoke(mockInput);

    expect(output.status).toBe('failed');
    expect(output.error).toEqual({
      code: 'GATEWAY_ERROR',
      message: 'Model overloaded',
      retryable: true,
    });
    expect(output.durationMs).toBeGreaterThanOrEqual(0);
  });
});
