# Continue: Implement Phase 5 — Temporal Workflow Orchestration

## Context

I'm building the **AI SDLC Assistant Platform** — an Nx monorepo at `c:\Users\VantawlL\projects\ai-sdlc-assistant-platform`.

**Already completed:**

- **Phase 1:** Monorepo foundation (Nx, pnpm workspace, tsconfig, eslint, prettier, husky, lint-staged)
- **Phase 2:** Shared contracts & types (`libs/shared/types`, `libs/shared/schemas`, `libs/shared/constants`, `libs/shared/prompts`)
- **Phase 2B:** Observability libs (`libs/infra/telemetry` with pino/OTel/Langfuse, `libs/infra/logging` with NestJS adapter)
- **Phase 3:** Backend API (`apps/api` with NestJS+Fastify, `libs/infra/database` with Prisma, `libs/infra/auth`, `libs/infra/governance`)
- **Phase 4:** Agent Layer + MCP + Evaluations (`libs/agents/core`, `libs/agents/{planner,retriever,reviewer,architecture,implementor}`, `libs/mcp`, `libs/evaluations`, `libs/agents/a2a`, `libs/agents/adk`)

The implementation plan is at `docs/IMPLEMENTATION_PLAN_V4_REVISED_FINAL.md`.

## Key Conventions Established

- **Package naming:** `@ai-sdlc/<scope>-<name>` (e.g., `@ai-sdlc/shared-types`, `@ai-sdlc/infra-telemetry`)
- **Path aliases** in `tsconfig.base.json`: `@ai-sdlc/shared/types`, `@ai-sdlc/infra/telemetry`, `@ai-sdlc/agents/core`, `@ai-sdlc/agents/planner`, `@ai-sdlc/agents/retriever`, `@ai-sdlc/agents/reviewer`, `@ai-sdlc/agents/architecture`, `@ai-sdlc/agents/implementor`, `@ai-sdlc/mcp`, `@ai-sdlc/evaluations`, etc. (use `./` prefix, no `baseUrl`)
- **All libs use** `"type": "module"` with `.js` extensions in imports
- **ESLint** uses `@nx/eslint-plugin@19.8.0`, plugin declared as `"@nx"` in `.eslintrc.json`
- **Nx version:** 19.8.0
- **TypeScript:** 5.5.4
- **Node:** 20+
- **Lib tsconfig pattern (for libs that import other workspace libs):**
  ```json
  {
    "extends": "../../../tsconfig.base.json",
    "compilerOptions": {
      "noEmit": true
    },
    "include": ["src/**/*.ts"],
    "exclude": ["node_modules", "dist"]
  }
  ```
- **App tsconfig pattern (apps/api example):**
  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "outDir": "../../dist/apps/api",
      "emitDecoratorMetadata": true,
      "experimentalDecorators": true,
      "types": ["vitest/globals", "node"]
    },
    "include": ["src/**/*.ts", "test/**/*.ts"],
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

From `@ai-sdlc/shared/types`:

- **Agent types:** `AgentName`, `AgentInput`, `AgentContext`, `AgentConfig`, `AgentOutput`, `AgentResult`, `AgentArtifact`, `AgentError`, `TokenUsage`, `AgentExecutionStatus`
- **Workflow types:** `WorkflowStatus`, `WorkflowStep`, `WorkflowExecution`, `WorkflowStepResult`, `WorkflowTriggerRequest`, `WorkflowTriggerResponse`, `ApprovalRequest`
- **Task types:** `TaskStatus`, `TaskPriority`, `TaskCreateRequest`, `TaskResponse`
- **MCP types:** `McpProviderName`, `McpToolCall`, `McpToolResponse`, `McpError`, `McpProviderConfig`

From `@ai-sdlc/shared/schemas`:

- `AgentOutputSchema`, `AgentConfigSchema`, `AgentName` (zod enum), `AgentResultSchema`, `AgentErrorSchema`, `TokenUsageSchema`, `AgentArtifactSchema`

## Existing Agent Interface

From `@ai-sdlc/agents/core`:

- `BaseAgent` interface with `name: AgentName`, `execute(input: AgentInput): Promise<AgentOutput>`
- `createAgentGraph()` — LangGraph graph factory
- `bindTools()` — MCP tool attachment utility
- `CompiledGraph` type alias

Each agent lib (`@ai-sdlc/agents/planner`, etc.) exports:

- A class implementing `BaseAgent` (e.g., `PlannerAgent`)
- A `createGraph()` function
- State types

All agent stubs return canned golden demo responses for the "Implement dark mode support across all MFEs" task.

## Existing API Workflow Service

`apps/api/src/workflows/workflows.service.ts` has a stub `trigger()` method with a TODO comment:

```typescript
// TODO: Replace with actual Temporal client connection in Phase 5
// const handle = await temporalClient.workflow.start('aiSdlcWorkflow', {
//   taskQueue: 'ai-sdlc-tasks',
//   workflowId: `task-${request.taskId}`,
//   args: [{ taskId: request.taskId }],
// });
```

This service currently creates mock `WorkflowExecution` records in memory. Phase 5 should wire this to the real Temporal client.

## Task: Implement Phase 5 — Temporal Workflow Orchestration

**Goal:** Temporal worker app, SDLC workflow definition with approval gate, activities for all agents, health probe.

**Workflow sequence:**

> Task Submitted → Planner → Retriever → Architecture Review → **Approval Gate (HITL signal wait)** → Implementor → Reviewer → Final Response

### Files to Implement (15 files)

| #   | File Path                                                | Purpose                                                                |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | `apps/workers/src/main.ts`                               | Temporal worker bootstrap                                              |
| 2   | `apps/workers/src/health.ts`                             | HTTP health/readiness probe server (for K8s/Cloud Run liveness checks) |
| 3   | `apps/workers/src/workflows/sdlc-task.workflow.ts`       | Main SDLC orchestration workflow (includes approval gate)              |
| 4   | `apps/workers/src/workflows/signals.ts`                  | Temporal signals/queries for HITL approval                             |
| 5   | `apps/workers/src/activities/planner.activity.ts`        | Planner agent activity                                                 |
| 6   | `apps/workers/src/activities/retriever.activity.ts`      | Retriever agent activity                                               |
| 7   | `apps/workers/src/activities/architecture.activity.ts`   | Architecture review activity                                           |
| 8   | `apps/workers/src/activities/reviewer.activity.ts`       | Reviewer agent activity                                                |
| 9   | `apps/workers/src/activities/implementor.activity.ts`    | Implementation proposal activity                                       |
| 10  | `apps/workers/src/activities/human-approval.activity.ts` | Human-in-the-loop approval gate                                        |
| 11  | `apps/workers/src/activities/index.ts`                   | Activities barrel export                                               |
| 12  | `apps/workers/package.json`                              | App package.json                                                       |
| 13  | `apps/workers/tsconfig.json`                             | App tsconfig                                                           |
| 14  | `apps/workers/project.json`                              | Nx project config                                                      |
| 15  | `apps/workers/vitest.config.ts`                          | Vitest config for activity unit tests                                  |

### Additionally: Wire Temporal Client into API

Update `apps/api/src/workflows/workflows.service.ts` to connect to Temporal using `@temporalio/client` (replacing the mock implementation). The API acts as a Temporal client that starts workflows and queries their status.

## Golden Demo Context

The canonical task is: **"Implement dark mode support across all MFEs"**. The workflow should demonstrate:

1. Task triggers workflow via API → Temporal starts `aiSdlcWorkflow`
2. Planner activity invokes `PlannerAgent` → returns canned plan
3. Retriever activity invokes `RetrieverAgent` → returns canned context
4. Architecture activity invokes `ArchitectureAgent` → returns canned review
5. **Approval gate** — workflow waits for `approveSignal` (human-in-the-loop)
6. Implementor activity invokes `ImplementorAgent` → returns canned implementation proposal
7. Reviewer activity invokes `ReviewerAgent` → returns canned final review
8. Workflow completes → status updated

## Orchestration Ownership

Each file should include a comment at the top:

- `// Orchestration owner: Temporal` — for workflow definitions, activities, signals, worker bootstrap

The workflow owns: activity sequencing, retries, durability, approval gates, failure recovery.
The workflow does NOT own: agent reasoning, tool selection, LLM calls (those are LangGraph's job in Phase 4 agents).

## Temporal Design Pattern

1. **Worker (`main.ts`)**: Connects to Temporal server, registers workflow + activities, starts polling task queue `ai-sdlc-tasks`
2. **Workflow (`sdlc-task.workflow.ts`)**: Deterministic function that sequences activities. Uses `proxyActivities()` for activity calls. Uses signal for approval gate.
3. **Signals (`signals.ts`)**: Define `approveSignal` and `rejectSignal` for HITL. Define `getStatusQuery` for workflow state queries.
4. **Activities**: Each activity wraps the corresponding agent's `execute()` call. Activities are non-deterministic (they call agents which may call LLMs).
5. **Health probe (`health.ts`)**: Simple HTTP server on a configurable port (e.g., 8081) that returns 200 when the worker is connected.

## Requirements

1. Implement all 15 files listed above
2. Install `@temporalio/client`, `@temporalio/worker`, `@temporalio/workflow`, `@temporalio/activity` as dependencies
3. Use `@temporalio/testing` for workflow/activity unit tests (dev dependency)
4. The workflow should use `proxyActivities()` with retry policies (e.g., `maximumAttempts: 3`, `startToCloseTimeout: '60s'`)
5. The approval gate should use a signal handler — workflow blocks with `condition()` until signal received or timeout
6. Activities should instantiate the corresponding agent and call `agent.execute(input)`
7. The health probe should be a minimal HTTP server (no framework needed — use Node's `http` module)
8. Add path alias `@ai-sdlc/workers` to `tsconfig.base.json` if needed (or keep as app-only — apps typically don't need path aliases)
9. Update `apps/api/src/workflows/workflows.service.ts` to use `@temporalio/client` for starting/querying workflows
10. Run `pnpm install` after creating package.json files
11. Verify `tsc --noEmit` passes for the worker tsconfig
12. Commit when done with a conventional commit message

## Temporal Server Note

For local development, Temporal server can be run via:

```bash
temporal server start-dev --namespace default
```

The worker should connect to `localhost:7233` by default (configurable via `TEMPORAL_ADDRESS` env var). Don't worry about starting the Temporal server — just ensure the worker code is correct and would connect when the server is available.
