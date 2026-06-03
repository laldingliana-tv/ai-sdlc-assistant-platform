// Orchestration owner: LangGraph
import type { ModelGateway, ModelResponse } from '@ai-sdlc/ai/model-gateway';
import type { AgentInput } from '@ai-sdlc/shared/types';
import { describe, it, expect, vi } from 'vitest';

import { RetrieverAgent } from './retriever.agent.js';

function createMockGateway(response?: Partial<ModelResponse>): ModelGateway {
  return {
    invoke: vi.fn().mockResolvedValue({
      content: response?.content ?? 'Retrieved: ADR-007, RFC-012, design-tokens/colors.ts',
      toolCalls: response?.toolCalls,
      usage: response?.usage ?? { promptTokens: 80, completionTokens: 150, totalTokens: 230 },
      metadata: response?.metadata ?? {
        modelId: 'gemini-2.5-flash',
        provider: 'google',
        latencyMs: 90,
      },
    }),
    stream: vi.fn(),
    getModel: vi.fn(),
  } as unknown as ModelGateway;
}

describe('RetrieverAgent', () => {
  const mockGateway = createMockGateway();
  const agent = new RetrieverAgent(mockGateway);

  const mockInput: AgentInput = {
    taskId: 'task-001',
    agentName: 'retriever',
    context: {
      taskTitle: 'Implement dark mode support across all MFEs',
      taskDescription:
        'Add dark mode theming to all micro-frontend applications with shared design tokens.',
      previousOutputs: [],
    },
  };

  it('should have correct name', () => {
    expect(agent.name).toBe('retriever');
  });

  it('should create a compiled graph', () => {
    const graph = agent.createGraph();
    expect(graph).toBeDefined();
    expect(graph.invoke).toBeInstanceOf(Function);
  });

  it('should return retrieved context from gateway', async () => {
    const output = await agent.invoke(mockInput);

    expect(output.agentName).toBe('retriever');
    expect(output.status).toBe('completed');
    expect(output.result).toBeDefined();
    expect(output.result!.content).toContain('ADR-007');
    expect(output.durationMs).toBe(90);
    expect(output.tokenUsage).toEqual({
      promptTokens: 80,
      completionTokens: 150,
      totalTokens: 230,
    });
  });

  it('should call gateway with retrieval profile', async () => {
    await agent.invoke(mockInput);

    expect(mockGateway.invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: { name: 'retrieval' },
        metadata: { agentName: 'retriever', taskId: 'task-001' },
      }),
    );
  });

  it('should return failed status on gateway error', async () => {
    const errorGateway = createMockGateway();
    (errorGateway.invoke as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Rate limit exceeded'),
    );
    const failAgent = new RetrieverAgent(errorGateway);

    const output = await failAgent.invoke(mockInput);

    expect(output.status).toBe('failed');
    expect(output.error).toEqual({
      code: 'GATEWAY_ERROR',
      message: 'Rate limit exceeded',
      retryable: false,
    });
  });
});
