# Continue: Implement Phase 4 — Agent Layer + MCP + Evaluations

## Context

I'm building the **AI SDLC Assistant Platform** — an Nx monorepo at `c:\Users\VantawlL\projects\ai-sdlc-assistant-platform`.

**Already completed:**

- **Phase 1:** Monorepo foundation (Nx, pnpm workspace, tsconfig, eslint, prettier, husky, lint-staged)
- **Phase 2:** Shared contracts & types (`libs/shared/types`, `libs/shared/schemas`, `libs/shared/constants`, `libs/shared/prompts`)
- **Phase 2B:** Observability libs (`libs/infra/telemetry` with pino/OTel/Langfuse, `libs/infra/logging` with NestJS adapter)
- **Phase 3:** Backend API (`apps/api` with NestJS+Fastify, `libs/infra/database` with Prisma, `libs/infra/auth`, `libs/infra/governance`)

The implementation plan is at `docs/IMPLEMENTATION_PLAN_V4_REVISED_FINAL.md`.

## Key Conventions Established

- **Package naming:** `@ai-sdlc/<scope>-<name>` (e.g., `@ai-sdlc/shared-types`, `@ai-sdlc/infra-telemetry`)
- **Path aliases** in `tsconfig.base.json`: `@ai-sdlc/shared/types`, `@ai-sdlc/infra/telemetry`, `@ai-sdlc/agents/core`, `@ai-sdlc/mcp`, `@ai-sdlc/evaluations`, etc. (use `./` prefix, no `baseUrl`)
- **All libs use** `"type": "module"` with `.js` extensions in imports
- **ESLint** uses `@nx/eslint-plugin@19.8.0`, plugin declared as `"@nx"` in `.eslintrc.json`
- **Nx version:** 19.8.0
- **TypeScript:** 5.5.4
- **Node:** 20+
- **For libs importing other workspace libs:** omit `rootDir` from tsconfig to avoid TS6059 errors with path aliases
- **Lib tsconfig pattern:**
  ```json
  {
    "extends": "../../../tsconfig.base.json",
    "compilerOptions": {
      "outDir": "../../../dist/libs/<scope>/<name>"
    },
    "include": ["src/**/*.ts"],
    "exclude": ["node_modules", "dist"]
  }
  ```
- **Lib package.json pattern:**
  ```json
  {
    "name": "@ai-sdlc/<scope>-<name>",
    "version": "0.0.1",
    "private": true,
    "type": "module",
    "main": "./src/index.ts",
    "types": "./src/index.ts",
    "exports": { ".": "./src/index.ts" }
  }
  ```

## Existing Shared Types Available for Use

- `@ai-sdlc/shared/types` exports: `AgentName`, `AgentInput`, `AgentContext`, `AgentConfig`, `AgentOutput`, `AgentResult`, `AgentArtifact`, `AgentError`, `TokenUsage`, `AgentExecutionStatus`, `McpProviderName`, `McpToolCall`, `McpToolResponse`, `McpError`, `McpProviderConfig`
- `@ai-sdlc/shared/schemas` exports: `AgentOutputSchema`, `AgentConfigSchema`, `AgentName` (zod enum), `AgentResultSchema`, `AgentErrorSchema`, `TokenUsageSchema`, `AgentArtifactSchema`

## Task: Implement Phase 4

Please implement Phase 4: Agent Layer + MCP + Evaluations. This includes 61 files across 5 sub-areas:

### 1. Agent Core (`libs/agents/core/`) — 6 files

| #   | File Path                                 | Purpose                             |
| --- | ----------------------------------------- | ----------------------------------- |
| 1   | `libs/agents/core/src/index.ts`           | Barrel export                       |
| 2   | `libs/agents/core/src/agent.interface.ts` | Shared BaseAgent interface contract |
| 3   | `libs/agents/core/src/graph-builder.ts`   | Reusable LangGraph graph factory    |
| 4   | `libs/agents/core/src/tool-binder.ts`     | MCP tool attachment utility         |
| 5   | `libs/agents/core/package.json`           | Lib package.json                    |
| 6   | `libs/agents/core/tsconfig.json`          | Lib tsconfig                        |

### 2. Agent Stubs (`libs/agents/{planner,retriever,reviewer,architecture,implementor}/`) — 30 files

Each agent has 6 files: `index.ts`, `<name>.agent.ts`, `<name>.state.ts`, `<name>.agent.spec.ts`, `package.json`, `tsconfig.json`

| #   | File Path                                                 | Purpose                                   |
| --- | --------------------------------------------------------- | ----------------------------------------- |
| 7   | `libs/agents/planner/src/index.ts`                        | Planner agent entry                       |
| 8   | `libs/agents/planner/src/planner.agent.ts`                | PlannerAgent (LangGraph graph stub)       |
| 9   | `libs/agents/planner/src/planner.state.ts`                | Agent state definition                    |
| 10  | `libs/agents/planner/src/planner.agent.spec.ts`           | Unit test (graph invocation in isolation) |
| 11  | `libs/agents/planner/package.json`                        | Lib package.json                          |
| 12  | `libs/agents/planner/tsconfig.json`                       | Lib tsconfig                              |
| 13  | `libs/agents/retriever/src/index.ts`                      | Retriever agent entry                     |
| 14  | `libs/agents/retriever/src/retriever.agent.ts`            | RetrieverAgent stub                       |
| 15  | `libs/agents/retriever/src/retriever.state.ts`            | Agent state definition                    |
| 16  | `libs/agents/retriever/src/retriever.agent.spec.ts`       | Unit test                                 |
| 17  | `libs/agents/retriever/package.json`                      | Lib package.json                          |
| 18  | `libs/agents/retriever/tsconfig.json`                     | Lib tsconfig                              |
| 19  | `libs/agents/reviewer/src/index.ts`                       | Reviewer agent entry                      |
| 20  | `libs/agents/reviewer/src/reviewer.agent.ts`              | ReviewerAgent stub                        |
| 21  | `libs/agents/reviewer/src/reviewer.state.ts`              | Agent state definition                    |
| 22  | `libs/agents/reviewer/src/reviewer.agent.spec.ts`         | Unit test                                 |
| 23  | `libs/agents/reviewer/package.json`                       | Lib package.json                          |
| 24  | `libs/agents/reviewer/tsconfig.json`                      | Lib tsconfig                              |
| 25  | `libs/agents/architecture/src/index.ts`                   | Architecture agent entry                  |
| 26  | `libs/agents/architecture/src/architecture.agent.ts`      | ArchitectureAgent stub                    |
| 27  | `libs/agents/architecture/src/architecture.state.ts`      | Agent state definition                    |
| 28  | `libs/agents/architecture/src/architecture.agent.spec.ts` | Unit test                                 |
| 29  | `libs/agents/architecture/package.json`                   | Lib package.json                          |
| 30  | `libs/agents/architecture/tsconfig.json`                  | Lib tsconfig                              |
| 31  | `libs/agents/implementor/src/index.ts`                    | Implementation Proposal agent entry       |
| 32  | `libs/agents/implementor/src/implementor.agent.ts`        | ImplementorAgent stub                     |
| 33  | `libs/agents/implementor/src/implementor.state.ts`        | Agent state definition                    |
| 34  | `libs/agents/implementor/src/implementor.agent.spec.ts`   | Unit test                                 |
| 35  | `libs/agents/implementor/package.json`                    | Lib package.json                          |
| 36  | `libs/agents/implementor/tsconfig.json`                   | Lib tsconfig                              |

### 3. MCP Layer (`libs/mcp/`) — 9 files

| #   | File Path                                   | Purpose                |
| --- | ------------------------------------------- | ---------------------- |
| 37  | `libs/mcp/src/index.ts`                     | Barrel export          |
| 38  | `libs/mcp/src/mcp-client.interface.ts`      | MCP client interface   |
| 39  | `libs/mcp/src/mcp-transport.interface.ts`   | Transport abstraction  |
| 40  | `libs/mcp/src/mcp.registry.ts`              | Provider registry      |
| 41  | `libs/mcp/src/providers/github.provider.ts` | GitHub MCP client stub |
| 42  | `libs/mcp/src/providers/docs.provider.ts`   | Docs MCP client stub   |
| 43  | `libs/mcp/src/providers/jira.provider.ts`   | Jira MCP client stub   |
| 44  | `libs/mcp/package.json`                     | Lib package.json       |
| 45  | `libs/mcp/tsconfig.json`                    | Lib tsconfig           |

### 4. Evaluation Framework (`libs/evaluations/`) — 7 files

| #   | File Path                                                | Purpose                                                    |
| --- | -------------------------------------------------------- | ---------------------------------------------------------- |
| 46  | `libs/evaluations/src/index.ts`                          | Barrel export                                              |
| 47  | `libs/evaluations/src/evaluator.interface.ts`            | Evaluator interface (score agent outputs against criteria) |
| 48  | `libs/evaluations/src/evaluator.registry.ts`             | Evaluator registry (strategy pattern for scoring methods)  |
| 49  | `libs/evaluations/src/evaluators/relevance.evaluator.ts` | Relevance scoring evaluator stub                           |
| 50  | `libs/evaluations/src/evaluators/quality.evaluator.ts`   | Output quality evaluator stub                              |
| 51  | `libs/evaluations/package.json`                          | Lib package.json                                           |
| 52  | `libs/evaluations/tsconfig.json`                         | Lib tsconfig                                               |

### 5. A2A & ADK Placeholders (`libs/agents/a2a/`, `libs/agents/adk/`) — 9 files

| #   | File Path                              | Purpose                                           |
| --- | -------------------------------------- | ------------------------------------------------- |
| 53  | `libs/agents/a2a/src/index.ts`         | Barrel export                                     |
| 54  | `libs/agents/a2a/src/a2a.interface.ts` | A2A messaging interface (agent-to-agent protocol) |
| 55  | `libs/agents/a2a/src/a2a.router.ts`    | A2A message router placeholder                    |
| 56  | `libs/agents/a2a/package.json`         | Lib package.json                                  |
| 57  | `libs/agents/a2a/tsconfig.json`        | Lib tsconfig                                      |
| 58  | `libs/agents/adk/src/index.ts`         | Barrel export                                     |
| 59  | `libs/agents/adk/src/adk.interface.ts` | Google ADK integration interface placeholder      |
| 60  | `libs/agents/adk/package.json`         | Lib package.json                                  |
| 61  | `libs/agents/adk/tsconfig.json`        | Lib tsconfig                                      |

## Golden Demo Context

The canonical task is: **"Implement dark mode support across all MFEs"**. Each agent stub should produce a plausible canned response for this task when invoked (so Phase 5's Temporal workflow can demonstrate end-to-end flow with stub responses).

## Orchestration Ownership

Each file should include a comment at the top indicating orchestration ownership:

- `// Orchestration owner: LangGraph` — for agent graph definitions, state, reasoning
- `// Orchestration owner: A2A (placeholder)` — for A2A files
- `// Orchestration owner: ADK (placeholder)` — for ADK files

Agents do NOT own: workflow sequencing, retries, durability, approval gates (those are Temporal's job in Phase 5).

## Agent Design Pattern

Each agent should:

1. Implement a `BaseAgent` interface from `@ai-sdlc/agents/core`
2. Define a state type (LangGraph `Annotation` or similar)
3. Expose a `createGraph()` function that builds the LangGraph state graph
4. Accept `AgentInput` from `@ai-sdlc/shared/types` and return `AgentOutput`
5. Use `@langchain/langgraph` for graph construction
6. Use `@langchain/openai` or `@langchain/anthropic` as LLM provider (stub the actual call for now — return canned golden demo response)

## Requirements

1. Implement all 61 files listed above
2. Use `@langchain/langgraph` for agent graph construction (install as dependency)
3. Use `@langchain/core` and `@langchain/openai` as peer/dev dependencies
4. Agent specs should test graph invocation with mocked LLM (return canned response)
5. MCP providers are stubs — they implement the interface but return mock data
6. Evaluators are stubs — they implement the scoring interface but return fixed scores
7. Run `pnpm install` after creating package.json files
8. Verify `tsc --noEmit` passes for all new tsconfigs
9. Commit when done with a conventional commit message
