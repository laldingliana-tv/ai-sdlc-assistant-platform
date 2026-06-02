# Continue: Implement Phase 7 — Infrastructure & CI/CD

## Context

I'm building the **AI SDLC Assistant Platform** — an Nx monorepo at `c:\Users\VantawlL\projects\ai-sdlc-assistant-platform`.

**Already completed:**

- **Phase 1:** Monorepo foundation (Nx, pnpm workspace, tsconfig, eslint, prettier, husky, lint-staged)
- **Phase 2:** Shared contracts & types (`libs/shared/types`, `libs/shared/schemas`, `libs/shared/constants`, `libs/shared/prompts`)
- **Phase 2B:** Observability libs (`libs/infra/telemetry` with pino/OTel/Langfuse, `libs/infra/logging` with NestJS adapter)
- **Phase 3:** Backend API (`apps/api` with NestJS+Fastify, `libs/infra/database` with Prisma, `libs/infra/auth`, `libs/infra/governance`)
- **Phase 4:** Agent Layer + MCP + Evaluations (`libs/agents/core`, `libs/agents/{planner,retriever,reviewer,architecture,implementor}`, `libs/mcp`, `libs/evaluations`, `libs/agents/a2a`, `libs/agents/adk`)
- **Phase 5:** Temporal Workflow Orchestration (`apps/workers` with Temporal worker, SDLC workflow with approval gate, all agent activities, health probe; API wired to Temporal client)
- **Phase 6:** Frontend (Next.js 14 app with dashboard shell, task submission, workflow trace view, SSE streaming, dark/light theme, shadcn/ui components)

The implementation plan is at `docs/IMPLEMENTATION_PLAN_V4_REVISED_FINAL.md`.

## Key Conventions Established

- **Package naming:** `@ai-sdlc/<scope>-<name>` (e.g., `@ai-sdlc/shared-types`, `@ai-sdlc/infra-telemetry`)
- **Path aliases** in `tsconfig.base.json`: `@ai-sdlc/shared/types`, `@ai-sdlc/shared/schemas`, `@ai-sdlc/shared/constants`, `@ai-sdlc/shared/prompts`, `@ai-sdlc/infra/telemetry`, `@ai-sdlc/infra/logging`, `@ai-sdlc/infra/auth`, `@ai-sdlc/infra/database`, `@ai-sdlc/infra/governance`, `@ai-sdlc/agents/core`, `@ai-sdlc/agents/planner`, `@ai-sdlc/agents/retriever`, `@ai-sdlc/agents/reviewer`, `@ai-sdlc/agents/architecture`, `@ai-sdlc/agents/implementor`, `@ai-sdlc/agents/a2a`, `@ai-sdlc/agents/adk`, `@ai-sdlc/mcp`, `@ai-sdlc/evaluations` (use `./` prefix, no `baseUrl`)
- **All libs use** `"type": "module"` with `.js` extensions in imports
- **ESLint** uses `@nx/eslint-plugin@19.8.0`, plugin declared as `"@nx"` in `.eslintrc.json`
- **Nx version:** 19.8.0
- **TypeScript:** 5.5.4
- **Node:** 20+
- **pnpm:** 9.12.3
- **App tsconfig pattern:**
  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "noEmit": true,
      "types": ["vitest/globals", "node"]
    },
    "include": ["src/**/*.ts"],
    "exclude": ["node_modules", "dist"]
  }
  ```
- **App tsconfig.build.json pattern (for emit):**
  ```json
  {
    "extends": "./tsconfig.json",
    "compilerOptions": {
      "noEmit": false,
      "outDir": "../../dist/apps/<name>",
      "rootDir": "src"
    },
    "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
  }
  ```
- **App package.json pattern:**
  ```json
  {
    "name": "@ai-sdlc/<name>",
    "version": "0.0.1",
    "private": true,
    "type": "module"
  }
  ```

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
- **Auth:** Placeholder JWT guard (`libs/infra/auth`)
- **Rate limiting:** In-memory via `@fastify/rate-limit` (no Redis needed)
- **SSE:** Real-time workflow updates streamed from API to frontend
- **CORS:** API allows `http://localhost:4200` (configurable via `CORS_ORIGIN` env var)

### Environment Variables Required

From the shared env schema and app configurations:

| Variable              | Default                 | Used By              |
| --------------------- | ----------------------- | -------------------- |
| `DATABASE_URL`        | —                       | API (Prisma)         |
| `TEMPORAL_ADDRESS`    | `localhost:7233`        | API, Workers         |
| `PORT`                | `3000`                  | API                  |
| `HEALTH_PORT`         | `8081`                  | Workers              |
| `CORS_ORIGIN`         | `http://localhost:4200` | API                  |
| `OPENAI_API_KEY`      | —                       | Agents (LangChain)   |
| `LANGFUSE_PUBLIC_KEY` | —                       | Telemetry (optional) |
| `LANGFUSE_SECRET_KEY` | —                       | Telemetry (optional) |
| `LANGFUSE_BASE_URL`   | —                       | Telemetry (optional) |
| `NODE_ENV`            | `development`           | All                  |
| `NEXT_PUBLIC_API_URL` | `/api`                  | Web                  |

### Existing Makefile Targets

```makefile
install:     pnpm install
docker:      docker compose up -d
migrate:     pnpm nx run infra-database:prisma-migrate
seed:        pnpm nx run infra-database:prisma-seed
dev:         pnpm nx run-many -t serve --projects=api,web
lint:        pnpm nx run-many -t lint
test:        pnpm nx run-many -t test
typecheck:   pnpm nx run-many -t typecheck
clean:       rm -rf node_modules dist tmp .nx
```

## Task: Implement Phase 7 — Infrastructure & CI/CD

**Goal:** Docker Compose for local dev (Postgres + Temporal), Dockerfiles for all apps, GitHub Actions CI/CD pipelines.

### Files to Implement (8 files)

**Docker / Dev Env (5 files):**

| #   | File Path                   | Purpose                                                                    |
| --- | --------------------------- | -------------------------------------------------------------------------- |
| 1   | `docker-compose.yml`        | Postgres 15 (+ pgvector extension), Temporal (server + UI + Elasticsearch) |
| 2   | `docker/api.Dockerfile`     | Multi-stage Dockerfile for the API app                                     |
| 3   | `docker/web.Dockerfile`     | Multi-stage Dockerfile for the Next.js web app                             |
| 4   | `docker/workers.Dockerfile` | Multi-stage Dockerfile for the Temporal workers app                        |
| 5   | `.dockerignore`             | Prevent node_modules/.git/dist/.next in images                             |

**CI/CD (3 files):**

| #   | File Path                      | Purpose                                                                   |
| --- | ------------------------------ | ------------------------------------------------------------------------- |
| 6   | `.github/workflows/ci.yml`     | Lint + typecheck + test pipeline (triggered on PR + push to main/develop) |
| 7   | `.github/workflows/build.yml`  | Docker image build pipeline (triggered on push to main)                   |
| 8   | `.github/workflows/deploy.yml` | Deploy placeholder (Cloud Run — manual trigger with environment input)    |

## Docker Compose Requirements

### Services to include:

1. **postgres** — PostgreSQL 15 with pgvector
   - Image: `pgvector/pgvector:pg15` (includes pgvector pre-installed)
   - Port: `5432:5432`
   - Environment: `POSTGRES_USER=ai_sdlc`, `POSTGRES_PASSWORD=ai_sdlc_dev`, `POSTGRES_DB=ai_sdlc`
   - Volume: named volume for data persistence
   - Healthcheck: `pg_isready`

2. **temporal** — Temporal server (auto-setup dev mode)
   - Image: `temporalio/auto-setup:latest`
   - Port: `7233:7233`
   - Environment: connects to postgres as persistence backend (or use default SQLite for simplicity)
   - Depends on: postgres (if using PG persistence) or standalone
   - Note: For dev simplicity, use Temporal's built-in SQLite persistence (no separate DB needed)

3. **temporal-ui** — Temporal Web UI
   - Image: `temporalio/ui:latest`
   - Port: `8233:8080`
   - Environment: `TEMPORAL_ADDRESS=temporal:7233`
   - Depends on: temporal

> **Note:** Redis is intentionally excluded. Rate limiting uses in-memory Fastify throttle. Redis can be introduced post-demo if distributed rate limiting or caching becomes necessary.

### Docker Compose design decisions:

- Use `docker-compose.yml` (v3.8 format) at the repository root
- Named volumes for data persistence across restarts
- Health checks on all services
- Network: default bridge network (all services can communicate by service name)
- The application services (api, web, workers) are NOT in docker-compose — they run locally with `pnpm dev` during development. Docker Compose only provides infrastructure dependencies.

## Dockerfile Requirements

### General multi-stage pattern:

All Dockerfiles should follow this pattern for production builds:

```
Stage 1: "deps" — Install all dependencies (pnpm fetch + install)
Stage 2: "build" — Copy source, run build
Stage 3: "runner" — Minimal runtime image, copy only production artifacts
```

### Specific requirements:

1. **Base image:** `node:20-alpine` for all stages
2. **Package manager:** Install pnpm via corepack (`corepack enable && corepack prepare pnpm@9.12.3 --activate`)
3. **Workspace-aware:** Copy `pnpm-workspace.yaml`, `pnpm-lock.yaml`, and relevant `package.json` files from the monorepo
4. **Nx build:** Use `pnpm nx build <project>` to produce dist output
5. **Security:** Run as non-root user in the runner stage
6. **Labels:** Include `org.opencontainers.image.*` labels
7. **.dockerignore:** Exclude `node_modules`, `.git`, `dist`, `.next`, `.nx`, `tmp`, `*.md`, `.env*`

### API Dockerfile specifics:

- Build target: `pnpm nx build api` (outputs to `dist/apps/api`)
- Copy Prisma schema for runtime client generation
- Entry: `node dist/apps/api/main.js`
- Expose port 3000

### Web Dockerfile specifics:

- Build target: `pnpm nx build web` (Next.js build → `.next/`)
- Use Next.js standalone output mode if available, otherwise copy `.next` + `node_modules`
- Entry: `node server.js` (standalone) or `pnpm start`
- Expose port 3000 (Next.js default in production)

### Workers Dockerfile specifics:

- Build target: `pnpm nx build workers` (outputs to `dist/apps/workers`)
- Entry: `node dist/apps/workers/main.js`
- Expose port 8081 (health probe)
- Note: Temporal worker needs the native SDK compiled for the target platform — ensure `@temporalio/worker` builds correctly in Alpine

## CI/CD Requirements

### `.github/workflows/ci.yml` — Continuous Integration

**Triggers:** Pull request to `main` or `develop`, push to `main` or `develop`

**Jobs:**

1. **lint-typecheck-test** (single job for speed in small teams):
   - Runs on: `ubuntu-latest`
   - Steps:
     1. Checkout code
     2. Setup Node.js 20
     3. Setup pnpm 9 (use `pnpm/action-setup@v4`)
     4. Cache pnpm store (`~/.local/share/pnpm/store`)
     5. Install dependencies (`pnpm install --frozen-lockfile`)
     6. Run lint: `pnpm nx run-many -t lint`
     7. Run typecheck: `pnpm nx run-many -t typecheck` (or `tsc --noEmit` for each project)
     8. Run tests: `pnpm nx run-many -t test -- --reporter=default`
   - Use Nx affected commands where possible for faster CI on large PRs:
     - `pnpm nx affected -t lint --base=origin/main`
     - `pnpm nx affected -t test --base=origin/main`

### `.github/workflows/build.yml` — Docker Build

**Triggers:** Push to `main`

**Jobs:**

1. **build-images** (matrix strategy for api, web, workers):
   - Runs on: `ubuntu-latest`
   - Strategy matrix: `[api, web, workers]`
   - Steps:
     1. Checkout code
     2. Set up Docker Buildx
     3. Login to GitHub Container Registry (`ghcr.io`)
     4. Build and push image:
        - Tag: `ghcr.io/${{ github.repository }}/<app>:latest` and `ghcr.io/${{ github.repository }}/<app>:${{ github.sha }}`
        - Dockerfile: `docker/<app>.Dockerfile`
        - Context: `.` (repository root)
     5. Output image digest

### `.github/workflows/deploy.yml` — Deploy (Placeholder)

**Triggers:** Manual (`workflow_dispatch`) with environment input (`staging` or `production`)

**Jobs:**

1. **deploy** (placeholder):
   - Runs on: `ubuntu-latest`
   - Steps:
     1. Checkout code
     2. Authenticate to GCP (placeholder — uses `google-github-actions/auth@v2`)
     3. Deploy API to Cloud Run (placeholder command — commented out with TODO)
     4. Deploy Web to Cloud Run (placeholder command — commented out with TODO)
     5. Deploy Workers to GKE/Cloud Run Jobs (placeholder — commented out with TODO)
   - Include comments explaining what secrets need to be configured:
     - `GCP_PROJECT_ID`
     - `GCP_SA_KEY` (or Workload Identity Federation)
     - `GCP_REGION`

## Technical Requirements

1. **Docker Compose** must work with `docker compose up -d` — the Makefile `docker` target already expects this
2. **Dockerfiles** must produce working images that can run the apps in isolation
3. **CI pipeline** must pass in a clean environment (no local state assumptions)
4. **No secrets in code** — CI/CD uses GitHub secrets, deploy uses GCP Workload Identity
5. **Nx caching** — CI should leverage Nx's computation cache for faster subsequent runs
6. **pnpm store caching** — CI should cache the pnpm store to speed up installs
7. All Dockerfiles should pass `hadolint` without errors (follow Dockerfile best practices)
8. Docker Compose should be idempotent — running `up -d` multiple times is safe

## Requirements

1. Implement all 8 files listed above
2. Verify `docker compose config` validates the compose file (if Docker is available)
3. Verify the CI workflow YAML is valid (proper indentation, correct action versions)
4. The Makefile `docker` target (`docker compose up -d`) should work with the new compose file
5. Ensure `.dockerignore` is comprehensive to keep image sizes small
6. All GitHub Actions should pin action versions to specific SHA or major version (e.g., `actions/checkout@v4`)
7. Include inline comments in CI workflows explaining non-obvious steps
8. Commit when done with a conventional commit message

## Notes

- The Makefile already has a `docker` target that runs `docker compose up -d` — the compose file should be compatible
- The workers app uses `@temporalio/worker` which has native bindings — the Docker build needs to account for this (Alpine may need additional build dependencies or use `node:20-slim` instead)
- For the golden demo, the developer workflow is: `make docker` → wait for services → `make migrate` → `make seed` → `make dev` → open `http://localhost:4200`
- Temporal's auto-setup image handles schema creation automatically — no separate migration needed for Temporal itself
