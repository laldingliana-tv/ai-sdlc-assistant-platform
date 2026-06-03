# Continue: Implement Model Abstraction Layer (Part 1)

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
- **Phase 7:** Infrastructure & CI/CD (Docker Compose, Dockerfiles, GitHub Actions pipelines)

The full implementation plan is at `docs/MODEL_ABSTRACTION_LAYER_REVISED_FINAL_PLAN.md`.

## Key Conventions Established

- **Package naming:** `@ai-sdlc/<scope>-<name>` (e.g., `@ai-sdlc/agents-core`, `@ai-sdlc/shared-types`)
- **Path aliases** in `tsconfig.base.json`: `@ai-sdlc/shared/types`, `@ai-sdlc/agents/core`, etc. (use `./` prefix, no `baseUrl`)
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
  Note: `libs/ai/model-gateway` is 3 levels deep from root, so extend path is `../../../tsconfig.base.json`.

## Existing Architecture Summary

### Current AI/LLM State

- **Dependencies installed:** `@langchain/core@^1.1.48`, `@langchain/langgraph@^1.3.3`, `@langchain/openai@^1.4.7`
- **Dependencies NOT installed (need adding):** `@langchain/anthropic`, `@langchain/google-genai`
- **5 Agents exist:** Planner, Retriever, Architecture, Implementor, Reviewer — all are **stubs returning mock golden-demo responses**
- **Zero real LLM calls** anywhere in the codebase
- **Prompt registry exists** (`libs/shared/prompts`) with `PromptRegistry` singleton and `PromptTemplate` types — but no templates are registered
- **BaseAgent interface** (`libs/agents/core`) uses LangGraph `CompiledGraph`
- **TokenUsage type** already defined in `libs/shared/types/src/agent.ts`

### Key Existing Types

```typescript
// libs/shared/types/src/agent.ts
export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

```typescript
// libs/shared/prompts/src/types.ts
export interface ModelConfig {
  model: string; // Will be used as profile name
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: PromptVariable[];
  modelConfig?: ModelConfig;
  version: string;
}
```

```typescript
// libs/agents/core/src/agent.interface.ts
export interface BaseAgent {
  readonly name: string;
  createGraph(): CompiledGraph;
  invoke(input: AgentInput): Promise<AgentOutput>;
}
```

### Environment Variables (New for this task)

| Variable            | Purpose                              |
| ------------------- | ------------------------------------ |
| `OPENAI_API_KEY`    | OpenAI provider (already referenced) |
| `ANTHROPIC_API_KEY` | Anthropic provider (new)             |
| `GOOGLE_API_KEY`    | Google Generative AI provider (new)  |

## Task: Implement Model Abstraction Layer (Part 1)

**Branch:** Create a new feature branch `feature/model-gateway` from `develop`.

**Goal:** Build `libs/ai/model-gateway` — a Model Gateway library that enables agents to make real LLM calls through capability-based profiles, without coupling to any specific provider.

### Design Principles

1. **Agents request models by capability profile** (e.g., `'planning'`, `'coding'`) — never by provider name
2. **Providers are thin adapters** over LangChain model classes — they configure, not re-implement
3. **The gateway resolves profiles to models** using a registry and returns unified responses
4. **Token usage is captured from day one** — read from LangChain's `usage_metadata` response field
5. **No middleware, no retries, no fallbacks, no rate-limiting** — those are deferred to Part 2

### Files to Implement

#### Library Setup (3 files)

| #   | File Path                             | Purpose                          |
| --- | ------------------------------------- | -------------------------------- |
| 1   | `libs/ai/model-gateway/package.json`  | Library package manifest         |
| 2   | `libs/ai/model-gateway/tsconfig.json` | TypeScript config extending root |
| 3   | `libs/ai/model-gateway/src/index.ts`  | Public API barrel export         |

#### Interfaces (2 files)

| #   | File Path                                                         | Purpose                                                                               |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 4   | `libs/ai/model-gateway/src/interfaces/model-gateway.interface.ts` | Core gateway contract (ModelGateway, ModelRequest, ModelResponse, ModelProfile, etc.) |
| 5   | `libs/ai/model-gateway/src/interfaces/model-config.interface.ts`  | Configuration types (ModelDefinition, ProfileMapping, ProviderType, ModelCapability)  |

#### Providers (4 files)

| #   | File Path                                                   | Purpose                                                                                 |
| --- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 6   | `libs/ai/model-gateway/src/providers/provider.interface.ts` | Provider adapter contract (ModelProviderAdapter, ProviderOptions, ProviderHealthStatus) |
| 7   | `libs/ai/model-gateway/src/providers/openai.provider.ts`    | OpenAI thin adapter over `ChatOpenAI`                                                   |
| 8   | `libs/ai/model-gateway/src/providers/anthropic.provider.ts` | Anthropic thin adapter over `ChatAnthropic`                                             |
| 9   | `libs/ai/model-gateway/src/providers/google.provider.ts`    | Google thin adapter over `ChatGoogleGenerativeAI`                                       |

#### Registry (1 file)

| #   | File Path                                              | Purpose                                                                       |
| --- | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| 10  | `libs/ai/model-gateway/src/registry/model-registry.ts` | Central registry: catalog + profiles + provider resolution + instance caching |

#### Catalog & Config (2 files)

| #   | File Path                                              | Purpose                                                                                                                   |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| 11  | `libs/ai/model-gateway/src/catalog/models.catalog.ts`  | Slim model catalog (id, provider, modelName, capabilities, contextWindow, maxOutputTokens, streaming/toolCalling support) |
| 12  | `libs/ai/model-gateway/src/config/default-profiles.ts` | Default profile mappings (planning→claude, coding→claude, review→gpt, retrieval→gemini-flash, summarization→gemini-flash) |

#### Gateway Service (1 file)

| #   | File Path                                                    | Purpose                                                                                                                  |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| 13  | `libs/ai/model-gateway/src/gateway/model-gateway.service.ts` | Main implementation: resolves profiles, creates models, invokes with messages, returns unified response with token usage |

#### Tests (2 files)

| #   | File Path                                                | Purpose                                                                     |
| --- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| 14  | `libs/ai/model-gateway/__tests__/model-registry.spec.ts` | Unit tests for registry (registration, resolution, caching, error cases)    |
| 15  | `libs/ai/model-gateway/__tests__/model-gateway.spec.ts`  | Unit tests for gateway service (mocked providers, invoke flow, stream flow) |

#### Integration (3 files to modify)

| #   | File Path             | Change                                                                                 |
| --- | --------------------- | -------------------------------------------------------------------------------------- |
| 16  | `tsconfig.base.json`  | Add path alias `"@ai-sdlc/ai/model-gateway": ["./libs/ai/model-gateway/src/index.ts"]` |
| 17  | `package.json` (root) | Add dependencies: `@langchain/anthropic`, `@langchain/google-genai`                    |
| 18  | `pnpm-lock.yaml`      | Updated via `pnpm install` after dependency addition                                   |

**Total: 15 new files + 2 modified files + lockfile update**

---

## Interface Specifications

### `model-gateway.interface.ts`

```typescript
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseMessage } from '@langchain/core/messages';

export interface ModelGateway {
  invoke(request: ModelRequest): Promise<ModelResponse>;
  stream(request: ModelRequest): AsyncIterable<ModelStreamChunk>;
  getModel(profile: ModelProfile): BaseChatModel;
}

export interface ModelProfile {
  name: string; // 'planning' | 'coding' | 'review' | 'retrieval' | 'summarization'
  overrides?: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'text' | 'json';
  };
}

export interface ModelRequest {
  profile: ModelProfile;
  messages: BaseMessage[];
  tools?: ToolDefinition[];
  metadata?: RequestMetadata;
}

export interface ModelResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: TokenUsage;
  metadata: ResponseMetadata;
}

export interface ModelStreamChunk {
  content?: string;
  toolCallDelta?: Partial<ToolCall>;
  done: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface RequestMetadata {
  agentName?: string;
  taskId?: string;
  traceId?: string;
}

export interface ResponseMetadata {
  modelId: string;
  provider: string;
  latencyMs: number;
}
```

### `model-config.interface.ts`

```typescript
export type ProviderType = 'openai' | 'anthropic' | 'google';

export type ModelCapability =
  | 'coding'
  | 'reasoning'
  | 'planning'
  | 'summarization'
  | 'vision'
  | 'large-context'
  | 'fast'
  | 'tool-calling';

export interface ModelDefinition {
  id: string;
  provider: ProviderType;
  modelName: string;
  capabilities: ModelCapability[];
  contextWindow: number;
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
}

export interface ProfileMapping {
  profileName: string;
  primaryModelId: string;
  temperature: number;
  maxTokens: number;
}
```

### `provider.interface.ts`

```typescript
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ModelDefinition, ProviderType } from '../interfaces/model-config.interface.js';

export interface ModelProviderAdapter {
  readonly providerType: ProviderType;
  createModel(definition: ModelDefinition, options?: ProviderOptions): BaseChatModel;
  validateConfig(): ProviderHealthStatus;
}

export interface ProviderOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

export interface ProviderHealthStatus {
  healthy: boolean;
  provider: ProviderType;
  error?: string;
}
```

---

## Model Catalog (Slim)

Include these models:

| ID                 | Provider  | Model Name                 | Key Capabilities                                         |
| ------------------ | --------- | -------------------------- | -------------------------------------------------------- |
| `claude-4-sonnet`  | anthropic | `claude-sonnet-4-20250514` | coding, reasoning, planning, tool-calling, large-context |
| `gpt-4.1`          | openai    | `gpt-4.1`                  | coding, reasoning, planning, tool-calling, large-context |
| `gpt-4.1-mini`     | openai    | `gpt-4.1-mini`             | fast, summarization, tool-calling                        |
| `gemini-2.5-pro`   | google    | `gemini-2.5-pro`           | coding, reasoning, planning, large-context, tool-calling |
| `gemini-2.5-flash` | google    | `gemini-2.5-flash`         | fast, summarization, large-context, tool-calling         |

---

## Default Profile Mappings

| Profile         | Primary Model    | Temperature | Max Tokens |
| --------------- | ---------------- | ----------- | ---------- |
| `planning`      | claude-4-sonnet  | 0.3         | 4096       |
| `coding`        | claude-4-sonnet  | 0.1         | 8192       |
| `review`        | gpt-4.1          | 0.2         | 4096       |
| `retrieval`     | gemini-2.5-flash | 0.0         | 2048       |
| `summarization` | gemini-2.5-flash | 0.1         | 1024       |

---

## Gateway Service Implementation Notes

The `ModelGatewayService` must:

1. Accept a `ModelRegistry` (injected via constructor)
2. Resolve profile name → `ModelDefinition` + `ProfileMapping` via registry
3. Get/create a LangChain `BaseChatModel` instance via registry (cached)
4. Call `model.invoke(messages, { temperature, maxTokens })` for `invoke()`
5. Call `model.stream(messages, { temperature, maxTokens })` for `stream()`
6. Extract `usage_metadata` from LangChain response for token counts
7. Measure latency via `performance.now()`
8. Return unified `ModelResponse` with content, toolCalls, usage, metadata

---

## Registry Implementation Notes

The `ModelRegistry` must:

1. Store `ModelDefinition` entries by ID
2. Store `ProfileMapping` entries by profile name
3. Store `ModelProviderAdapter` entries by provider type
4. Cache `BaseChatModel` instances by model ID (models are stateless HTTP clients, safe to reuse)
5. Expose `resolveProfile(name)` → `{ definition, mapping }`
6. Expose `createModel(definition)` → `BaseChatModel` (from cache or freshly created via provider)
7. Expose `healthCheck()` → provider health statuses
8. Throw clear errors for missing profiles, models, or providers

---

## Provider Implementation Notes

Each provider adapter:

1. Implements `ModelProviderAdapter`
2. Creates the corresponding LangChain model class (`ChatOpenAI`, `ChatAnthropic`, `ChatGoogleGenerativeAI`)
3. Reads API key from `process.env` (with optional override via `ProviderOptions`)
4. Sets timeout (OpenAI: 60s, Anthropic: 120s, Google: 60s defaults)
5. `validateConfig()` checks if the API key environment variable is set

---

## Test Requirements

### `model-registry.spec.ts`

Test:

- Registering and resolving models
- Registering and resolving profiles
- Error on unknown profile
- Error on model not in catalog
- Error on missing provider
- Instance caching (same model ID returns same instance)
- Health check aggregation

### `model-gateway.spec.ts`

Test:

- Invoking via profile returns unified response
- Token usage is extracted from LangChain response
- Latency is measured
- Streaming yields chunks and final `done: true`
- Profile overrides (temperature, maxTokens) are applied
- Tool calls are mapped correctly

Use mocks for LangChain model classes — do NOT make real API calls in tests.

---

## Technical Requirements

1. **Create a feature branch:** `git checkout -b feature/model-gateway` from `develop`
2. All imports use `.js` extension (ESM)
3. No `default` exports — use named exports only
4. The library must compile cleanly with `pnpm nx run ai-model-gateway:typecheck` (or the inferred Nx typecheck target)
5. Tests must pass with `pnpm nx run ai-model-gateway:test`
6. The `index.ts` barrel must export all public interfaces, types, classes, and the catalog/profiles
7. Do NOT modify any existing agent code in this task — agent integration comes next
8. Run `pnpm install` after adding new dependencies to update the lockfile
9. Verify no TypeScript errors across the workspace after adding the path alias
10. Commit with conventional commit: `feat(ai): add model-gateway library with provider abstraction`

## Notes

- The plan document at `docs/MODEL_ABSTRACTION_LAYER_REVISED_FINAL_PLAN.md` has full code examples for every file — use them as reference but adapt to actual LangChain API shapes
- The `TokenUsage` type in `model-gateway.interface.ts` mirrors the existing one in `libs/shared/types/src/agent.ts` — keep them compatible but defined locally (avoid circular dependency). The gateway's response can be directly assigned to `AgentOutput.tokenUsage`
- The `ModelConfig.model` field in `libs/shared/prompts` will be used as the profile name in future agent integration — no changes needed to prompts now
- LangChain's `BaseChatModel.invoke()` returns an `AIMessage` with `.content`, `.tool_calls`, and `.usage_metadata` — map these to our `ModelResponse`
