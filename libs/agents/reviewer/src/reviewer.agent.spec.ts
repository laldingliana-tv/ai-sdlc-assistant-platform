// Orchestration owner: LangGraph
import { describe, it, expect } from 'vitest';
import { ReviewerAgent } from './reviewer.agent.js';
import type { AgentInput } from '@ai-sdlc/shared/types';

describe('ReviewerAgent', () => {
  const agent = new ReviewerAgent();

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

  it('should return review with approval status', async () => {
    const output = await agent.invoke(mockInput);

    expect(output.agentName).toBe('reviewer');
    expect(output.status).toBe('completed');
    expect(output.result).toBeDefined();
    expect(output.result!.content).toContain('APPROVED');
    expect(output.result!.structuredOutput).toHaveProperty('approved', true);
    expect(output.result!.structuredOutput).toHaveProperty('score', 8.5);
    expect(output.result!.structuredOutput).toHaveProperty('findings');
  });
});
