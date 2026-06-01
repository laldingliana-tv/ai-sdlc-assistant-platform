// Orchestration owner: LangGraph
import { describe, it, expect } from 'vitest';
import { RetrieverAgent } from './retriever.agent.js';
import type { AgentInput } from '@ai-sdlc/shared/types';

describe('RetrieverAgent', () => {
  const agent = new RetrieverAgent();

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

  it('should return retrieved context with sources', async () => {
    const output = await agent.invoke(mockInput);

    expect(output.agentName).toBe('retriever');
    expect(output.status).toBe('completed');
    expect(output.result).toBeDefined();
    expect(output.result!.content).toContain('Dark Mode');
    expect(output.result!.structuredOutput).toHaveProperty('sources');
    expect(output.durationMs).toBeGreaterThanOrEqual(0);
  });
});
