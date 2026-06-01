# AI SDLC Assistant Platform — Phase 1 Implementation

## Context

You are implementing Phase 1 (Monorepo Foundation & Dev Tooling) of the AI SDLC Assistant Platform. This is a production-grade enterprise AI platform that orchestrates multiple AI agents through SDLC workflows using Temporal, LangGraph, and MCP.

## Project Summary

A web platform where developers submit engineering tasks (e.g., "Implement dark mode support across all MFEs") and AI agents collaborate through a Temporal workflow (Planner → Retriever → Architecture Review → Approval Gate → Implementor → Reviewer) to produce structured, reviewable outputs.

## Tech Stack (Full Platform)

- **Monorepo:** Nx + pnpm
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind, shadcn/ui, React Query, Zustand
- **Backend:** NestJS, Fastify adapter, TypeScript
- **AI/Agents:** LangGraphJS, MCP, A2A/ADK placeholders
- **Workflow:** Temporal
- **Database:** PostgreSQL + pgvector, Prisma
- **Observability:** OpenTelemetry, Langfuse, Pino
- **Validation:** Zod
- **Auth:** Placeholder (JWT/RBAC-ready)
- **Infra:** Docker Compose (Postgres + Temporal only, NO Redis), pnpm, ESLint, Prettier, Husky, lint-staged
- **Testing:** Vitest, Playwright, Supertest
- **Deployment:** Cloud Run / Kubernetes friendly, 12-factor

## Version Pinning

| Dependency | Version |
|---|---|
| Node.js | 20 LTS |
| pnpm | 9.x |
| Nx | 19.x+ |
| Next.js | 14.x+ |
| NestJS | 10.x+ |
| TypeScript | 5.4+ |
| Temporal SDK | `@temporalio/worker` 1.x |
| LangGraph.js | 0.2.x+ |
| PostgreSQL | 15+ |
| pgvector | 0.5+ |
| Prisma | 5.x+ |
| Playwright | 1.40+ |
| Vitest | 1.x+ |
| Pino | 8.x+ |

## Phase 1 Deliverables

**Goal:** Nx workspace, root configs, dev environment basics.

Generate the following 14 files:

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `package.json` | Root package.json with pnpm workspace scripts |
| 2 | `nx.json` | Nx workspace configuration (targetDefaults for build pipeline ordering) |
| 3 | `pnpm-workspace.yaml` | pnpm workspace definition |
| 4 | `tsconfig.base.json` | Base TypeScript config with path aliases for all libs |
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

## Nx Plugins Required

| Plugin | Purpose |
|--------|---------|
| `@nx/nest` | NestJS app scaffolding + build targets |
| `@nx/next` | Next.js app scaffolding + build targets |
| `@nx/js` | Library scaffolding (shared libs) |
| `@nx/vite` | Vitest integration for unit tests |
| `@nx/eslint` | Workspace-wide linting |

## Path Aliases to Configure in tsconfig.base.json

These will be needed by subsequent phases:

```
@ai-sdlc/shared/types       → libs/shared/types/src
@ai-sdlc/shared/schemas     → libs/shared/schemas/src
@ai-sdlc/shared/constants   → libs/shared/constants/src
@ai-sdlc/shared/prompts     → libs/shared/prompts/src
@ai-sdlc/infra/telemetry    → libs/infra/telemetry/src
@ai-sdlc/infra/logging      → libs/infra/logging/src
@ai-sdlc/infra/auth         → libs/infra/auth/src
@ai-sdlc/infra/database     → libs/infra/database/src
@ai-sdlc/infra/governance   → libs/infra/governance/src
@ai-sdlc/agents/core        → libs/agents/core/src
@ai-sdlc/agents/planner     → libs/agents/planner/src
@ai-sdlc/agents/retriever   → libs/agents/retriever/src
@ai-sdlc/agents/reviewer    → libs/agents/reviewer/src
@ai-sdlc/agents/architecture → libs/agents/architecture/src
@ai-sdlc/agents/implementor → libs/agents/implementor/src
@ai-sdlc/agents/a2a         → libs/agents/a2a/src
@ai-sdlc/agents/adk         → libs/agents/adk/src
@ai-sdlc/mcp               → libs/mcp/src
@ai-sdlc/evaluations       → libs/evaluations/src
```

## .env.example Should Include

```
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_sdlc?schema=public

# Temporal
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default

# AI Providers
GOOGLE_AI_API_KEY=
ANTHROPIC_API_KEY=

# Langfuse (observability)
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_BASE_URL=http://localhost:3030

# App
API_PORT=3001
WEB_PORT=3000
NODE_ENV=development
```

## Makefile Targets

```
install    → pnpm install
docker     → docker compose up -d
migrate    → pnpm prisma migrate dev (in libs/infra/database)
seed       → pnpm prisma db seed (in libs/infra/database)
dev        → nx run-many -t serve (api + web)
lint       → nx run-many -t lint
test       → nx run-many -t test
typecheck  → nx run-many -t typecheck
clean      → rm -rf node_modules dist tmp
```

## Architectural Constraints

1. **No Redis** — rate limiting uses in-memory Fastify throttle
2. **pnpm only** — no npm or yarn
3. **Strict TypeScript** — `strict: true` in base config
4. **Nx project inference** — prefer `project.json` over `workspace.json`
5. **Do NOT generate app/lib source code** — Phase 1 is infrastructure only. Subsequent phases create the actual apps and libs.

## Coding Standards

- Strict TypeScript
- Clean naming
- Minimal comments (code should be self-explanatory)
- No magic strings
- No unnecessary abstractions

## Instructions

1. Generate all 14 files with complete, production-quality content
2. Ensure internal consistency (package names, paths, versions all align)
3. Make everything runnable — after `pnpm install`, the workspace should initialize without errors
4. README should clearly explain the project structure and how to get started
5. Do NOT create placeholder app or lib directories — just the root infrastructure