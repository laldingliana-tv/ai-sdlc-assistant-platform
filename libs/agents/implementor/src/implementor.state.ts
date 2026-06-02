// Orchestration owner: LangGraph
import { Annotation } from '@langchain/langgraph';

/**
 * Implementor agent state definition.
 * Extends base state with implementation proposal fields.
 */
export const ImplementorState = Annotation.Root({
  input: Annotation<string>,
  output: Annotation<string>,
  messages: Annotation<unknown[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  codeBlocks: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  filesToModify: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  testStrategy: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
});

export type ImplementorStateType = typeof ImplementorState.State;
