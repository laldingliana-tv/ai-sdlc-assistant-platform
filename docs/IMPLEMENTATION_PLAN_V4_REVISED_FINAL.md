# AI SDLC Assistant Platform — Implementation Plan v4 (Revised Final)

## Changes from v3

| Change | Rationale |
|---|---|
| Added Golden Demo Scenario + weekly delivery milestones | Ensures demo-able product at every stage; prevents "everything 70% done, nothing working" |
| Added Orchestration Ownership Clarity section | Prevents architectural drift between Temporal, LangGraph, and A2A/ADK |
| Removed Redis from infrastructure | Not an explicit requirement; reduces local dev complexity; in-memory rate limiting sufficient for POC |

---

## Golden Demo Scenario

**Canonical task:** "Implement dark mode support across all MFEs"

This single task is the thread pulled through the entire system. Every phase prioritizes making this one journey work end-to-end before anything else gets fleshed out.

### Weekly Delivery Milestones

| Week | Milestone | What's demo-able |
|---|---|---|
| 1 | Foundation + Temporal local dev working | User submits task via API → persisted in DB → workflow starts (canned responses) |
| 2 | Workflow skeleton + UI shell | User submits task in UI → sees it move through workflow steps in real-time (stub agent responses) |
| 3 | Real agent integration + approval gate | Agents return LLM responses → approval gate pauses workflow → user approves in UI → trace visible |
| 4 | Polish + observability + demo prep | Full golden path polished, traces in Langfuse, error states handled, compelling demo |

### Implementation Priority Rule

> If a piece of work does not serve the golden demo scenario, it remains a stub/placeholder until the golden path works end-to-end.

---

## Orchestration Ownership Clarity

Each orchestration layer has a single, non-overlapping responsibility:

| Layer | Owns | Does NOT own |
|---|---|---|
| **Temporal** | Workflow durability, retries, approval gates, activity sequencing, failure recovery | Agent reasoning, tool selection, LLM calls |
| **LangGraph** | Agent reasoning graphs, tool calling, structured output, state machines within a single agent | Cross-agent sequencing, durability, human approval |
| **A2A** | Future interop placeholder only — typed message contract interface | Nothing active in POC |
| **ADK** | Future Google ADK interop placeholder only | Nothing active in POC |

> Every orchestration-related file should include a one-line comment at the top:  
> `// Orchestration owner: Temporal | LangGraph | A2A (placeholder) | ADK (placeholder)`

---

## Dependency Graph

```mermaid
graph TD
    P1[Phase 1: Monorepo Foundation] --> P2[Phase 2: Shared Contracts]
    P2 --> P2B[Phase 2B: Observability Libs]
    P2 --> P3[Phase 3: Backend API]
    P2 --> P4[Phase 4: Agent Layer + MCP + Evaluations]
    P2B --> P3
    P2B --> P5[Phase 5: Temporal Orchestration]
    P3 --> P5
    P4 --> P5
    P3 --> P6[Phase 6: Frontend]
    P1 --> P7[Phase 7: Infra + CI/CD]
    P3 --> P7
```

---

## Phase 1: Monorepo Foundation & Dev Tooling

**Goal:** Nx workspace, root configs, dev environment basics.  
**Complexity:** Medium  
**Dependencies:** None  

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `package.json` | Root package.json with pnpm workspace scripts |
| 2 | `nx.json` | Nx workspace configuration (targetDefaults for build pipeline ordering) |
| 3 | `pnpm-workspace.yaml` | pnpm workspace definition |
| 4 | `tsconfig.base.json` | Base TypeScript config with path aliases |
| 5 | `.eslintrc.json` | Root ESLint config |
| 6 | `.prettierrc` | Prettier config |
| 7 | `.prettierignore` | Prettier ignore patterns |
| 8 | `.husky/pre-commit` | Husky pre-commit hook |
| 9 | `.lintstagedrc.json` | lint-staged config |
| 10 | `.env.example` | Environment variable template |
| 11 | `.gitignore` | Git ignore rules |
| 12 | `.nvmrc` | Node version pinning |
| 13 | `README.md` | Project overview + startup instructions |
| 14 | `Makefile` | Dev setup orchestration (install, docker, migrate, seed, dev) |

**Nx Plugins (to declare in `nx.json` / root `package.json` devDeps):**

| Plugin | Purpose |
|--------|---------|
| `@nx/nest` | NestJS app scaffolding + build targets |
| `@nx/next` | Next.js app scaffolding + build targets |
| `@nx/js` | Library scaffolding (shared libs) |
| `@nx/vite` | Vitest integration for unit tests |
| `@nx/eslint` | Workspace-wide linting |

---

## Phase 2: Shared Contracts & Types

**Goal:** Zod schemas, inferred types, shared constants used by all layers.  
**Complexity:** Low-Medium  
**Dependencies:** Phase 1  

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `libs/shared/types/src/index.ts` | Barrel export |
| 2 | `libs/shared/types/src/task.ts` | Task request/response types |
| 3 | `libs/shared/types/src/agent.ts` | Agent input/output contracts |
| 4 | `libs/shared/types/src/workflow.ts` | Workflow state types |
| 5 | `libs/shared/types/src/mcp.ts` | MCP tool response types |
| 6 | `libs/shared/types/src/user.ts` | User/auth types |
| 7 | `libs/shared/types/src/error.ts` | Shared error types / Result type |
| 8 | `libs/shared/types/src/evaluation.ts` | Evaluation result/score types |
| 9 | `libs/shared/types/package.json` | Lib package.json |
| 10 | `libs/shared/types/tsconfig.json` | Lib tsconfig |
| 11 | `libs/shared/schemas/src/index.ts` | Barrel export |
| 12 | `libs/shared/schemas/src/task.schema.ts` | Task Zod schemas |
| 13 | `libs/shared/schemas/src/agent.schema.ts` | Agent output Zod schemas |
| 14 | `libs/shared/schemas/src/workflow.schema.ts` | Workflow Zod schemas |
| 15 | `libs/shared/schemas/src/evaluation.schema.ts` | Evaluation Zod schemas |
| 16 | `libs/shared/schemas/src/env.schema.ts` | Environment variable validation schema (reusable) |
| 17 | `libs/shared/schemas/package.json` | Lib package.json |
| 18 | `libs/shared/schemas/tsconfig.json` | Lib tsconfig |
| 19 | `libs/shared/constants/src/index.ts` | Shared constants (agent names, statuses, policy names) |
| 20 | `libs/shared/constants/package.json` | Lib package.json |
| 21 | `libs/shared/constants/tsconfig.json` | Lib tsconfig |
| 22 | `libs/shared/prompts/src/index.ts` | Barrel export |
| 23 | `libs/shared/prompts/src/registry.ts` | Prompt template registry with type-safe retrieval |
| 24 | `libs/shared/prompts/src/types.ts` | Prompt template type definitions (variables, model config) |
| 25 | `libs/shared/prompts/package.json` | Lib package.json |
| 26 | `libs/shared/prompts/tsconfig.json` | Lib tsconfig |

---

## Phase 2B: Observability Libs

**Goal:** Structured logging, tracing, and Langfuse hooks — available before backend/worker phases.  
**Complexity:** Low-Medium  
**Dependencies:** Phase 2  

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `libs/infra/telemetry/src/index.ts` | Barrel export |
| 2 | `libs/infra/telemetry/src/tracing.ts` | OpenTelemetry bootstrap |
| 3 | `libs/infra/telemetry/src/langfuse.ts` | Langfuse integration placeholder |
| 4 | `libs/infra/telemetry/src/logger.ts` | Structured logger (pino-based) |
| 5 | `libs/infra/telemetry/package.json` | Lib package.json |
| 6 | `libs/infra/telemetry/tsconfig.json` | Lib tsconfig |
| 7 | `libs/infra/logging/src/index.ts` | Barrel export |
| 8 | `libs/infra/logging/src/logger.service.ts` | NestJS LoggerService adapter (wraps telemetry logger) |
| 9 | `libs/infra/logging/package.json` | Lib package.json |
| 10 | `libs/infra/logging/tsconfig.json` | Lib tsconfig |

> **Separation rationale:** `libs/infra/telemetry/` owns the core structured logger (pino), OTel bootstrap, and Langfuse hooks (framework-agnostic). `libs/infra/logging/` provides only the NestJS `LoggerService` adapter for DI.

---

## Phase 3: Backend API (NestJS + Fastify)

**Goal:** NestJS app with Fastify, core modules, Prisma, health/task/workflow/evaluation endpoints.  
**Complexity:** High  
**Dependencies:** Phase 2, Phase 2B  

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `apps/api/src/main.ts` | Bootstrap NestJS with Fastify adapter + CORS config |
| 2 | `apps/api/src/app.module.ts` | Root module |
| 3 | `apps/api/src/health/health.controller.ts` | Health check endpoint |
| 4 | `apps/api/src/health/health.module.ts` | Health module |
| 5 | `apps/api/src/tasks/tasks.controller.ts` | Task CRUD + submission endpoint |
| 6 | `apps/api/src/tasks/tasks.service.ts` | Task service |
| 7 | `apps/api/src/tasks/tasks.module.ts` | Tasks module |
| 8 | `apps/api/src/tasks/dto/create-task.dto.ts` | Create task DTO |
| 9 | `apps/api/src/workflows/workflows.controller.ts` | Workflow status/trigger endpoint |
| 10 | `apps/api/src/workflows/workflows.service.ts` | Workflow service (Temporal client) |
| 11 | `apps/api/src/workflows/workflows.module.ts` | Workflows module |
| 12 | `apps/api/src/evaluations/evaluations.controller.ts` | Evaluation results endpoint |
| 13 | `apps/api/src/evaluations/evaluations.service.ts` | Evaluation service |
| 14 | `apps/api/src/evaluations/evaluations.module.ts` | Evaluations module |
| 15 | `apps/api/src/events/events.gateway.ts` | SSE/WebSocket gateway placeholder |
| 16 | `apps/api/src/events/events.module.ts` | Events module |
| 17 | `apps/api/src/common/filters/http-exception.filter.ts` | Global exception filter |
| 18 | `apps/api/src/common/interceptors/logging.interceptor.ts` | Request logging interceptor |
| 19 | `apps/api/src/common/interceptors/correlation-id.interceptor.ts` | Correlation ID propagation |
| 20 | `apps/api/src/common/pipes/zod-validation.pipe.ts` | Zod-based validation pipe |
| 21 | `apps/api/src/config/configuration.ts` | Typed config loader |
| 22 | `apps/api/src/config/env.schema.ts` | Zod schema validating required env vars at bootstrap |
| 23 | `apps/api/src/config/config.module.ts` | Config module |
| 24 | `apps/api/nest-cli.json` | NestJS CLI config (asset copying) |
| 25 | `apps/api/package.json` | App package.json |
| 26 | `apps/api/tsconfig.json` | App tsconfig |
| 27 | `apps/api/tsconfig.build.json` | Build tsconfig |
| 28 | `apps/api/project.json` | Nx project config |
| 29 | `apps/api/vitest.config.ts` | Vitest config |
| 30 | `apps/api/test/app.e2e-spec.ts` | E2E test placeholder (Supertest) |

**Database (Prisma):**

| # | File Path | Purpose |
|---|-----------|---------|
| 31 | `libs/infra/database/prisma/schema.prisma` | Prisma schema (User, Task, AgentExecution, WorkflowExecution, EvaluationResult, Approval) + pgvector extension + example vector column |
| 32 | `libs/infra/database/prisma/seed.ts` | Seed script for development data |
| 33 | `libs/infra/database/src/index.ts` | PrismaService export |
| 34 | `libs/infra/database/src/prisma.service.ts` | NestJS PrismaService |
| 35 | `libs/infra/database/package.json` | Lib package.json (includes prisma migrate + db seed scripts) |
| 36 | `libs/infra/database/tsconfig.json` | Lib tsconfig |

**Auth placeholder:**

| # | File Path | Purpose |
|---|-----------|---------|
| 37 | `libs/infra/auth/src/index.ts` | Barrel export |
| 38 | `libs/infra/auth/src/auth.module.ts` | Auth module (JWT-ready) |
| 39 | `libs/infra/auth/src/auth.guard.ts` | Auth guard placeholder |
| 40 | `libs/infra/auth/src/rbac.decorator.ts` | RBAC decorator |
| 41 | `libs/infra/auth/src/throttle.guard.ts` | Rate limiting guard (in-memory Fastify throttle) |
| 42 | `libs/infra/auth/package.json` | Lib package.json |
| 43 | `libs/infra/auth/tsconfig.json` | Lib tsconfig |

**Governance:**

| # | File Path | Purpose |
|---|-----------|---------|
| 44 | `libs/infra/governance/src/index.ts` | Barrel export |
| 45 | `libs/infra/governance/src/policy.interface.ts` | Policy check interface (evaluate, enforce) |
| 46 | `libs/infra/governance/src/policy.registry.ts` | Policy registry (register/resolve policies by name) |
| 47 | `libs/infra/governance/src/policies/approval-policy.ts` | Approval requirement policy (ties into Temporal HITL gate) |
| 48 | `libs/infra/governance/src/policies/scope-policy.ts` | Task scope boundary policy (prevents out-of-scope agent actions) |
| 49 | `libs/infra/governance/package.json` | Lib package.json |
| 50 | `libs/infra/governance/tsconfig.json` | Lib tsconfig |

---

## Phase 4: Agent Layer + MCP + Evaluations

**Goal:** LangGraph agent stubs, shared agent core, MCP abstraction, provider implementations, A2A/ADK placeholders, evaluation framework.  
**Complexity:** High  
**Dependencies:** Phase 2  

**Agent core (shared utilities):**

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `libs/agents/core/src/index.ts` | Barrel export |
| 2 | `libs/agents/core/src/agent.interface.ts` | Shared BaseAgent interface contract |
| 3 | `libs/agents/core/src/graph-builder.ts` | Reusable LangGraph graph factory |
| 4 | `libs/agents/core/src/tool-binder.ts` | MCP tool attachment utility |
| 5 | `libs/agents/core/package.json` | Lib package.json |
| 6 | `libs/agents/core/tsconfig.json` | Lib tsconfig |

**Agent stubs:**

| # | File Path | Purpose |
|---|-----------|---------|
| 7 | `libs/agents/planner/src/index.ts` | Planner agent entry |
| 8 | `libs/agents/planner/src/planner.agent.ts` | PlannerAgent (LangGraph graph stub) |
| 9 | `libs/agents/planner/src/planner.state.ts` | Agent state definition |
| 10 | `libs/agents/planner/src/planner.agent.spec.ts` | Unit test (graph invocation in isolation) |
| 11 | `libs/agents/planner/package.json` | Lib package.json |
| 12 | `libs/agents/planner/tsconfig.json` | Lib tsconfig |
| 13 | `libs/agents/retriever/src/index.ts` | Retriever agent entry |
| 14 | `libs/agents/retriever/src/retriever.agent.ts` | RetrieverAgent stub |
| 15 | `libs/agents/retriever/src/retriever.state.ts` | Agent state definition |
| 16 | `libs/agents/retriever/src/retriever.agent.spec.ts` | Unit test |
| 17 | `libs/agents/retriever/package.json` | Lib package.json |
| 18 | `libs/agents/retriever/tsconfig.json` | Lib tsconfig |
| 19 | `libs/agents/reviewer/src/index.ts` | Reviewer agent entry |
| 20 | `libs/agents/reviewer/src/reviewer.agent.ts` | ReviewerAgent stub |
| 21 | `libs/agents/reviewer/src/reviewer.state.ts` | Agent state definition |
| 22 | `libs/agents/reviewer/src/reviewer.agent.spec.ts` | Unit test |
| 23 | `libs/agents/reviewer/package.json` | Lib package.json |
| 24 | `libs/agents/reviewer/tsconfig.json` | Lib tsconfig |
| 25 | `libs/agents/architecture/src/index.ts` | Architecture agent entry |
| 26 | `libs/agents/architecture/src/architecture.agent.ts` | ArchitectureAgent stub |
| 27 | `libs/agents/architecture/src/architecture.state.ts` | Agent state definition |
| 28 | `libs/agents/architecture/src/architecture.agent.spec.ts` | Unit test |
| 29 | `libs/agents/architecture/package.json` | Lib package.json |
| 30 | `libs/agents/architecture/tsconfig.json` | Lib tsconfig |
| 31 | `libs/agents/implementor/src/index.ts` | Implementation Proposal agent entry |
| 32 | `libs/agents/implementor/src/implementor.agent.ts` | ImplementorAgent stub |
| 33 | `libs/agents/implementor/src/implementor.state.ts` | Agent state definition |
| 34 | `libs/agents/implementor/src/implementor.agent.spec.ts` | Unit test |
| 35 | `libs/agents/implementor/package.json` | Lib package.json |
| 36 | `libs/agents/implementor/tsconfig.json` | Lib tsconfig |

**MCP layer:**

| # | File Path | Purpose |
|---|-----------|---------|
| 37 | `libs/mcp/src/index.ts` | Barrel export |
| 38 | `libs/mcp/src/mcp-client.interface.ts` | MCP client interface |
| 39 | `libs/mcp/src/mcp-transport.interface.ts` | Transport abstraction |
| 40 | `libs/mcp/src/mcp.registry.ts` | Provider registry |
| 41 | `libs/mcp/src/providers/github.provider.ts` | GitHub MCP client stub |
| 42 | `libs/mcp/src/providers/docs.provider.ts` | Docs MCP client stub |
| 43 | `libs/mcp/src/providers/jira.provider.ts` | Jira MCP client stub |
| 44 | `libs/mcp/package.json` | Lib package.json |
| 45 | `libs/mcp/tsconfig.json` | Lib tsconfig |

**Evaluation framework:**

| # | File Path | Purpose |
|---|-----------|---------|
| 46 | `libs/evaluations/src/index.ts` | Barrel export |
| 47 | `libs/evaluations/src/evaluator.interface.ts` | Evaluator interface (score agent outputs against criteria) |
| 48 | `libs/evaluations/src/evaluator.registry.ts` | Evaluator registry (strategy pattern for scoring methods) |
| 49 | `libs/evaluations/src/evaluators/relevance.evaluator.ts` | Relevance scoring evaluator stub |
| 50 | `libs/evaluations/src/evaluators/quality.evaluator.ts` | Output quality evaluator stub |
| 51 | `libs/evaluations/package.json` | Lib package.json |
| 52 | `libs/evaluations/tsconfig.json` | Lib tsconfig |

**A2A & Google ADK placeholders:**

| # | File Path | Purpose |
|---|-----------|---------|
| 53 | `libs/agents/a2a/src/index.ts` | Barrel export |
| 54 | `libs/agents/a2a/src/a2a.interface.ts` | A2A messaging interface (agent-to-agent protocol) |
| 55 | `libs/agents/a2a/src/a2a.router.ts` | A2A message router placeholder |
| 56 | `libs/agents/a2a/package.json` | Lib package.json |
| 57 | `libs/agents/a2a/tsconfig.json` | Lib tsconfig |
| 58 | `libs/agents/adk/src/index.ts` | Barrel export |
| 59 | `libs/agents/adk/src/adk.interface.ts` | Google ADK integration interface placeholder |
| 60 | `libs/agents/adk/package.json` | Lib package.json |
| 61 | `libs/agents/adk/tsconfig.json` | Lib tsconfig |

---

## Phase 5: Temporal Workflow Orchestration

**Goal:** Temporal worker, SDLC workflow definition with approval gate, activities for all agents, health probe.  
**Complexity:** Medium-High  
**Dependencies:** Phase 3, Phase 4, Phase 2B  

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `apps/workers/src/main.ts` | Temporal worker bootstrap |
| 2 | `apps/workers/src/health.ts` | HTTP health/readiness probe server (for K8s/Cloud Run liveness checks) |
| 3 | `apps/workers/src/workflows/sdlc-task.workflow.ts` | Main SDLC orchestration workflow (includes approval gate) |
| 4 | `apps/workers/src/workflows/signals.ts` | Temporal signals/queries for HITL approval |
| 5 | `apps/workers/src/activities/planner.activity.ts` | Planner agent activity |
| 6 | `apps/workers/src/activities/retriever.activity.ts` | Retriever agent activity |
| 7 | `apps/workers/src/activities/architecture.activity.ts` | Architecture review activity |
| 8 | `apps/workers/src/activities/reviewer.activity.ts` | Reviewer agent activity |
| 9 | `apps/workers/src/activities/implementor.activity.ts` | Implementation proposal activity |
| 10 | `apps/workers/src/activities/human-approval.activity.ts` | Human-in-the-loop approval gate |
| 11 | `apps/workers/src/activities/index.ts` | Activities barrel export |
| 12 | `apps/workers/package.json` | App package.json |
| 13 | `apps/workers/tsconfig.json` | App tsconfig |
| 14 | `apps/workers/project.json` | Nx project config |
| 15 | `apps/workers/vitest.config.ts` | Vitest config for activity unit tests |

> **Workflow sequence:**  
> Task Submitted → Planner → Retriever → Architecture Review → **Approval Gate (HITL signal wait)** → Implementor → Reviewer → Final Response

---

## Phase 6: Frontend (Next.js)

**Goal:** Next.js app with dashboard shell, task submission, trace view placeholder, streaming support.  
**Complexity:** High  
**Dependencies:** Phase 3  

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `apps/web/src/app/layout.tsx` | Root layout with sidebar shell + theme provider |
| 2 | `apps/web/src/app/page.tsx` | Dashboard home page |
| 3 | `apps/web/src/app/tasks/page.tsx` | Task list page |
| 4 | `apps/web/src/app/tasks/new/page.tsx` | Task submission form |
| 5 | `apps/web/src/app/tasks/[id]/page.tsx` | Task detail + trace view |
| 6 | `apps/web/src/app/workflows/page.tsx` | Workflow execution history |
| 7 | `apps/web/src/app/globals.css` | Tailwind global styles + CSS custom properties (design tokens: colors, radii, spacing) |
| 8 | `apps/web/src/components/layout/sidebar.tsx` | Sidebar navigation |
| 9 | `apps/web/src/components/layout/header.tsx` | Top header bar |
| 10 | `apps/web/src/components/layout/shell.tsx` | Dashboard shell wrapper |
| 11 | `apps/web/src/components/layout/theme-provider.tsx` | Dark/light theme provider (next-themes) |
| 12 | `apps/web/src/components/tasks/task-form.tsx` | Task submission form component |
| 13 | `apps/web/src/components/tasks/task-list.tsx` | Task list component |
| 14 | `apps/web/src/components/trace/trace-viewer.tsx` | Agent trace visualization placeholder |
| 15 | `apps/web/src/lib/api-client.ts` | API client (typed fetch wrapper using shared Zod schemas for response validation) |
| 16 | `apps/web/src/lib/query-provider.tsx` | React Query provider |
| 17 | `apps/web/src/hooks/use-tasks.ts` | Task query hooks |
| 18 | `apps/web/src/hooks/use-workflows.ts` | Workflow query hooks |
| 19 | `apps/web/src/hooks/use-event-stream.ts` | SSE/WebSocket streaming hook |
| 20 | `apps/web/src/stores/task.store.ts` | Zustand store for task UI state |
| 21 | `apps/web/tailwind.config.ts` | Tailwind config (darkMode: 'class', extends theme from CSS vars) |
| 22 | `apps/web/postcss.config.mjs` | PostCSS config |
| 23 | `apps/web/next.config.ts` | Next.js config |
| 24 | `apps/web/package.json` | App package.json |
| 25 | `apps/web/tsconfig.json` | App tsconfig |
| 26 | `apps/web/project.json` | Nx project config |
| 27 | `apps/web/components.json` | shadcn/ui config |
| 28 | `apps/web/vitest.config.ts` | Vitest config for component/hook tests |

**shadcn/ui primitives (minimal set):**

| # | File Path | Purpose |
|---|-----------|---------|
| 29 | `apps/web/src/components/ui/button.tsx` | Button component |
| 30 | `apps/web/src/components/ui/input.tsx` | Input component |
| 31 | `apps/web/src/components/ui/card.tsx` | Card component |
| 32 | `apps/web/src/components/ui/badge.tsx` | Badge/status component |
| 33 | `apps/web/src/components/ui/textarea.tsx` | Textarea component |
| 34 | `apps/web/src/components/ui/select.tsx` | Select component |

**E2E testing:**

| # | File Path | Purpose |
|---|-----------|---------|
| 35 | `apps/web/e2e/playwright.config.ts` | Playwright config |
| 36 | `apps/web/e2e/example.spec.ts` | Example E2E test placeholder |

> **Design token strategy:** `globals.css` defines CSS custom properties for the full color palette, spacing scale, and radii. Tailwind config extends its theme from these variables. This gives a single source of truth for visual identity (Linear/Vercel/Cursor aesthetic). If a second frontend is introduced, extract to `libs/ui/` shared lib.

---

## Phase 7: Infrastructure & CI/CD

**Goal:** Docker Compose, GitHub Actions, deployment scaffolding.  
**Complexity:** Medium  
**Dependencies:** Phase 1, Phase 3  

**Docker / Dev Env:**

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `docker-compose.yml` | Postgres 15 (+ pgvector extension), Temporal (server + UI) |
| 2 | `docker/api.Dockerfile` | API Dockerfile |
| 3 | `docker/web.Dockerfile` | Web Dockerfile |
| 4 | `docker/workers.Dockerfile` | Workers Dockerfile |
| 5 | `.dockerignore` | Prevent node_modules/.git/dist in images |

> **Note:** Redis is intentionally excluded. Rate limiting uses in-memory Fastify throttle (`@fastify/rate-limit` with default local store). Redis can be introduced post-demo if distributed rate limiting or caching becomes necessary.

**CI/CD:**

| # | File Path | Purpose |
|---|-----------|---------|
| 6 | `.github/workflows/ci.yml` | Lint + typecheck + test pipeline |
| 7 | `.github/workflows/build.yml` | Docker build pipeline |
| 8 | `.github/workflows/deploy.yml` | Deploy placeholder (Cloud Run) |

---

## Summary

| Phase | Files | Complexity | Parallel? |
|-------|-------|------------|-----------|
| 1. Monorepo Foundation | 14 | Medium | — |
| 2. Shared Contracts | 26 | Low-Medium | — |
| 2B. Observability Libs | 10 | Low-Medium | — |
| 3. Backend API | 50 | High | With Phase 4 |
| 4. Agent Layer + MCP + Evaluations | 61 | High | With Phase 3 |
| 5. Temporal Orchestration | 15 | Medium-High | After 3+4+2B |
| 6. Frontend | 36 | High | After 3 |
| 7. Infra + CI/CD | 8 | Medium | After 1+3 |
| **Total** | **~220** | | |

---

## Recommended Execution Order

1. **Phase 1** → foundation everything else builds on
2. **Phase 2** → shared contracts needed by backend + agents
3. **Phase 2B** → observability libs needed by backend logging/tracing interceptors
4. **Phase 3 + Phase 4** (parallel) → backend API and agent layer are independent
5. **Phase 5** → wires agents into workflow with approval gate
6. **Phase 6** → frontend consumes API
7. **Phase 7** → Docker, CI/CD wraps everything up

> **Contract freeze rule:** Phase 2 shared types/schemas should be treated as frozen once Phase 3 and Phase 4 begin parallel execution. Any schema changes during those phases require a PR against the shared lib — no ad-hoc edits.

> **Golden path priority:** Within each phase, implement the minimum required to serve the golden demo scenario first. Everything else remains a stub until the canonical "Implement dark mode support across all MFEs" task flows end-to-end through the system.

---

## Version Pinning

| Dependency | Version | Rationale |
|---|---|---|
| Node.js | 20 LTS | Long-term support, required by Temporal SDK |
| pnpm | 9.x | Workspace protocol features, performant |
| Nx | 19.x+ | Latest with improved caching + project inference |
| Next.js | 14.x+ | App Router stability, TypeScript config support |
| NestJS | 10.x+ | Latest stable, Fastify 4 support |
| TypeScript | 5.4+ | `satisfies`, `NoInfer`, const type params |
| Temporal SDK | `@temporalio/worker` 1.x | Stable TypeScript SDK |
| LangGraph.js | 0.2.x+ | Latest (API evolving — pin minor version) |
| PostgreSQL | 15+ | Native JSON improvements, pgvector 0.5+ compat |
| pgvector | 0.5+ | HNSW index support |
| Prisma | 5.x+ | Improved query engine, pgvector extension support |
| Playwright | 1.40+ | Latest stable for E2E |
| Vitest | 1.x+ | Stable, fast, Vite-native |
| Pino | 8.x+ | Structured logging, fast serialization |

---

## Architecture Decisions & Notes

### Orchestration Ownership (v4 addition)

- **Temporal** = workflow orchestration. Owns: durability, retries, approval gates, activity sequencing, failure recovery. Does NOT own: agent reasoning, tool selection, LLM calls.
- **LangGraph** = agent reasoning graphs. Owns: tool calling, structured output, state machines within a single agent. Does NOT own: cross-agent sequencing, durability, human approval.
- **A2A** = future interop placeholder only. Typed message contract interface. Nothing active in POC.
- **ADK** = future Google ADK interop placeholder only. Nothing active in POC.

### Telemetry vs. Logging Separation
- `libs/infra/telemetry/` — owns pino logger, OTel bootstrap, Langfuse hooks (framework-agnostic)
- `libs/infra/logging/` — NestJS-specific `LoggerService` adapter that wraps the telemetry logger for DI injection

### Frontend Design Token Strategy
- `globals.css` defines CSS custom properties (colors, radii, spacing) as the single source of truth
- Tailwind config extends its theme from these CSS variables
- Dark mode via `next-themes` + Tailwind `darkMode: 'class'` toggling CSS variable sets
- shadcn/ui components consume tokens automatically (they're built on CSS vars)
- Visual identity: Linear/Vercel/Cursor aesthetic achieved through token values, not infrastructure
- **Future extraction:** If a second frontend is introduced, extract tokens + primitives to `libs/ui/`

### Agent Architecture
- All agents implement `BaseAgent` interface from `libs/agents/core/`
- Each agent owns its LangGraph state definition
- MCP tools are bound via shared `tool-binder.ts` utility
- A2A messaging is interface-only for now (no transport implementation)
- Each agent has a unit test demonstrating graph invocation in isolation

### Evaluation Framework
- `libs/evaluations/` defines strategy-based evaluator interfaces
- Evaluators score agent outputs against defined criteria (relevance, quality, etc.)
- Results stored in `EvaluationResult` DB entity
- Integrates with Langfuse for trace-level scoring (via telemetry lib)
- Extensible: new evaluator strategies registered in the evaluator registry

### Governance Layer
- `libs/infra/governance/` provides policy interfaces for platform governance
- `approval-policy.ts` determines when human approval is required (ties into Temporal HITL gate)
- `scope-policy.ts` defines boundaries for agent actions (prevents scope creep)
- Policies resolved by name from registry — agents/workflows call `policy.evaluate()` before actions
- Future policies: cost-limit, model-access, data-sensitivity

### Security Considerations
- CORS configured in `main.ts` for frontend origin
- Rate limiting via `throttle.guard.ts` backed by in-memory Fastify throttle (`@fastify/rate-limit` default store)
- Zod validation pipe for schema enforcement at API boundary
- Env validation at startup prevents misconfigured deployments
- Auth guard placeholder ready for JWT/OIDC integration
- Agent prompt injection defense is a future concern — noted for Phase 4 hardening

### Rate Limiting Strategy (v4 addition)
- POC uses in-memory `@fastify/rate-limit` (no external dependency)
- Sufficient for single-instance deployment during demo period
- Redis-backed distributed rate limiting is a post-demo enhancement if horizontal scaling is required

### Temporal Workflow Design
- Linear activity chain with a signal-based approval gate
- `condition()` / `defineSignal()` used for HITL wait
- Each activity wraps one agent invocation
- Workflow supports both auto-approve (CI) and manual-approve (UI) modes
- Worker exposes HTTP health endpoint for K8s liveness/readiness probes

---

## Future Enhancement: A2A + ADK Implementation (Demo 2)

**Prerequisite:** Demo 1 delivered and stable.  
**Goal:** Demonstrate multi-framework agent interoperability without rewriting the core platform.

### Why This Works Without a Rewrite

- A2A interfaces (`libs/agents/a2a/`) already define the message contract — Demo 2 implements the transport layer behind them
- ADK placeholder (`libs/agents/adk/`) is the integration point — an adapter wraps existing agents to make them ADK-compatible
- Agents are decoupled from orchestration via `BaseAgent` interface — exposing them via A2A is an additive layer, not a replacement
- Temporal remains the workflow backbone — A2A handles inter-agent discovery/communication protocol; Temporal still manages durability, retries, and approval gates (complementary, not competing)

### Demo 2 Scope

| # | Deliverable | Description |
|---|---|---|
| 1 | A2A transport implementation | HTTP/gRPC message passing between agents behind existing `a2a.interface.ts` |
| 2 | ADK agent adapter | Wrap 1-2 existing agents as ADK-compatible agents |
| 3 | Cross-framework communication | External ADK agent calling the platform's Planner agent via A2A protocol |
| 4 | Mixed orchestration workflow | New Temporal workflow orchestrating both internal and external agents |

### Relationship to Demo 1

```
Demo 1 (core platform):  Temporal → LangGraph agents → MCP tools → approval → trace
Demo 2 (interop layer):  A2A transport + ADK adapters layered ON TOP of Demo 1
```

> No existing agents, workflows, or infrastructure are modified. Demo 2 is purely additive.
