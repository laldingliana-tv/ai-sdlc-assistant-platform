// Orchestration owner: LangGraph
import { describe, it, expect } from 'vitest';
import { PlannerAgent } from './planner.agent.js';
import type { AgentInput } from '@ai-sdlc/shared/types';

describe('PlannerAgent', () => {
  const agent = new PlannerAgent();

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

  it('should return a completed output with plan content', async () => {
    const output = await agent.invoke(mockInput);

    expect(output.agentName).toBe('planner');
    expect(output.status).toBe('completed');
    expect(output.result).toBeDefined();
    expect(output.result!.content).toContain('Dark Mode');
    expect(output.result!.structuredOutput).toHaveProperty('plan');
    expect(output.durationMs).toBeGreaterThanOrEqual(0);
    expect(output.tokenUsage).toBeDefined();
  });
});
