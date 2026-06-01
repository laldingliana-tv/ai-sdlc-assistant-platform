// Orchestration owner: LangGraph
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';

/**
 * Compiled graph contract — a minimal interface matching LangGraph's CompiledStateGraph.
 * Using a structural type instead of the concrete generic to allow varied state shapes.
 */
export interface CompiledGraph {
  invoke(input: Record<string, unknown>): Promise<Record<string, unknown>>;
}

/**
 * Base agent interface that all SDLC agents must implement.
 * Agents own reasoning and tool use; workflow sequencing is Temporal's responsibility.
 */
export interface BaseAgent {
  readonly name: string;

  /** Build the LangGraph state graph for this agent. */
  createGraph(): CompiledGraph;

  /** Execute the agent with the given input. */
  invoke(input: AgentInput): Promise<AgentOutput>;
}
