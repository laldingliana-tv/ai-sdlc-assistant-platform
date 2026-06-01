// Orchestration owner: LangGraph
import { Annotation } from '@langchain/langgraph';

/**
 * Reviewer agent state definition.
 * Extends base state with review-specific fields.
 */
export const ReviewerState = Annotation.Root({
  input: Annotation<string>,
  output: Annotation<string>,
  messages: Annotation<unknown[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  findings: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  approved: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  score: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),
});

export type ReviewerStateType = typeof ReviewerState.State;
