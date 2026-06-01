# Continue: Implement Phase 6 — Frontend (Next.js)

## Context

I'm building the **AI SDLC Assistant Platform** — an Nx monorepo at `c:\Users\VantawlL\projects\ai-sdlc-assistant-platform`.

**Already completed:**

- **Phase 1:** Monorepo foundation (Nx, pnpm workspace, tsconfig, eslint, prettier, husky, lint-staged)
- **Phase 2:** Shared contracts & types (`libs/shared/types`, `libs/shared/schemas`, `libs/shared/constants`, `libs/shared/prompts`)
- **Phase 2B:** Observability libs (`libs/infra/telemetry` with pino/OTel/Langfuse, `libs/infra/logging` with NestJS adapter)
- **Phase 3:** Backend API (`apps/api` with NestJS+Fastify, `libs/infra/database` with Prisma, `libs/infra/auth`, `libs/infra/governance`)
- **Phase 4:** Agent Layer + MCP + Evaluations (`libs/agents/core`, `libs/agents/{planner,retriever,reviewer,architecture,implementor}`, `libs/mcp`, `libs/evaluations`, `libs/agents/a2a`, `libs/agents/adk`)
- **Phase 5:** Temporal Workflow Orchestration (`apps/workers` with Temporal worker, SDLC workflow with approval gate, all agent activities, health probe; API wired to Temporal client)

The implementation plan is at `docs/IMPLEMENTATION_PLAN_V4_REVISED_FINAL.md`.

## Key Conventions Established

- **Package naming:** `@ai-sdlc/<scope>-<name>` (e.g., `@ai-sdlc/shared-types`, `@ai-sdlc/infra-telemetry`)
- **Path aliases** in `tsconfig.base.json`: `@ai-sdlc/shared/types`, `@ai-sdlc/shared/schemas`, `@ai-sdlc/shared/constants`, `@ai-sdlc/shared/prompts`, `@ai-sdlc/infra/telemetry`, `@ai-sdlc/infra/logging`, `@ai-sdlc/infra/auth`, `@ai-sdlc/infra/database`, `@ai-sdlc/infra/governance`, `@ai-sdlc/agents/core`, `@ai-sdlc/agents/planner`, `@ai-sdlc/agents/retriever`, `@ai-sdlc/agents/reviewer`, `@ai-sdlc/agents/architecture`, `@ai-sdlc/agents/implementor`, `@ai-sdlc/agents/a2a`, `@ai-sdlc/agents/adk`, `@ai-sdlc/mcp`, `@ai-sdlc/evaluations` (use `./` prefix, no `baseUrl`)
- **All libs use** `"type": "module"` with `.js` extensions in imports
- **ESLint** uses `@nx/eslint-plugin@19.8.0`, plugin declared as `"@nx"` in `.eslintrc.json`
- **Nx version:** 19.8.0
- **TypeScript:** 5.5.4
- **Node:** 20+
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

## Existing Shared Types Available for Use

From `@ai-sdlc/shared/types`:

- **Agent types:** `AgentName`, `AgentInput`, `AgentContext`, `AgentConfig`, `AgentOutput`, `AgentResult`, `AgentArtifact`, `AgentError`, `TokenUsage`, `AgentExecutionStatus`
- **Workflow types:** `WorkflowStatus`, `WorkflowStep`, `WorkflowExecution`, `WorkflowStepResult`, `WorkflowTriggerRequest`, `WorkflowTriggerResponse`, `ApprovalRequest`
- **Task types:** `TaskStatus`, `TaskPriority`, `TaskCreateRequest`, `TaskResponse`

From `@ai-sdlc/shared/schemas`:

- `AgentOutputSchema`, `AgentConfigSchema`, `AgentName` (zod enum), `AgentResultSchema`, `AgentErrorSchema`, `TokenUsageSchema`, `AgentArtifactSchema`

## Existing API Endpoints Available

From `apps/api`:

- `POST /tasks` — Create a task
- `GET /tasks` — List tasks
- `GET /tasks/:id` — Get task detail
- `POST /workflows/trigger` — Trigger a workflow (starts Temporal workflow)
- `GET /workflows/:id` — Get workflow execution status
- `GET /workflows/:id/approve` — Approve workflow at approval gate (sends signal)
- `GET /health` — API health check
- `GET /events` — SSE stream for real-time workflow updates

## Task: Implement Phase 6 — Frontend (Next.js)

**Goal:** Next.js app with dashboard shell, task submission, workflow trace view, streaming support, dark/light theme. Design aesthetic: Linear/Vercel/Cursor — clean, minimal, professional.

**Workflow sequence for Golden Demo:**

> User opens dashboard → Creates task "Implement dark mode support across all MFEs" → Sees workflow start → Watches steps progress in real-time (SSE) → Approves at approval gate → Sees implementation & review complete

### Files to Implement (36 files)

**App configuration (8 files):**

| #   | File Path                     | Purpose                                                                            |
| --- | ----------------------------- | ---------------------------------------------------------------------------------- |
| 1   | `apps/web/package.json`       | App package.json (Next.js 14, React 18, Tailwind, shadcn/ui, React Query, Zustand) |
| 2   | `apps/web/tsconfig.json`      | App tsconfig (extends base, adds jsx, next types)                                  |
| 3   | `apps/web/project.json`       | Nx project config                                                                  |
| 4   | `apps/web/next.config.ts`     | Next.js config (output: standalone, API proxy rewrites)                            |
| 5   | `apps/web/tailwind.config.ts` | Tailwind config (darkMode: 'class', extends theme from CSS vars)                   |
| 6   | `apps/web/postcss.config.mjs` | PostCSS config                                                                     |
| 7   | `apps/web/components.json`    | shadcn/ui config                                                                   |
| 8   | `apps/web/vitest.config.ts`   | Vitest config for component/hook tests                                             |

**App pages (6 files):**

| #   | File Path                              | Purpose                                                        |
| --- | -------------------------------------- | -------------------------------------------------------------- |
| 9   | `apps/web/src/app/layout.tsx`          | Root layout with sidebar shell + theme provider                |
| 10  | `apps/web/src/app/page.tsx`            | Dashboard home page (task summary, recent workflows)           |
| 11  | `apps/web/src/app/globals.css`         | Tailwind global styles + CSS custom properties (design tokens) |
| 12  | `apps/web/src/app/tasks/page.tsx`      | Task list page                                                 |
| 13  | `apps/web/src/app/tasks/new/page.tsx`  | Task submission form                                           |
| 14  | `apps/web/src/app/tasks/[id]/page.tsx` | Task detail + workflow trace view                              |

**Layout components (4 files):**

| #   | File Path                                           | Purpose                                 |
| --- | --------------------------------------------------- | --------------------------------------- |
| 15  | `apps/web/src/components/layout/sidebar.tsx`        | Sidebar navigation                      |
| 16  | `apps/web/src/components/layout/header.tsx`         | Top header bar                          |
| 17  | `apps/web/src/components/layout/shell.tsx`          | Dashboard shell wrapper                 |
| 18  | `apps/web/src/components/layout/theme-provider.tsx` | Dark/light theme provider (next-themes) |

**Feature components (3 files):**

| #   | File Path                                        | Purpose                                                           |
| --- | ------------------------------------------------ | ----------------------------------------------------------------- |
| 19  | `apps/web/src/components/tasks/task-form.tsx`    | Task submission form component                                    |
| 20  | `apps/web/src/components/tasks/task-list.tsx`    | Task list component                                               |
| 21  | `apps/web/src/components/trace/trace-viewer.tsx` | Workflow step visualization (shows step progression in real-time) |

**shadcn/ui primitives (6 files):**

| #   | File Path                                 | Purpose                |
| --- | ----------------------------------------- | ---------------------- |
| 22  | `apps/web/src/components/ui/button.tsx`   | Button component       |
| 23  | `apps/web/src/components/ui/input.tsx`    | Input component        |
| 24  | `apps/web/src/components/ui/card.tsx`     | Card component         |
| 25  | `apps/web/src/components/ui/badge.tsx`    | Badge/status component |
| 26  | `apps/web/src/components/ui/textarea.tsx` | Textarea component     |
| 27  | `apps/web/src/components/ui/select.tsx`   | Select component       |

**Lib/hooks/stores (6 files):**

| #   | File Path                                | Purpose                                                                                      |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| 28  | `apps/web/src/lib/api-client.ts`         | Typed fetch wrapper (API_BASE_URL from env, uses shared Zod schemas for response validation) |
| 29  | `apps/web/src/lib/query-provider.tsx`    | React Query provider (QueryClientProvider wrapper)                                           |
| 30  | `apps/web/src/hooks/use-tasks.ts`        | React Query hooks: useTaskList, useTask, useCreateTask                                       |
| 31  | `apps/web/src/hooks/use-workflows.ts`    | React Query hooks: useWorkflow, useTriggerWorkflow, useApproveWorkflow                       |
| 32  | `apps/web/src/hooks/use-event-stream.ts` | SSE hook — subscribes to /events for real-time workflow step updates                         |
| 33  | `apps/web/src/stores/task.store.ts`      | Zustand store for task UI state (selected task, filters, etc.)                               |

**Workflows page (1 file):**

| #   | File Path                             | Purpose                         |
| --- | ------------------------------------- | ------------------------------- |
| 34  | `apps/web/src/app/workflows/page.tsx` | Workflow execution history page |

**E2E testing (2 files):**

| #   | File Path                           | Purpose                      |
| --- | ----------------------------------- | ---------------------------- |
| 35  | `apps/web/e2e/playwright.config.ts` | Playwright config            |
| 36  | `apps/web/e2e/example.spec.ts`      | Example E2E test placeholder |

## Golden Demo Context

The canonical task is: **"Implement dark mode support across all MFEs"**. The frontend should demonstrate:

1. User opens dashboard at `/` — sees clean, minimal UI with sidebar navigation
2. User navigates to `/tasks/new` — fills in task title & description → submits
3. Task created → user redirected to `/tasks/:id` detail page
4. Workflow triggers automatically — trace viewer shows step-by-step progress in real-time via SSE
5. Steps light up as they complete: Planning ✓ → Retrieval ✓ → Architecture ✓ → **Approval Gate (waiting)**
6. User clicks "Approve" button → workflow continues
7. Implementation ✓ → Review ✓ → Complete
8. Final output displayed in task detail page

## Design Requirements

### Visual Aesthetic

- **Inspiration:** Linear, Vercel Dashboard, Cursor — dark-first, clean typography, subtle borders
- **Color palette:** Neutral grays with a single accent color (blue or violet)
- **Typography:** System font stack or Inter
- **Spacing:** Generous whitespace, 4px grid
- **Borders:** Subtle, 1px, low-contrast
- **Dark mode:** Default, with light mode toggle

### Design Token Strategy

`globals.css` defines CSS custom properties for the full color palette, spacing scale, and radii. Tailwind config extends its theme from these variables. This gives a single source of truth for visual identity.

```css
/* Example token structure */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  /* ... */
}
```

### Trace Viewer Design

The trace viewer on the task detail page should show the workflow steps as a vertical timeline:

- Each step is a card/row showing: step name, status (pending/running/completed/failed), timestamps
- Running step has a subtle pulse animation
- Completed steps have a check icon
- The approval gate step shows an "Approve" / "Reject" button when waiting
- Use SSE events to update step statuses in real-time without polling

## Technical Requirements

1. **Next.js 14** with App Router (not Pages Router)
2. **React 18** with Server Components where appropriate (pages can be server components, interactive components use `'use client'`)
3. **Tailwind CSS v3** with CSS custom properties for design tokens
4. **shadcn/ui** — copy component source files directly (not installed as a package). Use `components.json` for configuration.
5. **React Query (TanStack Query v5)** for data fetching
6. **Zustand** for client-side UI state
7. **next-themes** for dark/light mode
8. **API proxy:** Next.js rewrites `/api/*` to the backend at `http://localhost:3000/*` (configurable via `NEXT_PUBLIC_API_URL` env var)
9. **SSE:** Use native `EventSource` API in the `use-event-stream` hook
10. **TypeScript:** Strict mode, no `any` types
11. **Class Variance Authority (cva)** for component variants (used by shadcn/ui)
12. **clsx + tailwind-merge** for className merging (standard shadcn/ui `cn()` utility)

## Package Dependencies

### dependencies

```json
{
  "next": "^14.2.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "@tanstack/react-query": "^5.50.0",
  "zustand": "^4.5.0",
  "next-themes": "^0.3.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.4.0",
  "lucide-react": "^0.400.0",
  "zod": "^3.23.8"
}
```

### devDependencies

```json
{
  "@types/react": "^18.3.0",
  "@types/react-dom": "^18.3.0",
  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.0",
  "autoprefixer": "^10.4.0",
  "typescript": "^5.5.4",
  "@playwright/test": "^1.45.0"
}
```

## tsconfig.json for Next.js App

The web app needs a different tsconfig pattern than the backend apps because Next.js has its own compilation:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "next-env.d.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "dist", ".next", "e2e"]
}
```

## File Organization Notes

- Pages in `src/app/` use Next.js App Router conventions (`layout.tsx`, `page.tsx`, `[param]/`)
- Components in `src/components/` organized by feature (`layout/`, `tasks/`, `trace/`, `ui/`)
- Hooks in `src/hooks/` — one file per domain
- Stores in `src/stores/` — one file per store
- Lib utilities in `src/lib/` — api client, providers, `cn()` utility

## Requirements

1. Implement all 36 files listed above
2. Install all dependencies listed in the package dependencies section
3. The UI should look professional and polished — not a prototype/wireframe
4. Dark mode should be the default, with a toggle in the header
5. The trace viewer must support real-time updates via SSE
6. All interactive components must use `'use client'` directive
7. The API client must handle errors gracefully (toast/notification pattern, not crashes)
8. Run `pnpm install` after creating package.json
9. Verify the app builds with `next build` (or at minimum `tsc --noEmit` passes)
10. The sidebar should have navigation links to: Dashboard, Tasks, Workflows
11. Commit when done with a conventional commit message

## pnpm-workspace.yaml

The existing workspace config at `pnpm-workspace.yaml` already covers `apps/*` so `apps/web` will be auto-detected. No changes needed.

## Nx Integration

The `project.json` should define targets for:

- `dev` — `next dev`
- `build` — `next build`
- `start` — `next start`
- `lint` — `next lint`
- `test` — `vitest`
- `e2e` — `playwright test`
