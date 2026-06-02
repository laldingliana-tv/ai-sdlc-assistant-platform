// Orchestration owner: LangGraph
import { StateGraph, Annotation } from '@langchain/langgraph';

/**
 * Base state annotation shared by all agent graphs.
 */
export const BaseAgentState = Annotation.Root({
  input: Annotation<string>,
  output: Annotation<string>,
  messages: Annotation<unknown[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

export type BaseAgentStateType = typeof BaseAgentState.State;

/**
 * Factory for creating a base LangGraph StateGraph with common state shape.
 * Individual agents extend this with their own nodes and edges.
 */
export function createBaseGraph() {
  return new StateGraph(BaseAgentState);
}
