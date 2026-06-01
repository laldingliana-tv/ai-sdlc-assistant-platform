# AI SDLC Assistant Platform — Implementation Plan

## Dependency Graph

```mermaid
graph TD
    P1[Phase 1: Monorepo Foundation] --> P2[Phase 2: Shared Contracts]
    P2 --> P3[Phase 3: Backend API]
    P2 --> P4[Phase 4: Agent Layer + MCP]
    P3 --> P5[Phase 5: Temporal Orchestration]
    P4 --> P5
    P3 --> P6[Phase 6: Frontend]
    P5 --> P6
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
| 2 | `nx.json` | Nx workspace configuration |
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
| 7 | `libs/shared/types/package.json` | Lib package.json |
| 8 | `libs/shared/types/tsconfig.json` | Lib tsconfig |
| 9 | `libs/shared/schemas/src/index.ts` | Barrel export |
| 10 | `libs/shared/schemas/src/task.schema.ts` | Task Zod schemas |
| 11 | `libs/shared/schemas/src/agent.schema.ts` | Agent output Zod schemas |
| 12 | `libs/shared/schemas/src/workflow.schema.ts` | Workflow Zod schemas |
| 13 | `libs/shared/schemas/package.json` | Lib package.json |
| 14 | `libs/shared/schemas/tsconfig.json` | Lib tsconfig |
| 15 | `libs/shared/constants/src/index.ts` | Shared constants (agent names, statuses) |
| 16 | `libs/shared/constants/package.json` | Lib package.json |
| 17 | `libs/shared/constants/tsconfig.json` | Lib tsconfig |
| 18 | `libs/shared/prompts/src/index.ts` | Prompt template registry (stubs) |
| 19 | `libs/shared/prompts/package.json` | Lib package.json |
| 20 | `libs/shared/prompts/tsconfig.json` | Lib tsconfig |

---

## Phase 3: Backend API (NestJS + Fastify)

**Goal:** NestJS app with Fastify, core modules, Prisma, health/task/workflow endpoints.  
**Complexity:** High  
**Dependencies:** Phase 2  

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `apps/api/src/main.ts` | Bootstrap NestJS with Fastify adapter |
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
| 12 | `apps/api/src/events/events.gateway.ts` | SSE/WebSocket gateway placeholder |
| 13 | `apps/api/src/events/events.module.ts` | Events module |
| 14 | `apps/api/src/common/filters/http-exception.filter.ts` | Global exception filter |
| 15 | `apps/api/src/common/interceptors/logging.interceptor.ts` | Request logging interceptor |
| 16 | `apps/api/src/common/interceptors/correlation-id.interceptor.ts` | Correlation ID propagation |
| 17 | `apps/api/src/common/pipes/zod-validation.pipe.ts` | Zod-based validation pipe |
| 18 | `apps/api/src/config/configuration.ts` | Typed config loader |
| 19 | `apps/api/src/config/config.module.ts` | Config module |
| 20 | `apps/api/package.json` | App package.json |
| 21 | `apps/api/tsconfig.json` | App tsconfig |
| 22 | `apps/api/tsconfig.build.json` | Build tsconfig |
| 23 | `apps/api/project.json` | Nx project config |
| 24 | `apps/api/vitest.config.ts` | Vitest config |
| 25 | `apps/api/test/app.e2e-spec.ts` | E2E test placeholder (Supertest) |

**Database (Prisma):**

| # | File Path | Purpose |
|---|-----------|---------|
| 26 | `libs/infra/database/prisma/schema.prisma` | Prisma schema (User, Task, AgentExecution, WorkflowExecution, EvaluationResult, Approval) |
| 27 | `libs/infra/database/src/index.ts` | PrismaService export |
| 28 | `libs/infra/database/src/prisma.service.ts` | NestJS PrismaService |
| 29 | `libs/infra/database/package.json` | Lib package.json |
| 30 | `libs/infra/database/tsconfig.json` | Lib tsconfig |

**Auth placeholder:**

| # | File Path | Purpose |
|---|-----------|---------|
| 31 | `libs/infra/auth/src/index.ts` | Barrel export |
| 32 | `libs/infra/auth/src/auth.module.ts` | Auth module (JWT-ready) |
| 33 | `libs/infra/auth/src/auth.guard.ts` | Auth guard placeholder |
| 34 | `libs/infra/auth/src/rbac.decorator.ts` | RBAC decorator |
| 35 | `libs/infra/auth/package.json` | Lib package.json |
| 36 | `libs/infra/auth/tsconfig.json` | Lib tsconfig |

---

## Phase 4: Agent Layer + MCP

**Goal:** LangGraph agent stubs, MCP abstraction, provider implementations.  
**Complexity:** High  
**Dependencies:** Phase 2  

**Agent stubs:**

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `libs/agents/planner/src/index.ts` | Planner agent entry |
| 2 | `libs/agents/planner/src/planner.agent.ts` | PlannerAgent (LangGraph graph stub) |
| 3 | `libs/agents/planner/src/planner.state.ts` | Agent state definition |
| 4 | `libs/agents/planner/package.json` | Lib package.json |
| 5 | `libs/agents/planner/tsconfig.json` | Lib tsconfig |
| 6 | `libs/agents/retriever/src/index.ts` | Retriever agent entry |
| 7 | `libs/agents/retriever/src/retriever.agent.ts` | RetrieverAgent stub |
| 8 | `libs/agents/retriever/src/retriever.state.ts` | Agent state definition |
| 9 | `libs/agents/retriever/package.json` | Lib package.json |
| 10 | `libs/agents/retriever/tsconfig.json` | Lib tsconfig |
| 11 | `libs/agents/reviewer/src/index.ts` | Reviewer agent entry |
| 12 | `libs/agents/reviewer/src/reviewer.agent.ts` | ReviewerAgent stub |
| 13 | `libs/agents/reviewer/src/reviewer.state.ts` | Agent state definition |
| 14 | `libs/agents/reviewer/package.json` | Lib package.json |
| 15 | `libs/agents/reviewer/tsconfig.json` | Lib tsconfig |
| 16 | `libs/agents/architecture/src/index.ts` | Architecture agent entry |
| 17 | `libs/agents/architecture/src/architecture.agent.ts` | ArchitectureAgent stub |
| 18 | `libs/agents/architecture/src/architecture.state.ts` | Agent state definition |
| 19 | `libs/agents/architecture/package.json` | Lib package.json |
| 20 | `libs/agents/architecture/tsconfig.json` | Lib tsconfig |

**MCP layer:**

| # | File Path | Purpose |
|---|-----------|---------|
| 21 | `libs/mcp/src/index.ts` | Barrel export |
| 22 | `libs/mcp/src/mcp-client.interface.ts` | MCP client interface |
| 23 | `libs/mcp/src/mcp-transport.interface.ts` | Transport abstraction |
| 24 | `libs/mcp/src/mcp.registry.ts` | Provider registry |
| 25 | `libs/mcp/src/providers/github.provider.ts` | GitHub MCP client stub |
| 26 | `libs/mcp/src/providers/docs.provider.ts` | Docs MCP client stub |
| 27 | `libs/mcp/src/providers/jira.provider.ts` | Jira MCP client stub |
| 28 | `libs/mcp/package.json` | Lib package.json |
| 29 | `libs/mcp/tsconfig.json` | Lib tsconfig |

---

## Phase 5: Temporal Workflow Orchestration

**Goal:** Temporal worker, SDLC workflow definition, activities.  
**Complexity:** Medium-High  
**Dependencies:** Phase 3, Phase 4  

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `apps/workers/src/main.ts` | Temporal worker bootstrap |
| 2 | `apps/workers/src/workflows/sdlc-task.workflow.ts` | Main SDLC orchestration workflow |
| 3 | `apps/workers/src/activities/planner.activity.ts` | Planner agent activity |
| 4 | `apps/workers/src/activities/retriever.activity.ts` | Retriever agent activity |
| 5 | `apps/workers/src/activities/architecture.activity.ts` | Architecture review activity |
| 6 | `apps/workers/src/activities/reviewer.activity.ts` | Reviewer agent activity |
| 7 | `apps/workers/src/activities/index.ts` | Activities barrel export |
| 8 | `apps/workers/package.json` | App package.json |
| 9 | `apps/workers/tsconfig.json` | App tsconfig |
| 10 | `apps/workers/project.json` | Nx project config |

---

## Phase 6: Frontend (Next.js)

**Goal:** Next.js app with dashboard shell, task submission, trace view placeholder.  
**Complexity:** High  
**Dependencies:** Phase 3  

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `apps/web/src/app/layout.tsx` | Root layout with sidebar shell |
| 2 | `apps/web/src/app/page.tsx` | Dashboard home page |
| 3 | `apps/web/src/app/tasks/page.tsx` | Task list page |
| 4 | `apps/web/src/app/tasks/new/page.tsx` | Task submission form |
| 5 | `apps/web/src/app/tasks/[id]/page.tsx` | Task detail + trace view |
| 6 | `apps/web/src/app/workflows/page.tsx` | Workflow execution history |
| 7 | `apps/web/src/app/globals.css` | Tailwind global styles |
| 8 | `apps/web/src/components/layout/sidebar.tsx` | Sidebar navigation |
| 9 | `apps/web/src/components/layout/header.tsx` | Top header bar |
| 10 | `apps/web/src/components/layout/shell.tsx` | Dashboard shell wrapper |
| 11 | `apps/web/src/components/tasks/task-form.tsx` | Task submission form component |
| 12 | `apps/web/src/components/tasks/task-list.tsx` | Task list component |
| 13 | `apps/web/src/components/trace/trace-viewer.tsx` | Agent trace visualization placeholder |
| 14 | `apps/web/src/lib/api-client.ts` | API client (fetch wrapper) |
| 15 | `apps/web/src/lib/query-provider.tsx` | React Query provider |
| 16 | `apps/web/src/hooks/use-tasks.ts` | Task query hooks |
| 17 | `apps/web/src/hooks/use-workflows.ts` | Workflow query hooks |
| 18 | `apps/web/tailwind.config.ts` | Tailwind config |
| 19 | `apps/web/postcss.config.js` | PostCSS config |
| 20 | `apps/web/next.config.js` | Next.js config |
| 21 | `apps/web/package.json` | App package.json |
| 22 | `apps/web/tsconfig.json` | App tsconfig |
| 23 | `apps/web/project.json` | Nx project config |
| 24 | `apps/web/components.json` | shadcn/ui config |

**shadcn/ui primitives (minimal set):**

| # | File Path | Purpose |
|---|-----------|---------|
| 25 | `apps/web/src/components/ui/button.tsx` | Button component |
| 26 | `apps/web/src/components/ui/input.tsx` | Input component |
| 27 | `apps/web/src/components/ui/card.tsx` | Card component |
| 28 | `apps/web/src/components/ui/badge.tsx` | Badge/status component |
| 29 | `apps/web/src/components/ui/textarea.tsx` | Textarea component |
| 30 | `apps/web/src/components/ui/select.tsx` | Select component |

---

## Phase 7: Infrastructure & CI/CD

**Goal:** Docker Compose, observability setup, GitHub Actions.  
**Complexity:** Medium  
**Dependencies:** Phase 1, Phase 3  

**Docker / Dev Env:**

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `docker-compose.yml` | Postgres, Temporal, pgvector |
| 2 | `docker/api.Dockerfile` | API Dockerfile |
| 3 | `docker/web.Dockerfile` | Web Dockerfile |
| 4 | `docker/workers.Dockerfile` | Workers Dockerfile |

**Observability:**

| # | File Path | Purpose |
|---|-----------|---------|
| 5 | `libs/infra/telemetry/src/index.ts` | Barrel export |
| 6 | `libs/infra/telemetry/src/tracing.ts` | OpenTelemetry bootstrap |
| 7 | `libs/infra/telemetry/src/langfuse.ts` | Langfuse integration placeholder |
| 8 | `libs/infra/telemetry/src/logger.ts` | Structured logger (pino-based) |
| 9 | `libs/infra/telemetry/package.json` | Lib package.json |
| 10 | `libs/infra/telemetry/tsconfig.json` | Lib tsconfig |

**Logging:**

| # | File Path | Purpose |
|---|-----------|---------|
| 11 | `libs/infra/logging/src/index.ts` | Barrel export |
| 12 | `libs/infra/logging/src/logger.service.ts` | NestJS logger service |
| 13 | `libs/infra/logging/package.json` | Lib package.json |
| 14 | `libs/infra/logging/tsconfig.json` | Lib tsconfig |

**CI/CD:**

| # | File Path | Purpose |
|---|-----------|---------|
| 15 | `.github/workflows/ci.yml` | Lint + typecheck + test pipeline |
| 16 | `.github/workflows/build.yml` | Docker build pipeline |
| 17 | `.github/workflows/deploy.yml` | Deploy placeholder (Cloud Run) |

---

## Summary

| Phase | Files | Complexity | Parallel? |
|-------|-------|------------|-----------|
| 1. Monorepo Foundation | 13 | Medium | — |
| 2. Shared Contracts | 20 | Low-Medium | — |
| 3. Backend API | 36 | High | With Phase 4 |
| 4. Agent Layer + MCP | 29 | High | With Phase 3 |
| 5. Temporal Orchestration | 10 | Medium-High | After 3+4 |
| 6. Frontend | 30 | High | After 3 |
| 7. Infra + CI/CD | 17 | Medium | After 1+3 |
| **Total** | **~155** | | |

---

## Recommended Execution Order

1. **Phase 1** → foundation everything else builds on
2. **Phase 2** → shared contracts needed by backend + agents
3. **Phase 3 + Phase 4** (parallel) → backend API and agent layer are independent
4. **Phase 7** (observability libs only) → needed by Phase 5
5. **Phase 5** → wires agents into workflow
6. **Phase 6** → frontend consumes API
7. **Phase 7** (Docker + CI) → wraps everything up

---

## Notes & Decisions to Confirm

- **Node version:** 20 LTS assumed
- **Nx version:** Latest (v19+)
- **Next.js:** 14+ with App Router
- **NestJS:** v10+
- **Temporal SDK:** `@temporalio/worker` + `@temporalio/client`
- **shadcn/ui:** Only essential primitives (button, input, card, badge, textarea, select) — more added as needed
- **Auth:** Placeholder only (no real IdP wiring), JWT structure ready
- **pgvector:** Extension enabled in schema, no embedding logic yet
- **A2A / Google ADK:** Interface placeholders only, no implementation
