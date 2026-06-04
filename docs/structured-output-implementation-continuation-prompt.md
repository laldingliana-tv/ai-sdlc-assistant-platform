# Continue: Address Structured Output Implementation Review Findings

## Context

I'm building the **AI SDLC Assistant Platform** — an Nx monorepo at `c:\Users\VantawlL\projects\ai-sdlc-assistant-platform`.

**Current branch:** `feature/structured-agent-output`

**What was implemented:**

- Structured output support for all 5 agents (Planner, Retriever, Architecture, Implementor, Reviewer)
- Discriminated union types (`StructuredAgentOutput`) in `libs/shared/types/src/agent.ts`
- Zod validation schemas in `libs/shared/schemas/src/agent.schema.ts`
- `parseStructuredOutput<T>()` utility in `libs/agents/core/src/structured-output.ts`
- JSON response format binding in `libs/ai/model-gateway/src/gateway/model-gateway.service.ts`
- Root `vitest.config.ts` with `resolve.alias` for running lib tests
- All 40 tests pass, zero type errors in `libs/`

**The code review is at:** `docs/structured-output-implementation-review.md`

## Key Conventions Established

- **Package naming:** `@ai-sdlc/<scope>-<name>` (e.g., `@ai-sdlc/shared-types`, `@ai-sdlc/agents-core`)
- **Path aliases** in `tsconfig.base.json`: `@ai-sdlc/shared/types`, `@ai-sdlc/shared/schemas`, `@ai-sdlc/agents/core`, `@ai-sdlc/ai/model-gateway`, etc. (use `./` prefix, no `baseUrl`)
- **All libs use** `"type": "module"` with `.js` extensions in imports
- **TypeScript:** ~5.9.3
- **pnpm:** 9.12.3 (strict mode — packages only access declared dependencies)
- **Testing:** vitest with root config at `vitest.config.ts` using `resolve.alias` for path resolution
- **Zod** for runtime validation with discriminated unions
- **LangChain/LangGraph** for agent reasoning (`@langchain/core`, `@langchain/langgraph`)
- **Model Gateway** abstracts over OpenAI, Anthropic, Google providers

## Files Modified in the Structured Output Feature

| File                                                         | Role                                                                                                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `libs/shared/types/src/agent.ts`                             | Core types: `StructuredAgentOutput` union, `PlannerOutput`, `RetrieverOutput`, `ArchitectureOutput`, `ImplementorOutput`, `ReviewerOutput` |
| `libs/shared/schemas/src/agent.schema.ts`                    | Zod schemas matching all output types + `StructuredAgentOutputSchema` discriminated union                                                  |
| `libs/ai/model-gateway/src/gateway/model-gateway.service.ts` | JSON response format via `model.bind({ response_format: { type: 'json_object' } })`                                                        |
| `libs/agents/core/src/structured-output.ts`                  | `parseStructuredOutput<T>(content, schema)` — strips code fences, parses JSON, validates with Zod                                          |
| `libs/agents/core/src/structured-output.spec.ts`             | Unit tests for the parse utility                                                                                                           |
| `libs/agents/core/src/index.ts`                              | Re-exports `parseStructuredOutput`                                                                                                         |
| `libs/agents/core/package.json`                              | Added `zod` dependency                                                                                                                     |
| `libs/agents/planner/src/planner.agent.ts`                   | Returns typed `PlannerOutput` in `structuredOutput`                                                                                        |
| `libs/agents/retriever/src/retriever.agent.ts`               | Returns typed `RetrieverOutput`                                                                                                            |
| `libs/agents/architecture/src/architecture.agent.ts`         | Returns typed `ArchitectureOutput`                                                                                                         |
| `libs/agents/implementor/src/implementor.agent.ts`           | Returns typed `ImplementorOutput`                                                                                                          |
| `libs/agents/reviewer/src/reviewer.agent.ts`                 | Returns typed `ReviewerOutput`                                                                                                             |
| `libs/agents/*/src/*.agent.spec.ts`                          | All 5 agent specs updated with structured output tests                                                                                     |
| `vitest.config.ts` (root)                                    | New root config with `resolve.alias` for running lib tests                                                                                 |

## Task: Address Code Review Findings

The review identified issues at P0, P1, P2, and P3 priority levels. Address **all P0 and P1 items**, plus the quick-win P2/P3 items. Here is the full prioritized list:

### P0 — Must Fix Before Merge

#### 1. Fix Zod Version Mismatch

**Problem:** `libs/agents/core/package.json` declares `zod@^3.25.76` (which may be a non-existent version), while `libs/shared/schemas/package.json` and other packages use `^3.23.8`. In strict pnpm, these can resolve to different Zod instances causing `safeParse` to behave unpredictably.

**Fix:**

- Determine the actual latest stable Zod version available in the lockfile (likely `3.24.x` or whatever `pnpm list zod` reports).
- Align ALL packages to the same version specifier.
- Consider adding a `pnpm.overrides` entry in the root `package.json` to enforce a single Zod resolution workspace-wide.

#### 2. Fix Tools + JSON Mode Conflict (Overwritten `invocableModel`)

**Problem:** In `model-gateway.service.ts`, the code first binds `response_format` to `invocableModel`, then if tools are present, overwrites `invocableModel` from the original `model` (not the response-format-bound one), silently discarding JSON mode.

```typescript
// Current buggy flow:
if (request.profile.overrides?.responseFormat === 'json') {
  invocableModel = (...).bind({ response_format: ... }); // ← sets invocableModel
}
if (request.tools && request.tools.length > 0) {
  invocableModel = (model as ...).bindTools(...); // ← overwrites from original `model`!
}
```

**Fix:** Chain `bindTools()` from `invocableModel` (which may already have response_format bound) rather than from the original `model`. Ensure the two bindings compose:

```typescript
if (request.profile.overrides?.responseFormat === 'json') {
  invocableModel = invocableModel.bind({ response_format: { type: 'json_object' } });
}
if (request.tools && request.tools.length > 0) {
  invocableModel = invocableModel.bindTools(request.tools);
}
```

### P1 — Should Fix Before Merge

#### 3. Add Observability/Logging for Parsing Failures

**Problem:** When `parseStructuredOutput` returns `null`, there's no logging or telemetry. In production you won't know how often structured parsing fails.

**Fix:**

- Import the logger from `@ai-sdlc/infra/logging` (or use a simple `console.warn` as the agents don't have DI for logger).
- In each agent's `invoke()`, when `structured` is `null` but `response.content` is non-empty, log a warning with `agentName`, `taskId`, and optionally the first N chars of content.
- Alternatively, modify `parseStructuredOutput` itself to accept an optional logger/callback parameter and emit a warning internally with Zod error details.

#### 4. Fix `durationMs: 0` in Error Paths

**Problem:** All agents report `durationMs: 0` in catch blocks, even if the gateway call took significant time before failing.

**Fix:** Capture `performance.now()` (or `Date.now()`) before the try block and compute elapsed time in the catch:

```typescript
async invoke(input: AgentInput): Promise<AgentOutput> {
  const startTime = performance.now();
  try {
    // ... gateway call ...
  } catch (error) {
    return {
      // ...
      durationMs: Math.round(performance.now() - startTime),
      // ...
    };
  }
}
```

Apply this pattern to all 5 agents.

#### 5. Implement Error Retryability Classification

**Problem:** `retryable: false` is hard-coded for all errors. Rate limits and timeouts should be retryable.

**Fix:** Create a helper (e.g., in `libs/agents/core/src/error-utils.ts`) that classifies errors:

```typescript
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('rate limit') || msg.includes('429')) return true;
    if (msg.includes('timeout') || msg.includes('timed out')) return true;
    if (msg.includes('503') || msg.includes('service unavailable')) return true;
    if (msg.includes('overloaded')) return true;
  }
  return false;
}
```

Use it in all agents' catch blocks: `retryable: isRetryableError(error)`.

### P2 — Address If Time Permits

#### 6. Derive TypeScript Types from Zod Schemas (DRY)

**Problem:** `libs/shared/types/src/agent.ts` manually defines interfaces identical to the Zod schemas. Changes must be mirrored manually.

**Fix:** In `libs/shared/types/src/agent.ts`, replace the manual interface definitions for structured outputs with `z.infer<>`:

```typescript
import type { z } from 'zod';
import type {
  PlannerOutputSchema,
  RetrieverOutputSchema,
  // ...
} from '@ai-sdlc/shared/schemas';

export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;
export type RetrieverOutput = z.infer<typeof RetrieverOutputSchema>;
// etc.
```

**Note:** This creates a dependency from `shared/types` → `shared/schemas`. If that circular import is unacceptable, keep types manual but add a compile-time assertion test that `z.infer<Schema> extends ManualType` (and vice versa).

#### 7. Add `previousOutputs` Size Limiting

**Problem:** Unbounded `JSON.stringify(previousOutputs)` could produce very large messages. Prompt injection surface.

**Fix:** Truncate to a max character length (e.g., 10000 chars) before injecting into the prompt:

```typescript
const serializedOutputs = JSON.stringify(input.context.previousOutputs).slice(0, 10_000);
```

#### 8. Apply `responseFormat` in `stream()` or Document Limitation

**Problem:** The `stream()` method doesn't apply JSON mode.

**Fix:** Either replicate the `responseFormat` binding logic in `stream()`, or add a comment/check that throws if `responseFormat: 'json'` is requested via streaming (not supported).

### P3 — Quick Wins

#### 9. Improve Code Fence Regex Robustness

**Current:**

````typescript
const cleaned = content
  .replace(/^```(?:json)?\s*\n?/i, '')
  .replace(/\n?```\s*$/i, '')
  .trim();
````

**Better:**

````typescript
const fenceMatch = content.match(/```(?:json[c5]?)?\s*\n([\s\S]*?)\n```/i);
const jsonStr = fenceMatch ? fenceMatch[1] : content.trim();
````

This handles leading/trailing text around fences, and `jsonc`/`json5` specifiers.

#### 10. Add Missing Architecture Agent Fallback Test

`architecture.agent.spec.ts` is the only spec missing a `'should still return content when JSON parsing fails'` test. Add it for consistency.

#### 11. Remove Unused `AgentOutputInput` Export

In `libs/shared/schemas/src/agent.schema.ts`, remove:

```typescript
export type AgentOutputInput = z.input<typeof AgentOutputSchema>;
```

if it's not used anywhere.

## Technical Requirements

1. All 40+ existing tests must continue to pass after changes
2. Zero new type errors in `libs/`
3. Run tests with: `pnpm vitest run libs/agents`
4. The existing agents should maintain backward compatibility — `structuredOutput` remains optional
5. Do NOT commit — I want to manually review all changes before committing

## Notes

- The root `vitest.config.ts` uses `resolve.alias` and NOT the `vite-tsconfig-paths` plugin (it has ESM/CJS issues with the root package)
- The workspace root does NOT have `"type": "module"` — only the sub-packages do
- `pnpm install` must be re-run if `package.json` files are modified
- The review file (`docs/structured-output-implementation-review.md`) should be kept as-is — it's the reference for what was found
- Provider-aware JSON mode support (translating `responseFormat: 'json'` per provider) is a P1 item in the review but is a larger refactor — use a `// TODO` comment if not implementing fully in this pass
