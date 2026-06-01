// Orchestration owner: LangGraph
import { describe, it, expect } from 'vitest';
import { ImplementorAgent } from './implementor.agent.js';
import type { AgentInput } from '@ai-sdlc/shared/types';

describe('ImplementorAgent', () => {
  const agent = new ImplementorAgent();

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

  it('should return implementation proposal with artifacts', async () => {
    const output = await agent.invoke(mockInput);

    expect(output.agentName).toBe('implementor');
    expect(output.status).toBe('completed');
    expect(output.result).toBeDefined();
    expect(output.result!.content).toContain('Implementation Proposal');
    expect(output.result!.structuredOutput).toHaveProperty('filesToModify');
    expect(output.result!.structuredOutput).toHaveProperty('testStrategy');
    expect(output.result!.artifacts).toHaveLength(1);
    expect(output.result!.artifacts![0].name).toBe('dark-tokens');
  });
});
