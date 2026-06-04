// Orchestration owner: LangGraph
import type { BaseAgent } from '@ai-sdlc/agents/core';
import { parseStructuredOutput, isRetryableError } from '@ai-sdlc/agents/core';
import type { ModelGateway } from '@ai-sdlc/ai/model-gateway';
import { ArchitectureOutputSchema } from '@ai-sdlc/shared/schemas';
import type { AgentInput, AgentOutput, ArchitectureOutput } from '@ai-sdlc/shared/types';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StateGraph } from '@langchain/langgraph';

import { ArchitectureState } from './architecture.state.js';

const SYSTEM_PROMPT = `You are an architecture review agent. Evaluate the proposed work against architectural constraints, produce ADRs, and provide a verdict.

You MUST respond with valid JSON matching this exact schema:
{
  "agent": "architecture",
  "decisions": [
    {
      "id": "ADR-001",
      "title": "Decision title",
      "status": "proposed" | "accepted" | "rejected",
      "context": "Why this decision is needed",
      "decision": "What was decided",
      "consequences": ["Consequence 1", "Consequence 2"]
    }
  ],
  "constraints": ["Constraint 1 that must be respected", "Constraint 2"],
  "diagrams": [
    {
      "title": "Diagram title",
      "type": "mermaid" | "plantuml" | "ascii",
      "content": "diagram source code"
    }
  ],
  "verdict": "approved" | "needs_changes" | "rejected",
  "rationale": "Explanation of the verdict with key reasoning"
}

Rules:
- Each decision follows ADR format (context, decision, consequences)
- Constraints are things the implementation MUST respect
- Include at least one mermaid diagram showing component relationships
- Verdict: "approved" if safe to proceed, "needs_changes" if minor adjustments needed, "rejected" if fundamentally flawed
- Be specific about consequences — both positive and negative`;

/**
 * ArchitectureAgent — produces architecture decisions and diagrams.
 * Uses the Model Gateway for LLM calls via the 'planning' profile.
 */
export class ArchitectureAgent implements BaseAgent {
  readonly name = 'architecture';

  constructor(private readonly gateway: ModelGateway) {}

  createGraph() {
    const graph = new StateGraph(ArchitectureState)
      .addNode('architect', async (state) => {
        return {
          output: state.input,
          decisions: [],
          diagrams: [],
          constraints: [],
          messages: [],
        };
      })
      .addEdge('__start__', 'architect')
      .addEdge('architect', '__end__');

    return graph.compile();
  }

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const startTime = performance.now();
    try {
      const taskDescription = input.context.taskDescription ?? '';
      const taskTitle = input.context.taskTitle ?? '';
      const previousOutputs =
        input.context.previousOutputs.length > 0
          ? JSON.stringify(input.context.previousOutputs).slice(0, 10_000)
          : '';

      const messages = [
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(
          `Task: ${taskTitle}\n\nDescription: ${taskDescription}${previousOutputs ? `\n\nPrevious outputs:\n${previousOutputs}` : ''}`,
        ),
      ];

      const response = await this.gateway.invoke({
        profile: { name: 'planning', overrides: { responseFormat: 'json' } },
        messages,
        metadata: { agentName: this.name, taskId: input.taskId },
      });

      const structured = parseStructuredOutput<ArchitectureOutput>(
        response.content,
        ArchitectureOutputSchema,
        {
          onParseFailure: ({ error }) => {
            // eslint-disable-next-line no-console
            console.warn(
              `[${this.name}] Structured output parse failed (task=${input.taskId}): ${error}`,
            );
          },
        },
      );

      return {
        agentName: this.name,
        status: 'completed',
        result: {
          content: response.content,
          structuredOutput: structured ?? undefined,
        },
        durationMs: response.metadata.latencyMs,
        tokenUsage: response.usage,
      };
    } catch (error) {
      return {
        agentName: this.name,
        status: 'failed',
        result: undefined,
        durationMs: Math.round(performance.now() - startTime),
        error: {
          code: 'GATEWAY_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: isRetryableError(error),
        },
      };
    }
  }
}
