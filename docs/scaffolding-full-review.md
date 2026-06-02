# AI SDLC Assistant Platform — Scaffolding Implementation Review

**Reviewer:** Senior Tech Lead  
**Date:** 2026-06-01  
**Scope:** Full scaffolding implementation review against `IMPLEMENTATION_PLAN_V4_REVISED_FINAL.md`  
**Verdict:** ✅ Solid scaffolding with actionable improvements needed before production work begins

---

## Executive Summary

The scaffolding is **well-executed overall**. The monorepo structure, shared contracts, orchestration layers, and agent architecture are all present and correctly wired. The codebase demonstrates good separation of concerns, consistent patterns, and adherence to the implementation plan.

However, several issues need attention — ranging from critical dependency configuration bugs to type mismatches and missing features. None are blockers for continued development, but they should be addressed in the next iteration.

| Category             | Rating     | Notes                                                       |
| -------------------- | ---------- | ----------------------------------------------------------- |
| Completeness vs Plan | ⭐⭐⭐⭐☆  | ~95% of planned files present                               |
| Correctness          | ⭐⭐⭐☆☆   | Type/enum mismatches, dependency config bugs                |
| Architecture         | ⭐⭐⭐⭐⭐ | Clean layering, proper orchestration ownership              |
| DRYness              | ⭐⭐⭐⭐☆  | Good reuse via shared libs; minor redundancies              |
| Security             | ⭐⭐⭐☆☆   | CORS, throttle, Zod validation present; auth is placeholder |
| Best Practices       | ⭐⭐⭐⭐☆  | Structured logging, strict TS, ESM modules                  |

---

## 🔴 Critical Issues (Fix Before Next Phase)

### 1. `peerDependencies` Misuse in Application Packages

**Affected:** `apps/api/package.json`, `apps/workers/package.json`

Both application packages declare workspace libs as `peerDependencies`:

```json
// apps/api/package.json
"peerDependencies": {
  "@ai-sdlc/infra-auth": "workspace:*",
  "@ai-sdlc/infra-database": "workspace:*",
  "@ai-sdlc/shared-types": "workspace:*"
}
```

**Problem:** Applications are not libraries — they are the top of the dependency graph. `peerDependencies` in apps are semantically wrong and will cause resolution failures in production Docker builds (where `--prod` flags or non-hoisted setups won't install them).

**Fix:** Move all workspace lib references to `dependencies`:

```json
"dependencies": {
  "@ai-sdlc/infra-database": "workspace:*",
  "@ai-sdlc/shared-types": "workspace:*",
  // ...
}
```

**Why it works now:** pnpm hoists everything in development. This bug is latent until you do a production `pnpm install --prod` or run in an isolated Docker layer.

---

### 2. UserRole Type vs Prisma Enum Mismatch

**Files:** `libs/shared/types/src/user.ts` ↔ `libs/infra/database/prisma/schema.prisma`

| Source           | Values                               |
| ---------------- | ------------------------------------ |
| TypeScript types | `'admin' \| 'developer' \| 'viewer'` |
| Prisma enum      | `ADMIN, DEVELOPER, REVIEWER, VIEWER` |

**Impact:** The `REVIEWER` role exists in the database but has no TypeScript representation. Any Prisma query returning a user with role `REVIEWER` will fail type checks or produce runtime surprises.

**Fix:** Add `'reviewer'` to `UserRole` type.

---

### 3. AgentExecutionStatus Count Mismatch

**Files:** `libs/shared/types/src/agent.ts` ↔ `prisma/schema.prisma`

| Source         | Values                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| TypeScript/Zod | `'pending' \| 'running' \| 'completed' \| 'failed' \| 'cancelled'` (5) |
| Prisma enum    | `RUNNING, COMPLETED, FAILED` (3)                                       |

**Impact:** If a workflow marks an execution as `pending` or `cancelled`, the Prisma insert will fail with an invalid enum value.

**Fix:** Add `PENDING` and `CANCELLED` to Prisma's `AgentExecutionStatus` enum (and create a migration).

---

### 4. Workflow Approval Uses GET for State Mutation (Frontend)

**File:** `apps/web/src/hooks/use-workflows.ts`

```typescript
mutationFn: (workflowId: string) => apiClient.get<void>(`/workflows/${workflowId}/approve`),
```

**Problem:** Using GET for a state-changing operation is a REST antipattern. It's cacheable, replayable by browser prefetch, and semantically incorrect. There's also no matching endpoint on the backend — the API has `sendApproval()` but no route for `GET /workflows/:id/approve`.

**Fix:** Change to `apiClient.post('/workflows/${workflowId}/approve', { approvedBy: 'user' })` and add the corresponding `@Post(':id/approve')` endpoint to `WorkflowsController`.

---

## 🟠 Medium Issues

### 5. In-Memory Data Store in API (No Persistence)

**Files:** `apps/api/src/tasks/tasks.service.ts`, `workflows.service.ts`, `evaluations.service.ts`

All services use `Map<string, T>()` for storage. While acceptable for POC, this means:

- All data lost on server restart
- No queryable history for the golden demo
- PrismaService exists in `libs/infra/database/` but is never imported

**Recommendation:** Wire up PrismaService for at least the `TasksService` to demonstrate the golden path end-to-end. The Prisma schema is ready.

---

### 6. Missing Backend Approval Endpoint

The `WorkflowsService` has `sendApproval()` and `sendRejection()` methods, but `WorkflowsController` doesn't expose them as endpoints. The frontend has no way to approve a workflow.

**Fix:** Add routes:

```typescript
@Post(':id/approve')
approve(@Param('id') id: string, @Body() body: { approvedBy: string; comments?: string }) { ... }

@Post(':id/reject')
reject(@Param('id') id: string, @Body() body: { rejectedBy: string; reason: string }) { ... }
```

---

### 7. No Request Timeout in Frontend API Client

**File:** `apps/web/src/lib/api-client.ts`

The `fetch` calls have no `AbortController` timeout. A hung backend will cause the UI to spin indefinitely.

**Fix:** Add a configurable timeout (e.g., 30s):

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30_000);
const response = await fetch(url, { ...options, signal: controller.signal });
clearTimeout(timeout);
```

---

### 8. EventSource Lacks Reconnection Logic

**File:** `apps/web/src/hooks/use-event-stream.ts`

On `onerror`, the EventSource is closed permanently with no retry. Browser SSE has auto-reconnect built in, but the code explicitly calls `.close()` on error and never reconnects.

**Fix:** Remove the explicit `.close()` on error (let browser handle reconnection), or implement exponential backoff retry logic.

---

### 9. Unused Zustand Store

**File:** `apps/web/src/stores/task.store.ts`

`useTaskStore` is defined but never imported anywhere in the codebase. The task list and filtering logic lives entirely in React Query hooks and component state.

**Decision:** Either integrate it into the task list page (for filter/search state) or remove it to reduce dead code.

---

### 10. `console.log` / `console.warn` in Production Code

**Files:** `apps/api/src/workflows/workflows.service.ts`, `apps/workers/src/main.ts`

The ESLint config has `"no-console": "warn"` but these files bypass it. Production apps should use the structured logger.

**Fix:** Replace:

```typescript
// Before
console.log(`Connected to Temporal at ${TEMPORAL_ADDRESS}`);
// After
logger.info({ address: TEMPORAL_ADDRESS }, 'Connected to Temporal');
```

---

### 11. Workers Build Configuration Inconsistency

**File:** `apps/workers/package.json`

```json
"build": "tsc -p tsconfig.json"
```

But `tsconfig.json` likely extends `tsconfig.base.json` which has `"declaration": true` but the base may not have `outDir` set. The `tsconfig.build.json` exists but isn't referenced in the build script.

**Fix:** Change build script to `"build": "tsc -p tsconfig.build.json"`.

---

### 12. PORT / CORS_ORIGIN Mismatch Between Config Sources

**Files:** `.env.example`, `apps/api/src/main.ts`, `libs/shared/schemas/src/env.schema.ts`, `apps/web/next.config.mjs`

Multiple sources disagree on the API port and CORS origin:

| Source                      | PORT   | CORS Origin                        |
| --------------------------- | ------ | ---------------------------------- |
| `.env.example`              | `3001` | (not defined)                      |
| `EnvSchema` default         | `3000` | —                                  |
| `main.ts` code fallback     | `3000` | `http://localhost:3001`            |
| `next.config.mjs` API proxy | —      | proxies to `http://localhost:3000` |
| Phase-7 docs (intended)     | —      | `http://localhost:4200`            |

**Impact:** If a developer copies `.env.example` → `.env`, the API runs on port 3001 but the frontend proxy targets port 3000. The app breaks out of the box. Additionally, the CORS origin default (`localhost:3001`) is the API's own address, not the frontend's (`localhost:4200`).

**Fix:**

- `.env.example`: Change `PORT=3000` (or add `NEXT_PUBLIC_API_URL=http://localhost:3001` if 3001 is intentional)
- `main.ts`: Change CORS default to `http://localhost:4200`
- Add `CORS_ORIGIN=http://localhost:4200` to `.env.example`

---

### 13. Docker Compose Temporal Shares Postgres with App

Both Temporal and the application use the same Postgres instance (`ai_sdlc` DB). This is fine for local dev but creates coupling.

**Recommendation:** Document this as a dev-only convenience. For staging/production, Temporal should have its own datastore.

---

## 🟡 Low-Priority Issues

### 14. Global ZodValidationPipe Conflicts with Per-Route Pipes

**File:** `apps/api/src/app.module.ts`

```typescript
{ provide: APP_PIPE, useClass: ZodValidationPipe }
```

The global pipe has no schema (`this.schema` is `undefined`), so it passes everything through. But controllers also apply per-route pipes:

```typescript
@Body(new ZodValidationPipe(CreateTaskDtoSchema)) createTaskDto: ...
```

This double-pipe is harmless (global pipe no-ops) but confusing. Either remove the global pipe registration or make it schema-aware via metadata.

---

### 15. Hardcoded Golden Demo Defaults in Workflow

**File:** `apps/workers/src/workflows/sdlc-task.workflow.ts`

```typescript
const taskTitle = input.taskTitle ?? 'Implement dark mode support across all MFEs';
```

Default values for the golden demo scenario are baked into the workflow definition. This is fine for the POC phase but should be removed before real agent integration.

---

### 16. No Error Boundaries in React

The frontend has no `ErrorBoundary` component. Any uncaught rendering error crashes the entire app.

**Recommendation:** Add a root `ErrorBoundary` wrapping `<Shell>` in `layout.tsx`.

---

### 17. Temporal Connection Failure is Non-Fatal in API

**File:** `apps/api/src/workflows/workflows.service.ts`

```typescript
} catch (err) {
  console.warn('Failed to connect to Temporal... Falling back to mock mode.');
}
```

The API silently degrades if Temporal is unavailable. This is good for development but should be configurable — in production, a failed Temporal connection should be a startup error.

**Recommendation:** Add `TEMPORAL_REQUIRED=true` env var that makes this a fatal error.

---

### 18. No Database Migration in CI/CD

**File:** `.github/workflows/deploy.yml`

The deploy workflow has no `prisma migrate deploy` step. First deployment to a fresh environment will fail without manual DB setup.

---

## ✅ What's Done Well

### Architecture & Patterns

- **Orchestration ownership comments** (`// Orchestration owner: Temporal`) — excellent for maintaining clarity as the codebase grows
- **Clean layering:** shared types → infra libs → agents → apps with no circular dependencies
- **Registry pattern** used consistently for MCP providers, evaluators, governance policies
- **Result<T, E> type** for typed error handling — good foundation for agent error propagation
- **Zod schemas aligned with TypeScript types** — single source of truth for validation

### Infrastructure

- **Multi-stage Dockerfiles** with proper layering (deps → build → runtime)
- **Workers Dockerfile uses `node:20-slim`** instead of alpine — correct for Temporal native bindings
- **Non-root users** in production images
- **pgvector extension** pre-configured in Prisma schema for future RAG support
- **docker-compose** correctly sequences Postgres → Temporal → Temporal UI with health checks

### Frontend

- **Next.js App Router** with proper server/client component separation
- **Design token strategy** via CSS custom properties → Tailwind → shadcn/ui (scalable)
- **React Query** with 5s polling for workflow status — appropriate for POC
- **API proxy via `next.config.mjs` rewrites** — avoids CORS in development

### Development Experience

- **Nx workspace** with proper `targetDefaults` for build dependency ordering
- **ESLint + Prettier + Husky + lint-staged** pipeline configured
- **Vitest** for unit tests across all packages
- **Affected-only CI** via `nx affected` — efficient pipeline scaling
- **TypeScript strict mode** with `noImplicitOverride`, `noPropertyAccessFromIndexSignature`

### Agent Layer

- **BaseAgent interface** with `createGraph()` + `invoke()` — clean contract
- **LangGraph integration** working with proper state annotations
- **Golden demo stub data** in all agents — system is testable end-to-end without LLM keys
- **Graph-builder utility** provides consistent base state shape
- **Tool-binder** abstracts MCP tool attachment — ready for real provider integration

---

## DRYness & Redundancy Analysis

| Pattern                       | Assessment                                                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent stubs (5 agents)        | Appropriately similar — each owns its state shape. Could extract a `createStubAgent()` factory but complexity doesn't warrant it yet                                                                          |
| Task/Workflow schemas ↔ types | Slight redundancy (type defined twice: once as TS interface, once as Zod schema). This is **intentional** — Zod schemas are runtime validators, TS types are compile-time. The plan explicitly calls this out |
| Dockerfile COPY blocks        | Repeated across 3 Dockerfiles. Could extract a shared base image but premature for 3 apps                                                                                                                     |
| Activity files                | Each is 15-25 lines with identical structure. A `createAgentActivity(Agent)` factory would DRY this but at the cost of readability. **Leave as-is**                                                           |

**Verdict:** No actionable DRY violations. The codebase is appropriately explicit for a scaffolding phase.

---

## Completeness Checklist (vs Implementation Plan)

| Phase                              | Status      | Missing Items                                       |
| ---------------------------------- | ----------- | --------------------------------------------------- |
| 1. Monorepo Foundation             | ✅ Complete | —                                                   |
| 2. Shared Contracts                | ✅ Complete | —                                                   |
| 2B. Observability Libs             | ✅ Complete | —                                                   |
| 3. Backend API                     | ⚠️ 95%      | Approval endpoint missing; PrismaService not wired  |
| 4. Agent Layer + MCP + Evaluations | ✅ Complete | —                                                   |
| 5. Temporal Orchestration          | ✅ Complete | —                                                   |
| 6. Frontend                        | ⚠️ 90%      | Workflows page incomplete; approval flow broken     |
| 7. Infra + CI/CD                   | ✅ Complete | Deploy workflow is placeholder (acceptable for POC) |

---

## Recommended Priority Order for Fixes

| Priority | Issue                                                           | Effort |
| -------- | --------------------------------------------------------------- | ------ |
| P0       | Fix `peerDependencies` → `dependencies` in `apps/` packages     | 15 min |
| P0       | Add `PENDING`/`CANCELLED` to Prisma `AgentExecutionStatus` enum | 10 min |
| P0       | Add `'reviewer'` to `UserRole` TypeScript type                  | 5 min  |
| P1       | Add approval/rejection endpoints to `WorkflowsController`       | 30 min |
| P1       | Fix frontend approval hook (GET → POST)                         | 10 min |
| P1       | Wire PrismaService into TasksService                            | 1 hr   |
| P2       | Add request timeout to `api-client.ts`                          | 15 min |
| P2       | Replace `console.*` with structured logger                      | 20 min |
| P2       | Fix workers build script to use `tsconfig.build.json`           | 5 min  |
| P2       | Fix PORT/CORS_ORIGIN mismatch across config sources             | 10 min |
| P3       | Add root ErrorBoundary in frontend                              | 20 min |
| P3       | Remove global ZodValidationPipe or document intent              | 10 min |
| P3       | Complete workflows page                                         | 30 min |
| P3       | Remove or integrate unused Zustand store                        | 10 min |

---

## Security Assessment

| Control                   | Status         | Notes                                            |
| ------------------------- | -------------- | ------------------------------------------------ |
| Input validation (Zod)    | ✅             | Applied at all API boundaries                    |
| CORS                      | ✅             | Configured with specific origin                  |
| Rate limiting             | ✅             | In-memory throttle guard (suitable for POC)      |
| Auth guard                | ⚠️ Placeholder | JWT-ready but not enforcing                      |
| Env validation at startup | ✅             | Fails fast on missing vars                       |
| SQL injection             | ✅             | Prisma parameterizes queries                     |
| XSS                       | ✅             | React auto-escapes; no `dangerouslySetInnerHTML` |
| SSRF                      | ⚠️             | MCP providers don't validate URLs yet            |
| Secrets in code           | ✅             | No hardcoded secrets found                       |

---

## Summary

The scaffolding demonstrates strong architectural decisions and consistent implementation. The golden demo path (task → workflow → agents → approval) is structurally complete. The critical fixes (P0) are all trivial (< 30 min total) and should be resolved immediately. P1 items are needed for the golden demo to work end-to-end through the UI.

**Ready to proceed to real agent integration and database wiring.**
