// Orchestration owner: LangGraph
import { Annotation } from '@langchain/langgraph';

/**
 * Architecture agent state definition.
 * Extends base state with architecture decision fields.
 */
export const ArchitectureState = Annotation.Root({
  input: Annotation<string>,
  output: Annotation<string>,
  messages: Annotation<unknown[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  decisions: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  diagrams: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  constraints: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
});

export type ArchitectureStateType = typeof ArchitectureState.State;
