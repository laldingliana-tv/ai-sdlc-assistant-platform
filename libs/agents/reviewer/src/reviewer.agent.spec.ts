// Orchestration owner: LangGraph
import type { ModelGateway, ModelResponse } from '@ai-sdlc/ai/model-gateway';
import type { AgentInput } from '@ai-sdlc/shared/types';
import { describe, it, expect, vi } from 'vitest';

import { ReviewerAgent } from './reviewer.agent.js';

function createMockGateway(response?: Partial<ModelResponse>): ModelGateway {
  return {
    invoke: vi.fn().mockResolvedValue({
      content: response?.content ?? 'Review: APPROVED (Score: 9/10). Well-structured plan.',
      toolCalls: response?.toolCalls,
      usage: response?.usage ?? { promptTokens: 250, completionTokens: 200, totalTokens: 450 },
      metadata: response?.metadata ?? { modelId: 'gpt-4.1', provider: 'openai', latencyMs: 180 },
    }),
    stream: vi.fn(),
    getModel: vi.fn(),
  } as unknown as ModelGateway;
}

describe('ReviewerAgent', () => {
  const mockGateway = createMockGateway();
  const agent = new ReviewerAgent(mockGateway);

  const mockInput: AgentInput = {
    taskId: 'task-001',
    agentName: 'reviewer',
    context: {
      taskTitle: 'Implement dark mode support across all MFEs',
      taskDescription:
        'Add dark mode theming to all micro-frontend applications with shared design tokens.',
      previousOutputs: [
        {
          agentName: 'planner',
          status: 'completed',
          result: { content: 'Plan: 4 phases, 12 steps' },
          durationMs: 100,
        },
      ],
    },
  };

  it('should have correct name', () => {
    expect(agent.name).toBe('reviewer');
  });

  it('should create a compiled graph', () => {
    const graph = agent.createGraph();
    expect(graph).toBeDefined();
    expect(graph.invoke).toBeInstanceOf(Function);
  });

  it('should return review content from gateway', async () => {
    const output = await agent.invoke(mockInput);

    expect(output.agentName).toBe('reviewer');
    expect(output.status).toBe('completed');
    expect(output.result).toBeDefined();
    expect(output.result!.content).toContain('APPROVED');
    expect(output.durationMs).toBe(180);
    expect(output.tokenUsage).toEqual({
      promptTokens: 250,
      completionTokens: 200,
      totalTokens: 450,
    });
  });

  it('should call gateway with review profile', async () => {
    await agent.invoke(mockInput);

    expect(mockGateway.invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: { name: 'review' },
        metadata: { agentName: 'reviewer', taskId: 'task-001' },
      }),
    );
  });

  it('should return failed status on gateway error', async () => {
    const errorGateway = createMockGateway();
    (errorGateway.invoke as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Invalid API key'),
    );
    const failAgent = new ReviewerAgent(errorGateway);

    const output = await failAgent.invoke(mockInput);

    expect(output.status).toBe('failed');
    expect(output.error).toEqual({
      code: 'GATEWAY_ERROR',
      message: 'Invalid API key',
      retryable: false,
    });
  });
});
