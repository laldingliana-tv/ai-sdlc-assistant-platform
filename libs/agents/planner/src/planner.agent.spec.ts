// Orchestration owner: LangGraph
import type { ModelGateway, ModelResponse } from '@ai-sdlc/ai/model-gateway';
import type { AgentInput } from '@ai-sdlc/shared/types';
import { describe, it, expect, vi } from 'vitest';

import { PlannerAgent } from './planner.agent.js';

function createMockGateway(response?: Partial<ModelResponse>): ModelGateway {
  return {
    invoke: vi.fn().mockResolvedValue({
      content: response?.content ?? 'Plan: Phase 1, Phase 2, Phase 3',
      toolCalls: response?.toolCalls,
      usage: response?.usage ?? { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      metadata: response?.metadata ?? {
        modelId: 'claude-4-sonnet',
        provider: 'anthropic',
        latencyMs: 150,
      },
    }),
    stream: vi.fn(),
    getModel: vi.fn(),
  } as unknown as ModelGateway;
}

describe('PlannerAgent', () => {
  const mockGateway = createMockGateway();
  const agent = new PlannerAgent(mockGateway);

  const mockInput: AgentInput = {
    taskId: 'task-001',
    agentName: 'planner',
    context: {
      taskTitle: 'Implement dark mode support across all MFEs',
      taskDescription:
        'Add dark mode theming to all micro-frontend applications with shared design tokens.',
      previousOutputs: [],
    },
  };

  it('should have correct name', () => {
    expect(agent.name).toBe('planner');
  });

  it('should create a compiled graph', () => {
    const graph = agent.createGraph();
    expect(graph).toBeDefined();
    expect(graph.invoke).toBeInstanceOf(Function);
  });

  it('should return a completed output with content from gateway', async () => {
    const output = await agent.invoke(mockInput);

    expect(output.agentName).toBe('planner');
    expect(output.status).toBe('completed');
    expect(output.result).toBeDefined();
    expect(output.result!.content).toBe('Plan: Phase 1, Phase 2, Phase 3');
    expect(output.durationMs).toBe(150);
    expect(output.tokenUsage).toEqual({
      promptTokens: 100,
      completionTokens: 200,
      totalTokens: 300,
    });
  });

  it('should call gateway with planning profile and JSON format', async () => {
    await agent.invoke(mockInput);

    expect(mockGateway.invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: { name: 'planning', overrides: { responseFormat: 'json' } },
        metadata: { agentName: 'planner', taskId: 'task-001' },
      }),
    );
  });

  it('should parse structured output when gateway returns valid JSON', async () => {
    const structured = JSON.stringify({
      agent: 'planner',
      phases: [
        {
          id: 1,
          title: 'Setup',
          description: 'Initial setup',
          steps: [{ id: 1, action: 'Create config', acceptanceCriteria: 'Config exists' }],
        },
      ],
      summary: 'A structured plan',
      estimatedComplexity: 'medium',
    });
    const structuredGateway = createMockGateway({ content: structured });
    const structuredAgent = new PlannerAgent(structuredGateway);

    const output = await structuredAgent.invoke(mockInput);

    expect(output.result!.structuredOutput).toBeDefined();
    expect(output.result!.structuredOutput!.agent).toBe('planner');
    const planOutput = output.result!.structuredOutput as { phases: { title: string }[] };
    expect(planOutput.phases[0].title).toBe('Setup');
  });

  it('should still return content when JSON parsing fails', async () => {
    const output = await agent.invoke(mockInput);

    expect(output.result!.content).toBe('Plan: Phase 1, Phase 2, Phase 3');
    expect(output.result!.structuredOutput).toBeUndefined();
  });

  it('should return failed status on gateway error', async () => {
    const errorGateway = createMockGateway();
    (errorGateway.invoke as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('API key missing'),
    );
    const failAgent = new PlannerAgent(errorGateway);

    const output = await failAgent.invoke(mockInput);

    expect(output.status).toBe('failed');
    expect(output.error).toEqual({
      code: 'GATEWAY_ERROR',
      message: 'API key missing',
      retryable: false,
    });
    expect(output.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should mark rate limit errors as retryable', async () => {
    const errorGateway = createMockGateway();
    (errorGateway.invoke as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Rate limit exceeded (429)'),
    );
    const failAgent = new PlannerAgent(errorGateway);

    const output = await failAgent.invoke(mockInput);

    expect(output.status).toBe('failed');
    expect(output.error!.retryable).toBe(true);
  });
});
