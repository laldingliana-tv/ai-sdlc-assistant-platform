# Continue: Upgrade All Package Versions

## Context

I'm building the **AI SDLC Assistant Platform** — an Nx monorepo at `c:\Users\VantawlL\projects\ai-sdlc-assistant-platform`.

The frontend has already been upgraded (Next.js 14→16, React 18→19, Tailwind CSS v3→v4) on the `feature/nextjs-16-migration` branch which is now merged to `develop`.

## Task: Upgrade All Remaining Package Versions

**Goal:** Create a new branch `feature/package-upgrades` from `develop`, analyze all dependencies across the monorepo, and upgrade everything that can be safely upgraded. All version upgrades must be completed before moving on to other work.

### Branch Setup

```bash
git checkout develop
git pull origin develop
git checkout -b feature/package-upgrades
```

### Current Package Versions (as of June 2026)

Here is the full inventory of external dependencies with their current pinned versions and latest available:

#### 🔴 HIGH PRIORITY — Deprecated or Major Behind

| Package                            | Current   | Latest                    | Notes                                            |
| ---------------------------------- | --------- | ------------------------- | ------------------------------------------------ |
| `@langchain/core`                  | `^0.3.0`  | `1.x`                     | 0.x line unmaintained since 1.0 GA               |
| `@langchain/langgraph`             | `^0.2.0`  | `1.x`                     | Same — major API changes in 1.0                  |
| `@langchain/openai`                | `^0.3.0`  | `1.x`                     | Same ecosystem                                   |
| `eslint`                           | `^8.57.0` | `9.x+`                    | ESLint 8 is deprecated, no more security patches |
| `@typescript-eslint/eslint-plugin` | `^7.18.0` | `8.x`                     | Tied to ESLint 8 → must upgrade together         |
| `@typescript-eslint/parser`        | `^7.18.0` | `8.x`                     | Same                                             |
| `@nx/eslint-plugin`                | `^19.8.0` | needs to match Nx version |                                                  |

#### 🟠 MEDIUM PRIORITY — Falling Behind

| Package                     | Current   | Latest | Notes                                           |
| --------------------------- | --------- | ------ | ----------------------------------------------- |
| `prisma` / `@prisma/client` | `^5.20.0` | `7.x`  | Prisma 6 introduced new query compiler          |
| `nx` (and all `@nx/*`)      | `19.8.0`  | `22.x` | 3 majors behind; `nx migrate` tooling available |
| `vitest`                    | `^1.6.0`  | `4.x`  | Test runner, low blast radius                   |
| `typescript`                | `~5.5.4`  | `6.x`  | TS 6 is recent                                  |

#### 🟡 LOW PRIORITY — Minor/Patch Updates

| Package                                   | Current    | Latest        | Notes                     |
| ----------------------------------------- | ---------- | ------------- | ------------------------- |
| `@opentelemetry/sdk-node`                 | `^0.52.0`  | `0.218.x`     | Pre-1.0, minors can break |
| `@opentelemetry/exporter-trace-otlp-http` | `^0.52.0`  | same as above |                           |
| `@opentelemetry/resources`                | `^1.25.0`  | `1.x latest`  |                           |
| `@temporalio/*`                           | `^1.11.0`  | `1.17.x`      | Same major, safe upgrade  |
| `langfuse`                                | `^3.3.0`   | `3.38.x`      | Same major, safe          |
| `pino`                                    | `^9.4.0`   | `9.x latest`  | Same major                |
| `pino-pretty`                             | `^11.2.0`  | `11.x latest` | Same major                |
| `@tanstack/react-query`                   | `^5.50.0`  | `5.x latest`  | Same major                |
| `zustand`                                 | `^5.0.0`   | `5.x latest`  | Same major                |
| `lucide-react`                            | `^0.469.0` | latest        | Frequent releases         |
| `supertest`                               | `^7.0.0`   | `7.x latest`  | Same major                |
| `@playwright/test`                        | `^1.45.0`  | `1.x latest`  | Same major                |
| `tsx`                                     | `^4.19.0`  | `4.x latest`  | Same major                |
| `husky`                                   | `^9.1.6`   | `9.x latest`  | Same major                |
| `lint-staged`                             | `^15.2.10` | `15.x latest` | Same major                |
| `prettier`                                | `^3.3.3`   | `3.x latest`  | Same major                |

### Upgrade Strategy

Perform upgrades in this order (each step should compile and lint cleanly before moving to the next):

#### Step 1: Safe Minor/Patch Upgrades (low risk)

Upgrade all packages within their current major version:

- `@temporalio/*` → latest 1.x
- `langfuse` → latest 3.x
- `pino` / `pino-pretty` → latest 9.x / 11.x
- `@opentelemetry/*` → latest compatible set
- `@tanstack/react-query` → latest 5.x
- `zustand` → latest 5.x
- `lucide-react` → latest
- `supertest`, `@playwright/test`, `tsx`, `husky`, `lint-staged`, `prettier` → latest within major
- Run `pnpm install`, then `pnpm nx run-many -t typecheck` and `pnpm nx run-many -t lint`

#### Step 2: LangChain 0.x → 1.x

- Upgrade `@langchain/core`, `@langchain/langgraph`, `@langchain/openai` to latest 1.x
- Review any breaking API changes (tool calling interfaces, runnable types, output parsers)
- The agent libs (`libs/agents/*`) are currently empty scaffolds — main risk is type exports in `libs/shared/types`
- Verify typecheck passes

#### Step 3: ESLint 8 → 9 (Flat Config Migration)

- Upgrade `eslint` to 9.x
- Upgrade `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` to 8.x
- Migrate from `.eslintrc.json` (legacy) to `eslint.config.mjs` (flat config)
- Files to migrate:
  - `.eslintrc.json` (root) → `eslint.config.mjs`
  - `apps/api/.eslintrc.json` → merged into root or project-level flat config
  - `apps/web/.eslintrc.json` → same
  - `apps/workers/.eslintrc.json` → same
- Update `lint-staged` config if it references eslint
- Update Nx lint targets if needed
- Verify `pnpm nx run-many -t lint` passes

#### Step 4: Prisma 5 → Latest

- Upgrade `prisma` and `@prisma/client` to latest
- Run `npx prisma generate` to regenerate client
- Review migration guide for any schema changes needed
- Verify typecheck and tests pass

#### Step 5: Vitest 1 → Latest

- Upgrade `vitest` across root and all projects
- Update any deprecated config options in `vitest.config.ts` files
- Run `pnpm nx run-many -t test`

#### Step 6: TypeScript Upgrade

- Upgrade `typescript` to latest stable
- Fix any new strictness errors introduced
- Verify full typecheck passes

#### Step 7: Nx 19 → Latest

- Use `npx nx migrate latest` to generate migrations
- Run `npx nx migrate --run-migrations`
- Update all `@nx/*` plugins to matching version
- Verify all targets still work (lint, test, build, serve)

### Validation After Each Step

After each step, run:

```bash
pnpm install
pnpm nx run-many -t typecheck
pnpm nx run-many -t lint
pnpm nx run-many -t test
```

For frontend changes, also verify:

```bash
cd apps/web && npx next build
```

### Commit Strategy

Make one commit per step with a descriptive message:

- `chore(deps): upgrade minor/patch versions (temporal, langfuse, otel, etc.)`
- `chore(deps): upgrade LangChain ecosystem to 1.x`
- `chore(deps): migrate ESLint to v9 flat config`
- `chore(deps): upgrade Prisma to vX`
- `chore(deps): upgrade Vitest to vX`
- `chore(deps): upgrade TypeScript to vX`
- `chore(deps): upgrade Nx to vX`

### Important Notes

- If any step introduces breaking changes that require significant code rewrites, assess the risk and skip if the blast radius is too large — document why in a commit message or comment
- The agent libraries (`libs/agents/*`) are mostly empty scaffolds with no real implementation yet, so LangChain upgrade should be low risk
- ESLint flat config migration is the most labor-intensive but well-documented
- Always run `pnpm install` after modifying `package.json` files
- Do NOT upgrade NestJS (keep at v10) or Fastify (keep at v4) — assessed as too risky for now
- Do NOT downgrade any packages that were already upgraded (Next.js 16, React 19, Tailwind v4)

### Packages to Leave As-Is

| Package               | Version   | Reason                                              |
| --------------------- | --------- | --------------------------------------------------- |
| `@nestjs/*`           | `^10.4.0` | NestJS 11 requires Fastify 5; coupled risk too high |
| `fastify`             | `^4.28.0` | Tied to NestJS 10 compatibility                     |
| `next`                | `^16.2.0` | Already upgraded                                    |
| `react` / `react-dom` | `^19.0.0` | Already upgraded                                    |
| `tailwindcss`         | `^4.0.0`  | Already upgraded                                    |
