# Continue: Address Scaffolding Review Findings

## Context

I'm building the **AI SDLC Assistant Platform** — an Nx monorepo at `c:\Users\VantawlL\projects\ai-sdlc-assistant-platform`.

**All 7 phases are complete and the application is running.** A senior tech lead review was performed and is documented at `docs/scaffolding-full-review.md`. This prompt covers the remediation work identified in that review.

**Already completed:**

- **Phase 1:** Monorepo foundation (Nx, pnpm workspace, tsconfig, eslint, prettier, husky, lint-staged)
- **Phase 2:** Shared contracts & types (`libs/shared/types`, `libs/shared/schemas`, `libs/shared/constants`, `libs/shared/prompts`)
- **Phase 2B:** Observability libs (`libs/infra/telemetry` with pino/OTel/Langfuse, `libs/infra/logging` with NestJS adapter)
- **Phase 3:** Backend API (`apps/api` with NestJS+Fastify, `libs/infra/database` with Prisma, `libs/infra/auth`, `libs/infra/governance`)
- **Phase 4:** Agent Layer + MCP + Evaluations (`libs/agents/core`, `libs/agents/{planner,retriever,reviewer,architecture,implementor}`, `libs/mcp`, `libs/evaluations`, `libs/agents/a2a`, `libs/agents/adk`)
- **Phase 5:** Temporal Workflow Orchestration (`apps/workers` with Temporal worker, SDLC workflow with approval gate, all agent activities, health probe; API wired to Temporal client)
- **Phase 6:** Frontend (Next.js 14 app with dashboard shell, task submission, workflow trace view, SSE streaming, dark/light theme, shadcn/ui components)
- **Phase 7:** Docker Compose (Postgres 15 + pgvector, Temporal, Temporal UI), multi-stage Dockerfiles for all apps, `.dockerignore`, GitHub Actions CI/CD (ci.yml, build.yml, deploy.yml)

The full review report is at `docs/scaffolding-full-review.md`.

## Key Conventions Established

- **Package naming:** `@ai-sdlc/<scope>-<name>` (e.g., `@ai-sdlc/shared-types`, `@ai-sdlc/infra-telemetry`)
- **Path aliases** in `tsconfig.base.json`: `@ai-sdlc/shared/types`, `@ai-sdlc/shared/schemas`, `@ai-sdlc/shared/constants`, `@ai-sdlc/shared/prompts`, `@ai-sdlc/infra/telemetry`, `@ai-sdlc/infra/logging`, `@ai-sdlc/infra/auth`, `@ai-sdlc/infra/database`, `@ai-sdlc/infra/governance`, `@ai-sdlc/agents/core`, `@ai-sdlc/agents/planner`, `@ai-sdlc/agents/retriever`, `@ai-sdlc/agents/reviewer`, `@ai-sdlc/agents/architecture`, `@ai-sdlc/agents/implementor`, `@ai-sdlc/agents/a2a`, `@ai-sdlc/agents/adk`, `@ai-sdlc/mcp`, `@ai-sdlc/evaluations` (use `./` prefix, no `baseUrl`)
- **All libs use** `"type": "module"` with `.js` extensions in imports
- **ESLint** uses `@nx/eslint-plugin@19.8.0`, plugin declared as `"@nx"` in `.eslintrc.json`
- **Nx version:** 19.8.0
- **TypeScript:** 5.5.4
- **Node:** 20+
- **pnpm:** 9.12.3
- **Structured logging:** Use `PinoLogger` (from `@ai-sdlc/infra-logging`) injected via NestJS DI; never use `console.*`

## Existing Architecture Summary

### Apps

| App            | Port          | Purpose                                           |
| -------------- | ------------- | ------------------------------------------------- |
| `apps/api`     | 3000          | NestJS + Fastify backend API                      |
| `apps/web`     | 4200          | Next.js 14 frontend (proxies `/api/*` to backend) |
| `apps/workers` | 8081 (health) | Temporal worker (polls `ai-sdlc-tasks` queue)     |

### Key Infrastructure Details

- **Database:** PostgreSQL 15 with pgvector extension, managed via Prisma (`libs/infra/database`)
- **Workflow engine:** Temporal (address configurable via `TEMPORAL_ADDRESS` env var, default `localhost:7233`)
- **Auth:** Placeholder JWT guard (`libs/infra/auth`) — not enforcing yet
- **Rate limiting:** In-memory via `@fastify/rate-limit`
- **SSE:** Real-time workflow updates streamed from API to frontend
- **CORS:** API allows `http://localhost:4200` (configurable via `CORS_ORIGIN` env var)

### Key File Locations

| Concern                 | File                                              |
| ----------------------- | ------------------------------------------------- |
| Shared TypeScript types | `libs/shared/types/src/`                          |
| Zod env schema          | `libs/shared/schemas/src/env.schema.ts`           |
| Prisma schema           | `libs/infra/database/prisma/schema.prisma`        |
| API bootstrap           | `apps/api/src/main.ts`                            |
| API app module          | `apps/api/src/app.module.ts`                      |
| Tasks service           | `apps/api/src/tasks/tasks.service.ts`             |
| Workflows service       | `apps/api/src/workflows/workflows.service.ts`     |
| Workflows controller    | `apps/api/src/workflows/workflows.controller.ts`  |
| Evaluations service     | `apps/api/src/evaluations/evaluations.service.ts` |
| Frontend API client     | `apps/web/src/lib/api-client.ts`                  |
| Frontend hooks          | `apps/web/src/hooks/`                             |
| Zustand task store      | `apps/web/src/stores/task.store.ts`               |
| Workers main            | `apps/workers/src/main.ts`                        |
| Workers build config    | `apps/workers/package.json`                       |
| Env example             | `.env.example`                                    |

## Task: Address Scaffolding Review Findings

**Goal:** Fix all issues identified in `docs/scaffolding-full-review.md`, ordered by priority. Read the full review file before beginning — it contains exact code snippets showing the current (broken) state alongside the intended fix.

---

## P0 Fixes — Fix First (Correctness Blockers)

### Fix 1 — `peerDependencies` → `dependencies` in Application Packages

**Files to edit:** `apps/api/package.json`, `apps/workers/package.json`

Both application `package.json` files declare workspace lib references under `peerDependencies`. Applications are not libraries; they sit at the top of the dependency graph. This is semantically wrong and will cause resolution failures in isolated Docker build layers that run `pnpm install --prod`.

**Action:** Move all `@ai-sdlc/*` workspace references from `peerDependencies` to `dependencies` in both files. Verify no `peerDependencies` block remains in either file after the change.

---

### Fix 2 — Add `'reviewer'` to `UserRole` TypeScript Type

**File to edit:** `libs/shared/types/src/user.ts`

The Prisma `Role` enum has `ADMIN, DEVELOPER, REVIEWER, VIEWER` but the TypeScript `UserRole` union type is `'admin' | 'developer' | 'viewer'` — it is missing `'reviewer'`. Any Prisma query returning a user with role `REVIEWER` will fail type checks or produce runtime errors.

**Action:** Add `'reviewer'` to the `UserRole` union type. Also verify the corresponding Zod schema in `libs/shared/schemas/src/` (if one exists) is updated to match.

---

### Fix 3 — Add `PENDING` and `CANCELLED` to Prisma `AgentExecutionStatus` Enum

**Files to edit:** `libs/infra/database/prisma/schema.prisma`

The TypeScript/Zod type has 5 values (`pending, running, completed, failed, cancelled`) but the Prisma enum only has `RUNNING, COMPLETED, FAILED`. Inserting a row with status `PENDING` or `CANCELLED` will cause a Prisma runtime error.

**Action:**

1. Add `PENDING` and `CANCELLED` to the `AgentExecutionStatus` enum in `schema.prisma`
2. Create a Prisma migration: `pnpm nx run infra-database:prisma-migrate -- --name add_agent_execution_status_values`
3. Confirm the TypeScript type and the Zod schema in `libs/shared/schemas/` still map correctly (they should, since the TS/Zod side already has all 5 values)

---

## P1 Fixes — High Priority (Feature Correctness)

### Fix 4 — Add Approval/Rejection Endpoints to `WorkflowsController`

**File to edit:** `apps/api/src/workflows/workflows.controller.ts`

The `WorkflowsService` has `sendApproval()` and `sendRejection()` methods, but no controller routes expose them. The frontend has no working path to approve or reject a workflow.

**Action:** Add two POST routes:

```typescript
@Post(':id/approve')
async approve(
  @Param('id') id: string,
  @Body(new ZodValidationPipe(ApproveWorkflowSchema)) body: { approvedBy: string; comments?: string }
) {
  return this.workflowsService.sendApproval(id, body.approvedBy, body.comments);
}

@Post(':id/reject')
async reject(
  @Param('id') id: string,
  @Body(new ZodValidationPipe(RejectWorkflowSchema)) body: { rejectedBy: string; reason: string }
) {
  return this.workflowsService.sendRejection(id, body.rejectedBy, body.reason);
}
```

Also add `ApproveWorkflowSchema` and `RejectWorkflowSchema` to `libs/shared/schemas/src/workflow.schemas.ts` (or equivalent schema file).

---

### Fix 5 — Fix Frontend Approval Hook (GET → POST)

**File to edit:** `apps/web/src/hooks/use-workflows.ts`

`useApproveWorkflow` calls `apiClient.get('/workflows/${workflowId}/approve')`. Using GET for a state-changing mutation is a REST antipattern — it is cacheable, replayable by browser prefetch, and semantically wrong.

**Action:** Change to `apiClient.post<void>('/workflows/${workflowId}/approve', { approvedBy: 'current-user' })`. Similarly audit `useRejectWorkflow` if it exists and apply the same fix. The path must match the backend route added in Fix 4.

---

### Fix 6 — Wire PrismaService into `TasksService`

**Files to edit:** `apps/api/src/tasks/tasks.service.ts`, `apps/api/src/tasks/tasks.module.ts`

All API services (`TasksService`, `WorkflowsService`, `EvaluationsService`) use `Map<string, T>()` in-memory storage. `PrismaService` from `@ai-sdlc/infra-database` exists but is not imported anywhere in the API.

**Action:**

1. Import `DatabaseModule` (or `PrismaService` directly) from `@ai-sdlc/infra-database` into `TasksModule`
2. Inject `PrismaService` into `TasksService`
3. Replace the `Map`-based CRUD with actual Prisma calls (`prisma.task.create`, `prisma.task.findMany`, `prisma.task.findUnique`, `prisma.task.update`)
4. Ensure the Prisma `Task` model fields align with the DTO schema — flag any mismatches
5. Leave `WorkflowsService` and `EvaluationsService` on in-memory storage for now (document this in comments)

---

## P2 Fixes — Medium Priority (Quality & Developer Experience)

### Fix 7 — Add Request Timeout to Frontend API Client

**File to edit:** `apps/web/src/lib/api-client.ts`

`fetch` calls have no `AbortController` timeout. A hung backend will cause the UI to spin indefinitely.

**Action:** Wrap every `fetch` call with an `AbortController` timeout (default 30 seconds, configurable via a constant). Pattern:

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
try {
  const response = await fetch(url, { ...options, signal: controller.signal });
  // ...
} finally {
  clearTimeout(timeout);
}
```

---

### Fix 8 — Fix EventSource Reconnection Logic

**File to edit:** `apps/web/src/hooks/use-event-stream.ts`

On `onerror`, the code explicitly calls `.close()` on the EventSource and never reconnects. The browser's native SSE auto-reconnect is intentionally disabled, leaving the stream permanently broken after any error.

**Action:** Remove the explicit `.close()` call inside the `onerror` handler so the browser's built-in reconnection logic can operate. If exponential backoff is preferred, implement it; otherwise document that native browser reconnection is relied upon.

---

### Fix 9 — Replace `console.*` with Structured Logger

**Files to edit:** `apps/api/src/workflows/workflows.service.ts`, `apps/workers/src/main.ts`

ESLint config has `"no-console": "warn"` but these files use `console.log` and `console.warn` directly. Production apps must use the structured Pino logger.

**Action:**

- In `WorkflowsService`: inject `Logger` from `@nestjs/common` (or the `PinoLogger` from `@ai-sdlc/infra-logging`) and replace all `console.*` calls
- In `workers/src/main.ts`: import the pino logger from `@ai-sdlc/infra-telemetry` and replace all `console.*` calls
- Ensure the replacement calls pass structured context objects (e.g., `logger.info({ address }, 'Connected to Temporal')` not `logger.info('Connected to Temporal at ' + address)`)

---

### Fix 10 — Fix Workers Build Script

**File to edit:** `apps/workers/package.json`

The build script is `"build": "tsc -p tsconfig.json"` but `tsconfig.json` has `"noEmit": true`. A `tsconfig.build.json` file exists specifically for emit but is not referenced.

**Action:** Change the build script to `"build": "tsc -p tsconfig.build.json"`. Verify `tsconfig.build.json` has `"noEmit": false`, correct `outDir`, and excludes test files.

---

### Fix 11 — Fix PORT / CORS_ORIGIN Mismatch

**Files to edit:** `.env.example`, `apps/api/src/main.ts`

Multiple config sources disagree on the API port and CORS origin:

| Source                      | PORT   | CORS Origin                        |
| --------------------------- | ------ | ---------------------------------- |
| `.env.example`              | `3001` | (not defined)                      |
| `EnvSchema` default         | `3000` | —                                  |
| `main.ts` code fallback     | `3000` | `http://localhost:3001` (wrong)    |
| `next.config.mjs` API proxy | —      | proxies to `http://localhost:3000` |

**Action:**

1. In `.env.example`: set `PORT=3000` (or whichever port is canonical) to align with all other defaults
2. In `.env.example`: add `CORS_ORIGIN=http://localhost:4200`
3. In `apps/api/src/main.ts`: change the hardcoded CORS fallback from `http://localhost:3001` to `http://localhost:4200`
4. Confirm `next.config.mjs` rewrite target matches the canonical API port

---

## P3 Fixes — Low Priority (Polish)

### Fix 12 — Add Root `ErrorBoundary` to Frontend

**Files to edit:** `apps/web/src/app/layout.tsx`, create `apps/web/src/components/error-boundary.tsx`

The frontend has no `ErrorBoundary`. Any uncaught rendering error crashes the full app with a white screen.

**Action:**

1. Create a `<RootErrorBoundary>` class component (React error boundaries must be class components)
2. Render a user-friendly fallback UI on error (e.g., "Something went wrong. Please refresh the page.")
3. Wrap the `<Shell>` or root layout children with `<RootErrorBoundary>`

---

### Fix 13 — Resolve Unused Zustand Store

**File:** `apps/web/src/stores/task.store.ts`

`useTaskStore` is defined but never imported anywhere.

**Action (choose one):**

- **Option A (preferred):** Integrate the store into the task list page to manage filter/search state (replace component-local `useState` for filter fields with the Zustand store)
- **Option B:** Delete the file if local state is sufficient. Update any barrel exports.

Document which option was chosen and why in a comment at the top of the store file (Option A) or in the commit message (Option B).

---

### Fix 14 — Remove Global `ZodValidationPipe` Registration or Document Intent

**File to edit:** `apps/api/src/app.module.ts`

```typescript
{ provide: APP_PIPE, useClass: ZodValidationPipe }
```

The global pipe has no schema, so it no-ops and passes everything through. Per-route pipes already handle validation. This is confusing: developers may assume global validation is enforced when it isn't.

**Action (choose one):**

- **Option A:** Remove the `APP_PIPE` registration entirely (per-route pipes are sufficient)
- **Option B:** Add a JSDoc comment explaining why the global pipe is registered (e.g., if it normalizes unknown fields globally)

---

### Fix 15 — Add `prisma migrate deploy` to Deploy Workflow

**File to edit:** `.github/workflows/deploy.yml`

The deploy workflow has no database migration step. First deployment to a fresh environment will fail without manual DB setup.

**Action:** Add a migration step before the Cloud Run deploy step:

```yaml
- name: Run database migrations
  run: pnpm nx run infra-database:prisma-migrate-deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Also add a `prisma-migrate-deploy` target to `libs/infra/database/project.json` if it doesn't exist:

```json
"prisma-migrate-deploy": {
  "executor": "nx:run-commands",
  "options": {
    "command": "pnpm prisma migrate deploy",
    "cwd": "libs/infra/database"
  }
}
```

---

## Verification Checklist

After completing all fixes, verify the following:

| Check                                                   | Command / Method                                     |
| ------------------------------------------------------- | ---------------------------------------------------- |
| TypeScript compiles with no errors                      | `pnpm nx run-many -t typecheck`                      |
| ESLint passes with no warnings                          | `pnpm nx run-many -t lint`                           |
| Unit tests pass                                         | `pnpm nx run-many -t test`                           |
| Workers build emits output                              | `pnpm nx build workers` → check `dist/apps/workers`  |
| Prisma client generates cleanly                         | `pnpm nx run infra-database:prisma-generate`         |
| Prisma migration applies to local DB                    | `pnpm nx run infra-database:prisma-migrate`          |
| API starts and `/health` returns 200                    | `pnpm nx serve api` → `curl localhost:3000/health`   |
| Frontend proxies to API correctly                       | `pnpm nx serve web` → open `localhost:4200`          |
| Approval POST endpoint reachable                        | `curl -X POST localhost:3000/workflows/test/approve` |
| No `console.*` calls remain in api/workers source files | `grep -r "console\." apps/api/src apps/workers/src`  |

## Notes

- Read `docs/scaffolding-full-review.md` in full before starting — it contains the exact current code for each issue
- Fix P0 items first as they are pre-conditions for correct behavior of everything else
- The Prisma migration (Fix 3) requires a running local Postgres instance (`docker compose up -d postgres`)
- Do not refactor beyond what is described — this is remediation, not a new feature phase
- After all fixes are applied, run the full verification checklist and confirm all items pass before closing
