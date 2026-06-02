# Continue: Migrate Next.js 14 → 16

## Context

I'm building the **AI SDLC Assistant Platform** — an Nx monorepo at `c:\Users\VantawlL\projects\ai-sdlc-assistant-platform`.

The frontend app lives at `apps/web/` and currently uses **Next.js 14.2** with **React 18.3**. The latest stable Next.js version is **16.2**. This prompt covers the migration to Next.js 16.

**Branch strategy:** Create a new feature branch `feature/nextjs-16-migration` from `develop` before making any changes. After migration is complete and verified, it will be merged back to `develop`.

## Current Frontend Stack

| Package                 | Current Version |
| ----------------------- | --------------- |
| `next`                  | ^14.2.0         |
| `react`                 | ^18.3.0         |
| `react-dom`             | ^18.3.0         |
| `@types/react`          | ^18.3.0         |
| `@types/react-dom`      | ^18.3.0         |
| `@tanstack/react-query` | ^5.50.0         |
| `next-themes`           | ^0.3.0          |
| `tailwindcss`           | ^3.4.0          |
| `zustand`               | ^4.5.0          |
| `typescript`            | ^5.5.4          |

## Key Frontend Architecture

- **App Router** (Next.js `app/` directory)
- **Server Components** by default, `'use client'` directive for interactive components
- **shadcn/ui** component library (Radix primitives + Tailwind)
- **@tanstack/react-query** for server state management
- **Zustand** for client state
- **next-themes** for dark/light mode
- **API proxy** via `next.config.mjs` rewrites (`/api/*` → `http://localhost:3000`)
- **Standalone output** mode for Docker deployment
- **Vitest + jsdom** for unit tests
- **Playwright** for e2e tests

## Key File Locations

| File                                         | Purpose                                                          |
| -------------------------------------------- | ---------------------------------------------------------------- |
| `apps/web/package.json`                      | Dependencies and scripts                                         |
| `apps/web/next.config.mjs`                   | Next.js configuration (rewrites, standalone)                     |
| `apps/web/tailwind.config.ts`                | Tailwind CSS configuration                                       |
| `apps/web/postcss.config.mjs`                | PostCSS configuration                                            |
| `apps/web/tsconfig.json`                     | TypeScript configuration                                         |
| `apps/web/src/app/layout.tsx`                | Root layout (ThemeProvider, QueryProvider, ErrorBoundary, Shell) |
| `apps/web/src/app/page.tsx`                  | Dashboard home page                                              |
| `apps/web/src/app/tasks/page.tsx`            | Task list page                                                   |
| `apps/web/src/app/workflows/[id]/page.tsx`   | Workflow detail page                                             |
| `apps/web/src/components/`                   | UI components (shadcn/ui + custom)                               |
| `apps/web/src/hooks/`                        | React Query hooks (use-tasks, use-workflows, use-event-stream)   |
| `apps/web/src/lib/api-client.ts`             | Fetch-based API client with timeout                              |
| `apps/web/src/lib/query-provider.tsx`        | React Query provider wrapper                                     |
| `apps/web/src/stores/task.store.ts`          | Zustand store                                                    |
| `apps/web/src/components/error-boundary.tsx` | Class-based error boundary                                       |
| `docker/web.Dockerfile`                      | Multi-stage Docker build                                         |

## Migration Task

### Step 1: Create Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nextjs-16-migration
```

### Step 2: Research Breaking Changes

Before upgrading, check the official Next.js migration guides:

- Next.js 14 → 15 upgrade guide
- Next.js 15 → 16 upgrade guide (if available)

Key areas to investigate:

- **React version requirement** (Next.js 15+ requires React 19)
- **Caching behavior changes** (Next.js 15 changed fetch caching defaults)
- **`next.config.mjs`** format changes (may need to move to `next.config.ts`)
- **Metadata API** changes
- **Dynamic route segment** changes
- **Turbopack** as default bundler
- **Tailwind CSS v4** compatibility (Next.js 16 may expect Tailwind v4)
- **PostCSS config** changes

### Step 3: Upgrade Dependencies

Update these packages to their latest compatible versions:

- `next` → latest 16.x
- `react` and `react-dom` → 19.x (required by Next.js 15+)
- `@types/react` and `@types/react-dom` → matching React 19 types
- `@tanstack/react-query` → verify React 19 compatibility (v5 should work)
- `next-themes` → verify compatibility
- `tailwindcss` → v4 if required by Next.js 16
- `zustand` → latest (v5 supports React 19)

### Step 4: Fix Breaking Changes

Address each breaking change systematically:

1. **React 19 changes:**
   - `forwardRef` is no longer needed (ref is a regular prop)
   - `useFormStatus`, `useFormState` → `useActionState`
   - Error boundary class components still work in React 19

2. **Next.js 15/16 changes:**
   - `params` and `searchParams` in page/layout components are now async (must be awaited)
   - Dynamic APIs (`cookies()`, `headers()`) are now async
   - Default caching is now `no-store` (verify API client behavior)
   - `next.config.mjs` → may need `next.config.ts`
   - Image component changes

3. **Tailwind v4 (if applicable):**
   - CSS-first configuration (replaces `tailwind.config.ts`)
   - New import syntax (`@import "tailwindcss"` instead of `@tailwind` directives)
   - Class name changes (if any)

### Step 5: Update Docker Configuration

- Update `docker/web.Dockerfile` if Node.js version or build steps change
- Verify standalone output still works correctly

### Step 6: Verify

After migration, confirm:

- [ ] `pnpm nx serve web` starts without errors on `localhost:4200`
- [ ] All pages render correctly (dashboard, tasks, workflows)
- [ ] API proxy still works (`/api/*` routes to backend)
- [ ] Dark/light theme toggle works
- [ ] React Query data fetching works
- [ ] SSE event streaming still works
- [ ] Error boundary catches errors properly
- [ ] `pnpm nx build web` succeeds
- [ ] `pnpm nx run web:lint` passes
- [ ] `pnpm nx run web:test` passes
- [ ] Docker build succeeds: `docker build -f docker/web.Dockerfile .`

## Constraints

- Do NOT change the backend API or any non-web files
- Keep the same UI/UX — this is a framework upgrade, not a redesign
- Maintain shadcn/ui component compatibility
- Keep the API proxy rewrites working
- If a dependency is not yet compatible with React 19/Next.js 16, document it and find an alternative or pin it at the last compatible version
- Run lint and typecheck after each major change to catch issues early
- Commit incrementally (one commit per logical step)
