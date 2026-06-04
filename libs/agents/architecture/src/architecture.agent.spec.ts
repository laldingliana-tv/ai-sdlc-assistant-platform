// Orchestration owner: LangGraph
import type { ModelGateway, ModelResponse } from '@ai-sdlc/ai/model-gateway';
import type { AgentInput } from '@ai-sdlc/shared/types';
import { describe, it, expect, vi } from 'vitest';

import { ArchitectureAgent } from './architecture.agent.js';

function createMockGateway(response?: Partial<ModelResponse>): ModelGateway {
  return {
    invoke: vi.fn().mockResolvedValue({
      content: response?.content ?? 'ADR: CSS Custom Properties + ThemeProvider Context',
      toolCalls: response?.toolCalls,
      usage: response?.usage ?? { promptTokens: 200, completionTokens: 350, totalTokens: 550 },
      metadata: response?.metadata ?? {
        modelId: 'claude-4-sonnet',
        provider: 'anthropic',
        latencyMs: 200,
      },
    }),
    stream: vi.fn(),
    getModel: vi.fn(),
  } as unknown as ModelGateway;
}

describe('ArchitectureAgent', () => {
  const mockGateway = createMockGateway();
  const agent = new ArchitectureAgent(mockGateway);

  const mockInput: AgentInput = {
    taskId: 'task-001',
    agentName: 'architecture',
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
        {
          agentName: 'retriever',
          status: 'completed',
          result: { content: 'Context retrieved: ADR-007, RFC-012' },
          durationMs: 80,
        },
      ],
    },
  };

  it('should have correct name', () => {
    expect(agent.name).toBe('architecture');
  });

  it('should create a compiled graph', () => {
    const graph = agent.createGraph();
    expect(graph).toBeDefined();
    expect(graph.invoke).toBeInstanceOf(Function);
  });

  it('should return architecture content from gateway', async () => {
    const output = await agent.invoke(mockInput);

    expect(output.agentName).toBe('architecture');
    expect(output.status).toBe('completed');
    expect(output.result).toBeDefined();
    expect(output.result!.content).toContain('CSS Custom Properties');
    expect(output.durationMs).toBe(200);
    expect(output.tokenUsage).toEqual({
      promptTokens: 200,
      completionTokens: 350,
      totalTokens: 550,
    });
  });

  it('should call gateway with planning profile and JSON format', async () => {
    await agent.invoke(mockInput);

    expect(mockGateway.invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: { name: 'planning', overrides: { responseFormat: 'json' } },
        metadata: { agentName: 'architecture', taskId: 'task-001' },
      }),
    );
  });

  it('should parse structured output when gateway returns valid JSON', async () => {
    const structured = JSON.stringify({
      agent: 'architecture',
      decisions: [
        {
          id: 'ADR-001',
          title: 'Use CSS vars',
          status: 'accepted',
          context: 'Need theming',
          decision: 'CSS custom properties',
          consequences: ['Simple', 'Fast'],
        },
      ],
      constraints: ['Must support IE11'],
      verdict: 'approved',
      rationale: 'Solid approach',
    });
    const structuredGateway = createMockGateway({ content: structured });
    const structuredAgent = new ArchitectureAgent(structuredGateway);

    const output = await structuredAgent.invoke(mockInput);

    expect(output.result!.structuredOutput).toBeDefined();
    expect(output.result!.structuredOutput!.agent).toBe('architecture');
  });

  it('should still return content when JSON parsing fails', async () => {
    const output = await agent.invoke(mockInput);

    expect(output.result!.content).toContain('CSS Custom Properties');
    expect(output.result!.structuredOutput).toBeUndefined();
  });

  it('should return failed status on gateway error', async () => {
    const errorGateway = createMockGateway();
    (errorGateway.invoke as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Connection timeout'),
    );
    const failAgent = new ArchitectureAgent(errorGateway);

    const output = await failAgent.invoke(mockInput);

    expect(output.status).toBe('failed');
    expect(output.error).toEqual({
      code: 'GATEWAY_ERROR',
      message: 'Connection timeout',
      retryable: true,
    });
    expect(output.durationMs).toBeGreaterThanOrEqual(0);
  });
});
