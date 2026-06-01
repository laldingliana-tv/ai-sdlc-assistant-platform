// Orchestration owner: LangGraph
import { describe, it, expect } from 'vitest';
import { ArchitectureAgent } from './architecture.agent.js';
import type { AgentInput } from '@ai-sdlc/shared/types';

describe('ArchitectureAgent', () => {
  const agent = new ArchitectureAgent();

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

  it('should return architecture decisions', async () => {
    const output = await agent.invoke(mockInput);

    expect(output.agentName).toBe('architecture');
    expect(output.status).toBe('completed');
    expect(output.result).toBeDefined();
    expect(output.result!.content).toContain('Architecture Decision');
    expect(output.result!.structuredOutput).toHaveProperty('decisions');
    expect(output.result!.structuredOutput).toHaveProperty('constraints');
  });
});
