# Structured Output Implementation Review

**Branch:** `feature/structured-agent-output`  
**Reviewer:** Senior Tech Lead / Code Quality Review  
**Date:** 2026-06-04  
**Scope:** All changes related to structured output parsing, model gateway JSON mode, agent output schemas, and associated tests.

---

## Executive Summary

This implementation adds structured output support to all five agents (Planner, Retriever, Architecture, Implementor, Reviewer) via a graceful fallback pattern: agents request JSON mode from the model gateway, attempt to parse+validate the response against Zod schemas, and fall back to raw string content when parsing fails. The approach is architecturally sound, well-tested, and correctly layered. However, there are several issues ranging from moderate-severity correctness/security concerns to minor quality improvements that should be addressed before merge.

**Overall Assessment:** Approve with changes requested.

---

## 1. Critical & High-Severity Findings

### 1.1 [HIGH] Zod Version Mismatch Across Workspace

| File                               | Version    |
| ---------------------------------- | ---------- |
| `libs/agents/core/package.json`    | `^3.25.76` |
| `libs/shared/schemas/package.json` | `^3.23.8`  |
| `apps/api/package.json`            | `^3.23.8`  |
| `apps/web/package.json`            | `^3.23.8`  |

**Problem:** `@ai-sdlc/agents-core` declares `zod@^3.25.76` while `@ai-sdlc/shared/schemas` (which defines all the schemas) uses `zod@^3.23.8`. In a pnpm workspace, these may resolve to different instances of Zod. When `parseStructuredOutput()` in `agents/core` receives a schema created with a different Zod instance, `safeParse` can behave unpredictably, or worse, TypeScript infers incompatible types at compile time.

Additionally, `3.25.76` appears to be an invalid/non-existent Zod version — latest stable at time of writing is `3.24.x`. This suggests a typo or auto-generated entry.

**Recommendation:**

- Align all packages to the same Zod version (e.g., `^3.24.2` or the latest 3.x stable).
- Use a single `pnpm.overrides` entry or `catalog:` in `pnpm-workspace.yaml` to enforce a single resolution.

---

### 1.2 [HIGH] Unsafe Type Cast in Model Gateway — `bind()` Call

```typescript
// model-gateway.service.ts line 37-42
invocableModel = (
  invocableModel as unknown as {
    bind: (kwargs: Record<string, unknown>) => BaseChatModel;
  }
).bind({ response_format: { type: 'json_object' } });
```

**Problems:**

1. **Double `as unknown as` cast** — This bypasses all type safety. If the underlying model (e.g., some LangChain integrations for Anthropic or local models) does not support `bind()` with `response_format`, this will silently produce incorrect behavior or throw a runtime error with no guardrails.
2. **Provider incompatibility** — `response_format: { type: 'json_object' }` is an OpenAI-specific API parameter. Anthropic's Claude uses a different mechanism (`tool_use` with output schema or prompt-based JSON), and Google's Gemini has `responseMimeType`. Binding this parameter generically assumes all providers interpret it the same way — they do not.
3. **Tool + JSON mode conflict** — When both `responseFormat: 'json'` and `tools` are present, the code first binds `response_format`, then re-assigns `invocableModel` from the original `model` (not the response-format-bound model), effectively discarding the JSON binding:

```typescript
if (request.profile.overrides?.responseFormat === 'json') {
  invocableModel = (...).bind({ response_format: ... }); // sets invocableModel
}

if (request.tools && request.tools.length > 0) {
  invocableModel = (model as ...).bindTools(...); // overwrites from original `model`!
}
```

This is a **correctness bug**: if an agent ever uses both tools and JSON response format simultaneously, the JSON mode will be silently dropped.

**Recommendations:**

- Use LangChain's `withStructuredOutput()` method instead of raw `bind()` — it handles provider abstraction properly.
- If `bind()` must be used, chain it from `invocableModel` (not `model`) in the tools block to avoid overwriting.
- Add a runtime check or provider-specific adapter that maps `responseFormat: 'json'` to the appropriate parameter per provider.
- Consider logging a warning when JSON mode is requested on a provider that doesn't natively support it.

---

### 1.3 [HIGH] `stream()` Method Does Not Support JSON Response Format

The `stream()` method in `ModelGatewayService` does not apply `responseFormat` at all. If an agent ever uses streaming with structured output expectations, JSON mode will not be applied.

**Recommendation:** Apply the same `responseFormat` logic to `stream()` for consistency, or explicitly document/enforce that structured output agents must use `invoke()` only.

---

## 2. Medium-Severity Findings

### 2.1 [MEDIUM] No Observability on Parsing Failures

When `parseStructuredOutput` returns `null`, the agents silently fall back to unstructured content. There is no logging, metric, or telemetry emission to indicate that the model failed to produce valid structured output.

**Impact:** In production, you'll have no visibility into how often structured parsing fails, making it impossible to tune prompts or detect model regressions.

**Recommendation:**

- Emit a warning log or telemetry event when parsing fails (include agent name, task ID, and optionally the Zod error path).
- Consider storing the Zod validation errors in metadata for debugging.

---

### 2.2 [MEDIUM] `durationMs: 0` in Error Path Is Inaccurate

All agents report `durationMs: 0` in the catch block:

```typescript
} catch (error) {
  return {
    agentName: this.name,
    status: 'failed',
    durationMs: 0, // ← Always 0, even if the call took time before failing
    ...
  };
}
```

**Problem:** A gateway call that times out after 30 seconds will report `durationMs: 0`, which corrupts latency metrics and makes it impossible to distinguish fast failures from slow ones.

**Recommendation:** Capture `performance.now()` before the try block and compute actual elapsed time in the catch.

---

### 2.3 [MEDIUM] `retryable: false` Hard-Coded for All Errors

```typescript
error: {
  code: 'GATEWAY_ERROR',
  message: error instanceof Error ? error.message : 'Unknown error',
  retryable: false, // Always false
}
```

**Problem:** Transient errors (rate limits, timeouts, 503s) are classified as non-retryable. The `AgentError.retryable` field exists precisely for orchestration layers to make retry decisions; hard-coding `false` defeats its purpose.

**Recommendation:** Inspect error type/status code to determine retryability:

- Rate limit (429) → `retryable: true`
- Timeout → `retryable: true`
- Auth errors (401/403) → `retryable: false`
- Model errors (400) → `retryable: false`

---

### 2.4 [MEDIUM] Type Duplication Between Zod Schemas and TypeScript Interfaces

The `libs/shared/types/src/agent.ts` manually defines interfaces that are semantically identical to the Zod schemas in `libs/shared/schemas/src/agent.schema.ts`. This creates a maintenance burden where changes to one must be mirrored in the other.

**Recommendation:** Derive types from schemas using `z.infer<typeof Schema>`:

```typescript
export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;
export type ReviewerOutput = z.infer<typeof ReviewerOutputSchema>;
// etc.
```

This ensures types and runtime validation can never drift apart.

---

### 2.5 [MEDIUM] Prompt Injection Surface via `previousOutputs`

All agents pass `JSON.stringify(input.context.previousOutputs)` directly into the human message without sanitization:

```typescript
const previousOutputs =
  input.context.previousOutputs.length > 0 ? JSON.stringify(input.context.previousOutputs) : '';
```

**Risk:** If a prior agent's output (e.g., from the Retriever pulling external content) contains adversarial text designed to override the system prompt or manipulate structured output, it will be injected verbatim into the next agent's context.

**Recommendation:**

- Consider using LangChain's message separation more deliberately (e.g., tool messages or separate human messages for context vs. instruction).
- At minimum, truncate `previousOutputs` to a reasonable max length to limit attack surface.
- For defense-in-depth, validate that the `agent` discriminator field matches the calling agent after parsing (already implicitly done via Zod's `z.literal()`).

---

## 3. Low-Severity / Code Quality Findings

### 3.1 [LOW] `createGraph()` Method Is a Dead Code Path

Every agent implements `createGraph()` with a stub node that doesn't perform the actual LLM call:

```typescript
createGraph() {
  const graph = new StateGraph(ReviewerState)
    .addNode('review', async (state) => {
      return { output: state.input, findings: [], approved: false, ... };
    })
    ...
}
```

But the actual work happens in `invoke()` which calls the gateway directly. The compiled graph returned by `createGraph()` is never used in the `invoke()` flow.

**Impact:** This creates confusion about which execution path is canonical. Tests call both `createGraph()` and `invoke()` but they do completely different things.

**Recommendation:** Either integrate the gateway call into the graph execution flow (using LangGraph nodes properly) or remove `createGraph()` from the interface if it's planned for future use — in which case, mark it with a `// TODO` and skip testing the stub.

---

### 3.2 [LOW] Regex in `parseStructuredOutput` Is Fragile

````typescript
const cleaned = content
  .replace(/^```(?:json)?\s*\n?/i, '')
  .replace(/\n?```\s*$/i, '')
  .trim();
````

**Edge cases not handled:**

- Multiple code fences in a response (only strips outermost).
- Code fences with other language specifiers (e.g., ` ```jsonc`, ` ```json5`).
- Leading/trailing text before/after the code fence (e.g., "Here's the output:\n`json\n{...}\n`").

These will all cause `JSON.parse()` to fail, falling back gracefully to `null`. Given the graceful fallback, this is low severity but may reduce the parsing success rate unnecessarily.

**Recommendation:** Use a more robust extraction pattern:

````typescript
const fenceMatch = content.match(/```(?:json[c5]?)?\s*\n([\s\S]*?)\n```/i);
const jsonStr = fenceMatch ? fenceMatch[1] : content.trim();
````

---

### 3.3 [LOW] Missing Negative Test: Malformed JSON with Code Fences

The `structured-output.spec.ts` tests valid code fences but doesn't test cases like:

- `"Some text before\n```json\n{...}\n```\nsome text after"`
- Nested code fences
- Extremely large payloads

**Recommendation:** Add 2-3 edge case tests reflecting real-world model output patterns.

---

### 3.4 [LOW] Architecture Agent Test Missing "Still Returns Content When Parsing Fails"

The `architecture.agent.spec.ts` is the only agent spec that lacks a `'should still return content when JSON parsing fails'` test case. All other agents (Planner, Retriever, Reviewer) test this explicitly.

**Recommendation:** Add the missing test for consistency.

---

### 3.5 [LOW] Shared Schema `AgentOutputInput` Export Is Unused

```typescript
export type AgentOutputInput = z.input<typeof AgentOutputSchema>;
```

This type is defined but never imported or used anywhere in the codebase.

**Recommendation:** Remove it or use it as the canonical type definition (see 2.4).

---

## 4. Security Observations

| Concern                                | Status        | Notes                                                       |
| -------------------------------------- | ------------- | ----------------------------------------------------------- |
| Input validation on agent schemas      | ✅ Good       | Zod schemas enforce strict types, min lengths, and enums    |
| Prompt injection via `previousOutputs` | ⚠️ Medium     | See finding 2.5                                             |
| Unsafe JSON parsing                    | ✅ Safe       | Wrapped in try-catch; no `eval()` or unsafe deserialization |
| Information leakage in error messages  | ✅ Acceptable | Only surfaces `error.message`, not stack traces             |
| Denial of Service via large payloads   | ⚠️ Low        | No max-length enforcement on `content` before parsing       |

---

## 5. Architecture & Design Assessment

### Strengths

1. **Graceful degradation** — The fallback pattern (parse or return raw) is exactly right for LLM systems where output reliability varies.
2. **Single responsibility** — `parseStructuredOutput` is a pure function, easy to test and reuse.
3. **Discriminated union** — Using `z.discriminatedUnion('agent', [...])` is idiomatic and enables type-safe dispatch downstream.
4. **Schema-as-contract** — Zod schemas serve as both runtime validation and documentation of the expected output format.
5. **Test coverage** — Each agent has clear tests for both the structured and unstructured paths.

### Areas for Improvement

1. **Model Gateway abstraction** — The JSON mode binding is too tightly coupled to OpenAI's parameter format. The gateway should own the translation from `responseFormat: 'json'` to provider-specific parameters.
2. **LangGraph integration** — The `createGraph()` / `invoke()` duality suggests the graph isn't being used as intended. This should be resolved before adding more complex agent workflows.
3. **Telemetry gap** — No structured output success/failure metrics makes production debugging impossible.

---

## 6. Recommendations Summary (Prioritized)

| Priority | Item                                                          | Effort |
| -------- | ------------------------------------------------------------- | ------ |
| P0       | Fix Zod version mismatch (`^3.25.76` → aligned version)       | Small  |
| P0       | Fix tools + JSON mode conflict (overwritten `invocableModel`) | Small  |
| P1       | Add provider-aware JSON mode support in gateway               | Medium |
| P1       | Add observability/logging for parsing failures                | Small  |
| P1       | Fix `durationMs: 0` in error paths                            | Small  |
| P2       | Apply `responseFormat` in `stream()` or document limitation   | Small  |
| P2       | Derive TypeScript types from Zod schemas (DRY)                | Medium |
| P2       | Implement error retryability classification                   | Medium |
| P2       | Add `previousOutputs` size limiting                           | Small  |
| P3       | Improve code fence regex robustness                           | Small  |
| P3       | Add missing architecture agent fallback test                  | Small  |
| P3       | Resolve `createGraph()` vs `invoke()` duality                 | Medium |

---

## 7. Verdict

**Changes Requested** — The implementation demonstrates strong design principles and good test coverage. However, the Zod version mismatch (P0), the `invocableModel` overwrite bug (P0), and the lack of observability (P1) should be fixed before this branch is merged. The remaining items can be addressed in follow-up PRs.
