# Continue: Address Model Abstraction Layer Part 1 Review Findings

## Context

I'm building the **AI SDLC Assistant Platform** — an Nx monorepo at `c:\Users\VantawlL\projects\ai-sdlc-assistant-platform`.

**Already completed:**

- **Phase 1:** Monorepo foundation (Nx, pnpm workspace, tsconfig, eslint, prettier, husky, lint-staged)
- **Phase 2:** Shared contracts & types (`libs/shared/types`, `libs/shared/schemas`, `libs/shared/constants`, `libs/shared/prompts`)
- **Phase 2B:** Observability libs (`libs/infra/telemetry` with pino/OTel/Langfuse, `libs/infra/logging` with NestJS adapter)
- **Phase 3:** Backend API (`apps/api` with NestJS+Fastify, `libs/infra/database` with Prisma, `libs/infra/auth`, `libs/infra/governance`)
- **Phase 4:** Agent Layer + MCP + Evaluations (`libs/agents/core`, `libs/agents/{planner,retriever,reviewer,architecture,implementor}`, `libs/mcp`, `libs/evaluations`, `libs/agents/a2a`, `libs/agents/adk`)
- **Phase 5:** Temporal Workflow Orchestration (`apps/workers` with Temporal worker, SDLC workflow with approval gate, all agent activities, health probe; API wired to Temporal client)
- **Phase 6:** Frontend (Next.js 16 app with dashboard shell, task submission, workflow trace view, SSE streaming, dark/light theme, shadcn/ui components)
- **Phase 7:** Infrastructure & CI/CD (Docker Compose, Dockerfiles, GitHub Actions pipelines)
- **Model Gateway Library** (`libs/ai/model-gateway`) — interfaces, 3 provider adapters (OpenAI, Anthropic, Google), model registry with caching, gateway service, model catalog, default profiles, 21 passing unit tests

The review document is at `docs/model-abstraction-layer-part-1-implementation-review.md`.

## Key Conventions Established

- **Package naming:** `@ai-sdlc/<scope>-<name>` (e.g., `@ai-sdlc/agents-core`, `@ai-sdlc/shared-types`)
- **Path aliases** in `tsconfig.base.json`: `@ai-sdlc/shared/types`, `@ai-sdlc/agents/core`, `@ai-sdlc/ai/model-gateway`, etc. (use `./` prefix, no `baseUrl`)
- **All libs use** `"type": "module"` with `.js` extensions in imports
- **Nx version:** 22.7.5
- **TypeScript:** ~5.9.3
- **Node:** 20+
- **pnpm:** 9.12.3
- **Lib package.json pattern:**
  ```json
  {
    "name": "@ai-sdlc/<scope>-<name>",
    "version": "0.0.1",
    "private": true,
    "type": "module",
    "main": "./src/index.ts",
    "types": "./src/index.ts",
    "exports": {
      ".": "./src/index.ts"
    },
    "dependencies": {}
  }
  ```
- **Lib tsconfig.json pattern:**
  ```json
  {
    "extends": "../../../tsconfig.base.json",
    "compilerOptions": {
      "noEmit": true
    },
    "include": ["src/**/*.ts"],
    "exclude": ["node_modules", "dist"]
  }
  ```

## Current State of the Model Gateway

### What exists (`libs/ai/model-gateway`):

- **Interfaces:** `ModelGateway`, `ModelProfile`, `ModelRequest`, `ModelResponse`, `ModelStreamChunk`, `ToolDefinition`, `ToolCall`, `TokenUsage`, `RequestMetadata`, `ResponseMetadata`, `ModelDefinition`, `ProfileMapping`, `ProviderType`, `ModelCapability`, `ModelProviderAdapter`, `ProviderOptions`, `ProviderHealthStatus`
- **Providers:** `OpenAIProvider`, `AnthropicProvider`, `GoogleProvider` — thin adapters creating LangChain model instances
- **Registry:** `ModelRegistry` — stores models, profiles, providers; caches instances by composite key (model ID + temperature + maxTokens)
- **Gateway:** `ModelGatewayService` — resolves profiles, creates models, invokes, extracts usage, measures latency
- **Catalog:** 5 models (claude-4-sonnet, gpt-4.1, gpt-4.1-mini, gemini-2.5-pro, gemini-2.5-flash)
- **Profiles:** 5 defaults (planning→claude, coding→claude, review→gpt-4.1, retrieval→gemini-flash, summarization→gemini-flash)
- **Tests:** 21 passing (12 registry + 9 gateway)

### What agents currently look like (ALL are stubs):

Each agent (Planner, Retriever, Architecture, Implementor, Reviewer) has a pattern like:

```typescript
export class PlannerAgent implements BaseAgent {
  readonly name = 'planner';

  createGraph(): CompiledGraph {
    /* LangGraph stub */
  }

  async invoke(input: AgentInput): Promise<AgentOutput> {
    // Returns GOLDEN_DEMO_RESPONSE — no real LLM call
    return {
      agentName: this.name,
      status: 'completed',
      result: { content: GOLDEN_DEMO_RESPONSE },
      durationMs: 0,
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }
}
```

### BaseAgent interface (`libs/agents/core/src/agent.interface.ts`):

```typescript
export interface BaseAgent {
  readonly name: string;
  createGraph(): CompiledGraph;
  invoke(input: AgentInput): Promise<AgentOutput>;
}
```

### AgentInput/AgentOutput types (`libs/shared/types/src/agent.ts`):

```typescript
export interface AgentInput {
  taskId: string;
  context: Record<string, unknown>;
  previousResults?: Record<string, unknown>;
}

export interface AgentOutput {
  agentName: string;
  status: 'completed' | 'failed' | 'needs_review';
  result: Record<string, unknown>;
  durationMs: number;
  tokenUsage?: TokenUsage;
  error?: string;
}
```

### Environment Variables (for AI providers)

| Variable            | Purpose                       |
| ------------------- | ----------------------------- |
| `OPENAI_API_KEY`    | OpenAI provider               |
| `ANTHROPIC_API_KEY` | Anthropic provider            |
| `GOOGLE_API_KEY`    | Google Generative AI provider |

---

## Task: Address Review Findings

**Branch:** Continue on `feature/model-gateway`

**Goal:** Address all critical and medium issues from the implementation review, completing the remaining Part 1 delivery steps (agent integration, gateway factory, tool wiring, and quick fixes).

---

### Priority 1: Critical Fixes (Must Do)

#### 1A. Create Gateway Factory Function

Create `libs/ai/model-gateway/src/gateway/create-gateway.ts`:

```typescript
export function createModelGateway(): ModelGatewayService {
  const registry = new ModelRegistry();
  MODEL_CATALOG.forEach((m) => registry.registerModel(m));
  DEFAULT_PROFILES.forEach((p) => registry.registerProfile(p));
  registry.registerProvider(new OpenAIProvider());
  registry.registerProvider(new AnthropicProvider());
  registry.registerProvider(new GoogleProvider());
  return new ModelGatewayService(registry);
}
```

Export from `src/index.ts`.

#### 1B. Integrate All 5 Agents with the Model Gateway

For each agent (`PlannerAgent`, `RetrieverAgent`, `ArchitectureAgent`, `ImplementorAgent`, `ReviewerAgent`):

1. Add `ModelGateway` as a constructor parameter (keep `BaseAgent` interface unchanged — it describes the runtime contract, not construction)
2. Replace the canned `GOLDEN_DEMO_RESPONSE` with a real `gateway.invoke(...)` call
3. Use the appropriate profile for each agent:

| Agent             | Profile       | System Prompt Description                         |
| ----------------- | ------------- | ------------------------------------------------- |
| PlannerAgent      | `'planning'`  | Break down the task into structured work items    |
| RetrieverAgent    | `'retrieval'` | Identify relevant code/docs for the task          |
| ArchitectureAgent | `'planning'`  | Review proposal against architectural constraints |
| ImplementorAgent  | `'coding'`    | Generate code changes for the work items          |
| ReviewerAgent     | `'review'`    | Review output for quality and correctness         |

Each agent should:

- Accept `ModelGateway` in constructor
- Build messages from `AgentInput.context` (use `SystemMessage` + `HumanMessage`)
- Call `gateway.invoke({ profile: { name: '<profile>' }, messages, metadata: { agentName: this.name, taskId: input.taskId } })`
- Map `ModelResponse` → `AgentOutput` (content → result, usage → tokenUsage, latencyMs → durationMs)
- Wrap in try/catch: on failure, return `status: 'failed'` with error message

#### 1C. Wire Gateway into Temporal Activities

The Temporal worker instantiates agents in activity functions. Update:

- `apps/workers/src/activities/` — create a shared gateway instance and pass to each agent constructor
- Use `createModelGateway()` factory (called once at worker startup, not per-activity)

---

### Priority 2: Medium Fixes

#### 2A. Wire `tools` Field in Gateway Service

In `ModelGatewayService.invoke()`, when `request.tools` is provided, bind them to the model before invoking. Use LangChain's `.bindTools()`:

```typescript
let invocableModel = model;
if (request.tools && request.tools.length > 0) {
  invocableModel = model.bindTools(
    request.tools.map((t) => ({
      name: t.name,
      description: t.description,
      schema: t.parameters,
    })),
  );
}
const response = await invocableModel.invoke(request.messages);
```

#### 2B. Add `maxRetries: 0` to OpenAI Provider

For consistency with Anthropic/Google providers (no retry logic in Part 1):

```typescript
return new ChatOpenAI({
  model: definition.modelName,
  maxRetries: 0, // ← add this
  // ...
});
```

#### 2C. Round `latencyMs`

In `ModelGatewayService`:

```typescript
const latencyMs = Math.round(performance.now() - start);
```

#### 2D. Update Nx Test Executor

In `libs/ai/model-gateway/project.json`, change:

```json
"test": {
  "executor": "@nx/vitest:test",
  "options": { "config": "libs/ai/model-gateway/vitest.config.ts" }
}
```

---

### Priority 3: Non-Blocking (Nice to Have)

#### 3A. Add `baseUrl` to Cache Key

In `ModelRegistry.buildCacheKey()`:

```typescript
const baseUrlPart = options?.baseUrl ? `:u=${options.baseUrl}` : '';
return `${modelId}:t=${options.temperature ?? ''}:m=${options.maxTokens ?? ''}${baseUrlPart}`;
```

---

## Files to Create/Modify

### New Files (1)

| #   | File Path                                             | Purpose                                       |
| --- | ----------------------------------------------------- | --------------------------------------------- |
| 1   | `libs/ai/model-gateway/src/gateway/create-gateway.ts` | Factory function for fully configured gateway |

### Modified Files (10+)

| #   | File Path                                                    | Change                                                 |
| --- | ------------------------------------------------------------ | ------------------------------------------------------ |
| 2   | `libs/ai/model-gateway/src/index.ts`                         | Export `createModelGateway`                            |
| 3   | `libs/ai/model-gateway/src/gateway/model-gateway.service.ts` | Wire tools via `.bindTools()`, round latencyMs         |
| 4   | `libs/ai/model-gateway/src/providers/openai.provider.ts`     | Add `maxRetries: 0`                                    |
| 5   | `libs/ai/model-gateway/src/registry/model-registry.ts`       | Add `baseUrl` to cache key                             |
| 6   | `libs/ai/model-gateway/project.json`                         | Update test executor to `@nx/vitest:test`              |
| 7   | `libs/agents/planner/src/planner.agent.ts` (or equivalent)   | Inject gateway, replace stub with real call            |
| 8   | `libs/agents/retriever/src/retriever.agent.ts`               | Same                                                   |
| 9   | `libs/agents/architecture/src/architecture.agent.ts`         | Same                                                   |
| 10  | `libs/agents/implementor/src/implementor.agent.ts`           | Same                                                   |
| 11  | `libs/agents/reviewer/src/reviewer.agent.ts`                 | Same                                                   |
| 12  | `apps/workers/src/activities/*.ts`                           | Wire `createModelGateway()` into activity constructors |

---

## Agent Integration Pattern

Each agent should follow this pattern after modification:

```typescript
import type { ModelGateway } from '@ai-sdlc/ai/model-gateway';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import type { AgentInput, AgentOutput } from '@ai-sdlc/shared/types';
import type { BaseAgent } from '@ai-sdlc/agents/core';

export class PlannerAgent implements BaseAgent {
  readonly name = 'planner';

  constructor(private readonly gateway: ModelGateway) {}

  createGraph() {
    /* keep existing LangGraph structure or simplify */
  }

  async invoke(input: AgentInput): Promise<AgentOutput> {
    try {
      const taskDescription = (input.context['taskDescription'] as string) ?? '';
      const taskTitle = (input.context['taskTitle'] as string) ?? '';

      const response = await this.gateway.invoke({
        profile: { name: 'planning' },
        messages: [
          new SystemMessage(
            `You are a planning agent. Break down the following task into structured work items with clear acceptance criteria.`,
          ),
          new HumanMessage(`Task: ${taskTitle}\n\nDescription: ${taskDescription}`),
        ],
        metadata: { agentName: this.name, taskId: input.taskId },
      });

      return {
        agentName: this.name,
        status: 'completed',
        result: { content: response.content, toolCalls: response.toolCalls },
        durationMs: response.metadata.latencyMs,
        tokenUsage: response.usage,
      };
    } catch (error) {
      return {
        agentName: this.name,
        status: 'failed',
        result: {},
        durationMs: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
```

---

## Technical Requirements

1. All imports use `.js` extension (ESM)
2. No `default` exports — use named exports only
3. The gateway must still compile cleanly with `pnpm nx run ai-model-gateway:typecheck`
4. Tests must still pass with `pnpm nx run ai-model-gateway:test`
5. Agent tests should be updated to mock `ModelGateway` instead of expecting golden responses
6. The Temporal worker should create the gateway once at startup and share across activities
7. Agents must gracefully handle missing API keys (return `status: 'failed'` with descriptive error)
8. Do NOT add retry/fallback/middleware logic — that's Part 2
9. Verify no TypeScript errors across the workspace after changes
10. Commit with conventional commit: `feat(agents): integrate model-gateway into all agents`

---

## Notes

- The review document at `docs/model-abstraction-layer-part-1-implementation-review.md` has full context for every issue
- The `BaseAgent` interface should NOT be modified — agent injection happens via concrete class constructors
- The `PromptRegistry` integration (section 1.9 of the plan) can be deferred — agents can use inline system prompts for now and migrate to registry-based prompts later
- If an agent's API key is missing, the provider's `validateConfig()` will report unhealthy, but the gateway won't block construction. The error surfaces at `invoke()` time from the LangChain SDK — wrap this in try/catch in the agent
- The `createGraph()` method can remain a stub for now — LangGraph integration is a separate concern from getting real LLM responses flowing
