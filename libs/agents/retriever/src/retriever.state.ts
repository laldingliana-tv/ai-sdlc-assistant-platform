// Orchestration owner: LangGraph
import { Annotation } from '@langchain/langgraph';

/**
 * Retriever agent state definition.
 * Extends base state with context retrieval fields.
 */
export const RetrieverState = Annotation.Root({
  input: Annotation<string>,
  output: Annotation<string>,
  messages: Annotation<unknown[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  sources: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  relevantContext: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
});

export type RetrieverStateType = typeof RetrieverState.State;
