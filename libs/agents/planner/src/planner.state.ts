// Orchestration owner: LangGraph
import { Annotation } from '@langchain/langgraph';

/**
 * Planner agent state definition.
 * Extends base state with planning-specific fields.
 */
export const PlannerState = Annotation.Root({
  input: Annotation<string>,
  output: Annotation<string>,
  messages: Annotation<unknown[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  plan: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  reasoning: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
});

export type PlannerStateType = typeof PlannerState.State;
