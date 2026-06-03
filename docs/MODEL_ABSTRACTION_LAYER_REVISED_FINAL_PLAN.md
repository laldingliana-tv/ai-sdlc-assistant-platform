# Model Abstraction Layer — Revised Final Plan

## Design Philosophy

Build the **minimum viable gateway** that gets real AI responses flowing through agents, then layer in resilience and observability once real traffic patterns emerge.

---

## Part 1: Immediate Implementation

### Objective

```
Agent → ModelGateway → Real LLM → Real Response
```

Prove the abstraction works with one agent, then roll out to all five.

---

### 1.1 Library Structure

```
libs/ai/model-gateway/
├── package.json
├── tsconfig.json
├── project.json
├── src/
│   ├── index.ts
│   │
│   ├── interfaces/
│   │   ├── model-gateway.interface.ts      # Core gateway contract
│   │   └── model-config.interface.ts       # Configuration types
│   │
│   ├── providers/
│   │   ├── provider.interface.ts           # Provider adapter contract
│   │   ├── openai.provider.ts
│   │   ├── anthropic.provider.ts
│   │   └── google.provider.ts
│   │
│   ├── registry/
│   │   └── model-registry.ts              # Registration + resolution
│   │
│   ├── catalog/
│   │   └── models.catalog.ts              # Available models (slim)
│   │
│   ├── gateway/
│   │   └── model-gateway.service.ts       # Main implementation
│   │
│   └── config/
│       └── default-profiles.ts            # Profile → model mappings
│
└── __tests__/
    ├── model-registry.spec.ts
    └── model-gateway.spec.ts
```

---

### 1.2 Interfaces

#### Gateway Contract

```typescript
// interfaces/model-gateway.interface.ts

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseMessage } from '@langchain/core/messages';

/**
 * Primary interface agents interact with.
 * Agents request models by capability profile — never by provider name.
 */
export interface ModelGateway {
  /** Invoke a model by profile. Handles resolution internally. */
  invoke(request: ModelRequest): Promise<ModelResponse>;

  /** Stream a model response. */
  stream(request: ModelRequest): AsyncIterable<ModelStreamChunk>;

  /** Get the raw LangChain model for advanced use (e.g., LangGraph binding). */
  getModel(profile: ModelProfile): BaseChatModel;
}

export interface ModelProfile {
  /** Named profile: 'planning', 'coding', 'review', 'retrieval', 'summarization' */
  name: string;
  /** Optional per-call overrides */
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

#### Configuration Types

```typescript
// interfaces/model-config.interface.ts

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

/**
 * Slim model definition — only what's functionally needed.
 */
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

/**
 * Maps a named profile to a model + default settings.
 */
export interface ProfileMapping {
  profileName: string;
  primaryModelId: string;
  temperature: number;
  maxTokens: number;
}
```

**Note:** `contextWindow` and `maxOutputTokens` are retained because they have functional implications — knowing whether a prompt fits a model's window is not metadata, it's a correctness requirement.

---

### 1.3 Provider Adapters

Thin adapters that configure LangChain model instances. They handle:

- API key resolution from environment
- Provider-specific constructor args
- Health validation (is the API key set?)

They do NOT handle: routing, retries, fallbacks, prompt management.

#### Provider Interface

```typescript
// providers/provider.interface.ts

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

#### Implementations

```typescript
// providers/openai.provider.ts

import { ChatOpenAI } from '@langchain/openai';

export class OpenAIProvider implements ModelProviderAdapter {
  readonly providerType = 'openai' as const;

  createModel(definition: ModelDefinition, options?: ProviderOptions): ChatOpenAI {
    return new ChatOpenAI({
      modelName: definition.modelName,
      maxTokens: definition.maxOutputTokens,
      openAIApiKey: options?.apiKey ?? process.env.OPENAI_API_KEY,
      configuration: { baseURL: options?.baseUrl },
      timeout: options?.timeout ?? 60_000,
    });
  }

  validateConfig(): ProviderHealthStatus {
    const apiKey = process.env.OPENAI_API_KEY;
    return {
      healthy: !!apiKey,
      provider: 'openai',
      error: apiKey ? undefined : 'OPENAI_API_KEY not set',
    };
  }
}
```

```typescript
// providers/anthropic.provider.ts

import { ChatAnthropic } from '@langchain/anthropic';

export class AnthropicProvider implements ModelProviderAdapter {
  readonly providerType = 'anthropic' as const;

  createModel(definition: ModelDefinition, options?: ProviderOptions): ChatAnthropic {
    return new ChatAnthropic({
      modelName: definition.modelName,
      maxTokens: definition.maxOutputTokens,
      anthropicApiKey: options?.apiKey ?? process.env.ANTHROPIC_API_KEY,
      anthropicApiUrl: options?.baseUrl,
      clientOptions: { timeout: options?.timeout ?? 120_000 },
    });
  }

  validateConfig(): ProviderHealthStatus {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    return {
      healthy: !!apiKey,
      provider: 'anthropic',
      error: apiKey ? undefined : 'ANTHROPIC_API_KEY not set',
    };
  }
}
```

```typescript
// providers/google.provider.ts

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export class GoogleProvider implements ModelProviderAdapter {
  readonly providerType = 'google' as const;

  createModel(definition: ModelDefinition, options?: ProviderOptions): ChatGoogleGenerativeAI {
    return new ChatGoogleGenerativeAI({
      modelName: definition.modelName,
      maxOutputTokens: definition.maxOutputTokens,
      apiKey: options?.apiKey ?? process.env.GOOGLE_API_KEY,
    });
  }

  validateConfig(): ProviderHealthStatus {
    const apiKey = process.env.GOOGLE_API_KEY;
    return {
      healthy: !!apiKey,
      provider: 'google',
      error: apiKey ? undefined : 'GOOGLE_API_KEY not set',
    };
  }
}
```

---

### 1.4 Model Registry

Simple registration and profile-to-model resolution. No complex routing strategies.

```typescript
// registry/model-registry.ts

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type {
  ModelDefinition,
  ProfileMapping,
  ProviderType,
} from '../interfaces/model-config.interface.js';
import type { ModelProviderAdapter } from '../providers/provider.interface.js';

export class ModelRegistry {
  private catalog = new Map<string, ModelDefinition>();
  private profiles = new Map<string, ProfileMapping>();
  private providers = new Map<ProviderType, ModelProviderAdapter>();
  private instanceCache = new Map<string, BaseChatModel>();

  registerModel(definition: ModelDefinition): void {
    this.catalog.set(definition.id, definition);
  }

  registerProfile(mapping: ProfileMapping): void {
    this.profiles.set(mapping.profileName, mapping);
  }

  registerProvider(adapter: ModelProviderAdapter): void {
    this.providers.set(adapter.providerType, adapter);
  }

  resolveProfile(profileName: string): { definition: ModelDefinition; mapping: ProfileMapping } {
    const mapping = this.profiles.get(profileName);
    if (!mapping) throw new Error(`Unknown model profile: "${profileName}"`);

    const definition = this.catalog.get(mapping.primaryModelId);
    if (!definition) throw new Error(`Model not in catalog: "${mapping.primaryModelId}"`);

    return { definition, mapping };
  }

  createModel(definition: ModelDefinition): BaseChatModel {
    const cacheKey = definition.id;
    const cached = this.instanceCache.get(cacheKey);
    if (cached) return cached;

    const provider = this.providers.get(definition.provider);
    if (!provider) throw new Error(`No provider registered for: "${definition.provider}"`);

    const instance = provider.createModel(definition);
    this.instanceCache.set(cacheKey, instance);
    return instance;
  }

  healthCheck(): ProviderHealthStatus[] {
    return Array.from(this.providers.values()).map((p) => p.validateConfig());
  }

  getDefinition(modelId: string): ModelDefinition | undefined {
    return this.catalog.get(modelId);
  }

  listProfiles(): string[] {
    return Array.from(this.profiles.keys());
  }
}
```

---

### 1.5 Model Catalog (Slim)

```typescript
// catalog/models.catalog.ts

import type { ModelDefinition } from '../interfaces/model-config.interface.js';

export const MODEL_CATALOG: ModelDefinition[] = [
  // --- Anthropic ---
  {
    id: 'claude-4-sonnet',
    provider: 'anthropic',
    modelName: 'claude-sonnet-4-20250514',
    capabilities: ['coding', 'reasoning', 'planning', 'tool-calling', 'large-context'],
    contextWindow: 200_000,
    maxOutputTokens: 16_384,
    supportsStreaming: true,
    supportsToolCalling: true,
  },

  // --- OpenAI ---
  {
    id: 'gpt-4.1',
    provider: 'openai',
    modelName: 'gpt-4.1',
    capabilities: ['coding', 'reasoning', 'planning', 'tool-calling', 'large-context'],
    contextWindow: 1_000_000,
    maxOutputTokens: 32_768,
    supportsStreaming: true,
    supportsToolCalling: true,
  },
  {
    id: 'gpt-4.1-mini',
    provider: 'openai',
    modelName: 'gpt-4.1-mini',
    capabilities: ['fast', 'summarization', 'tool-calling'],
    contextWindow: 1_000_000,
    maxOutputTokens: 16_384,
    supportsStreaming: true,
    supportsToolCalling: true,
  },

  // --- Google ---
  {
    id: 'gemini-2.5-pro',
    provider: 'google',
    modelName: 'gemini-2.5-pro',
    capabilities: ['coding', 'reasoning', 'planning', 'large-context', 'tool-calling'],
    contextWindow: 1_000_000,
    maxOutputTokens: 65_536,
    supportsStreaming: true,
    supportsToolCalling: true,
  },
  {
    id: 'gemini-2.5-flash',
    provider: 'google',
    modelName: 'gemini-2.5-flash',
    capabilities: ['fast', 'summarization', 'large-context', 'tool-calling'],
    contextWindow: 1_000_000,
    maxOutputTokens: 65_536,
    supportsStreaming: true,
    supportsToolCalling: true,
  },
];
```

---

### 1.6 Default Profiles

```typescript
// config/default-profiles.ts

import type { ProfileMapping } from '../interfaces/model-config.interface.js';

export const DEFAULT_PROFILES: ProfileMapping[] = [
  {
    profileName: 'planning',
    primaryModelId: 'claude-4-sonnet',
    temperature: 0.3,
    maxTokens: 4096,
  },
  {
    profileName: 'coding',
    primaryModelId: 'claude-4-sonnet',
    temperature: 0.1,
    maxTokens: 8192,
  },
  {
    profileName: 'review',
    primaryModelId: 'gpt-4.1',
    temperature: 0.2,
    maxTokens: 4096,
  },
  {
    profileName: 'retrieval',
    primaryModelId: 'gemini-2.5-flash',
    temperature: 0.0,
    maxTokens: 2048,
  },
  {
    profileName: 'summarization',
    primaryModelId: 'gemini-2.5-flash',
    temperature: 0.1,
    maxTokens: 1024,
  },
];
```

---

### 1.7 Gateway Service (Core Implementation)

```typescript
// gateway/model-gateway.service.ts

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type {
  ModelGateway,
  ModelProfile,
  ModelRequest,
  ModelResponse,
  ModelStreamChunk,
} from '../interfaces/model-gateway.interface.js';
import type { ModelRegistry } from '../registry/model-registry.js';

export class ModelGatewayService implements ModelGateway {
  constructor(private readonly registry: ModelRegistry) {}

  getModel(profile: ModelProfile): BaseChatModel {
    const { definition, mapping } = this.registry.resolveProfile(profile.name);
    const model = this.registry.createModel(definition);

    // Apply profile defaults + any per-call overrides
    return model.bind({
      temperature: profile.overrides?.temperature ?? mapping.temperature,
      maxTokens: profile.overrides?.maxTokens ?? mapping.maxTokens,
    });
  }

  async invoke(request: ModelRequest): Promise<ModelResponse> {
    const { definition, mapping } = this.registry.resolveProfile(request.profile.name);
    const model = this.registry.createModel(definition);

    const start = performance.now();

    const response = await model.invoke(request.messages, {
      temperature: request.profile.overrides?.temperature ?? mapping.temperature,
      maxTokens: request.profile.overrides?.maxTokens ?? mapping.maxTokens,
    });

    const latencyMs = Math.round(performance.now() - start);

    return {
      content:
        typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
      toolCalls: response.tool_calls?.map((tc) => ({
        id: tc.id ?? '',
        name: tc.name,
        arguments: tc.args,
      })),
      usage: {
        promptTokens: response.usage_metadata?.input_tokens ?? 0,
        completionTokens: response.usage_metadata?.output_tokens ?? 0,
        totalTokens: response.usage_metadata?.total_tokens ?? 0,
      },
      metadata: {
        modelId: definition.id,
        provider: definition.provider,
        latencyMs,
      },
    };
  }

  async *stream(request: ModelRequest): AsyncIterable<ModelStreamChunk> {
    const { definition, mapping } = this.registry.resolveProfile(request.profile.name);
    const model = this.registry.createModel(definition);

    const stream = await model.stream(request.messages, {
      temperature: request.profile.overrides?.temperature ?? mapping.temperature,
      maxTokens: request.profile.overrides?.maxTokens ?? mapping.maxTokens,
    });

    for await (const chunk of stream) {
      yield {
        content: typeof chunk.content === 'string' ? chunk.content : undefined,
        done: false,
      };
    }

    yield { done: true };
  }
}
```

---

### 1.8 Token Usage: Record From Day One

LangChain returns `usage_metadata` on every response for free. The gateway captures it in `ModelResponse.usage` without any additional infrastructure. No middleware needed — it's just reading a field off the response object.

This means from the very first real LLM call, you have token counts. When you later want dashboards or budget enforcement (Part 2), you already have the data flowing through.

---

### 1.9 Prompt ↔ Profile Integration

The existing `PromptTemplate.modelConfig` field connects to profiles:

```typescript
// Existing type in libs/shared/prompts/src/types.ts
export interface ModelConfig {
  model: string; // This becomes the profile name: 'planning', 'coding', etc.
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}
```

Agents use it like:

```typescript
const template = promptRegistry.getOrThrow('planner-system');
const rendered = promptRegistry.render('planner-system', { taskTitle, taskDescription });

// Template's modelConfig.model = 'planning' → used as profile name
const response = await gateway.invoke({
  profile: { name: template.modelConfig!.model },
  messages: [new SystemMessage(rendered), new HumanMessage(description)],
});
```

---

### 1.10 Agent Integration Pattern

```typescript
// How agents use the gateway (target state for each agent)

export class PlannerAgent implements BaseAgent {
  readonly name = 'planner';

  constructor(
    private readonly gateway: ModelGateway,
    private readonly prompts: PromptRegistry,
  ) {}

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const systemPrompt = this.prompts.render('planner-system', {
      taskTitle: input.context.taskTitle,
      taskDescription: input.context.taskDescription,
    });

    const response = await this.gateway.invoke({
      profile: { name: 'planning' },
      messages: [new SystemMessage(systemPrompt), new HumanMessage(input.context.taskDescription)],
      metadata: { agentName: this.name, taskId: input.taskId },
    });

    return {
      agentName: this.name,
      status: 'completed',
      result: { content: response.content },
      durationMs: response.metadata.latencyMs,
      tokenUsage: response.usage,
    };
  }
}
```

---

### 1.11 Dependencies to Install

```bash
pnpm add @langchain/anthropic @langchain/google-genai
```

Already present: `@langchain/core`, `@langchain/openai`

---

### 1.12 Delivery Steps

| Step | Action                                  | Success Criterion                                       |
| ---- | --------------------------------------- | ------------------------------------------------------- |
| 1    | Create `libs/ai/model-gateway` with Nx  | Library compiles, exports from index.ts                 |
| 2    | Implement interfaces + types            | Clean TypeScript, no runtime code yet                   |
| 3    | Implement 3 provider adapters           | Each creates valid LangChain model                      |
| 4    | Implement registry + catalog + profiles | `resolveProfile('planning')` → returns model definition |
| 5    | Implement gateway service               | `gateway.invoke(...)` calls real LLM                    |
| 6    | Unit tests                              | Registry resolution, provider creation, gateway flow    |
| 7    | Integrate PlannerAgent                  | Real Claude response for a planning task                |
| 8    | Integrate RetrieverAgent                | Real Gemini Flash response                              |
| 9    | Integrate ReviewerAgent                 | Real GPT response                                       |
| 10   | Remaining agents                        | All five agents using gateway                           |

---

### 1.13 What Part 1 Explicitly Does NOT Include

- No middleware pipeline
- No retry/fallback/rate-limiting logic
- No cost dashboards or budget enforcement
- No complex routing strategies
- No pricing data in the catalog
- No provider factories/proxies/bridges
- No advanced caching strategies

These are deferred to Part 2 with clear trigger criteria.

---

## Part 2: Full Implementation (Deferred)

### Trigger Criteria

Begin Part 2 only when ALL of these are true:

1. All five agents make real LLM calls through the gateway
2. You have observed actual failure patterns (timeouts, rate limits, errors)
3. You have real token usage data to base cost decisions on
4. You need multi-model fallbacks because a provider has gone down

---

### 2.1 Middleware Pipeline

Add cross-cutting concerns as a composable pipeline:

```
Request → Retry → Fallback → TokenTrack → RateLimit → LLM Call
```

#### Middleware Interface

```typescript
export interface ModelMiddleware {
  readonly name: string;
  handle(request: ModelRequest, next: () => Promise<ModelResponse>): Promise<ModelResponse>;
}
```

#### Retry Middleware

- Retries on transient errors (429, 500, 503)
- Exponential backoff with jitter
- Configurable max retries (default: 3)

#### Fallback Middleware

- On primary model failure, attempt fallback chain
- ProfileMapping gains `fallbackModelIds: string[]`
- Logs which model ultimately served the request

#### Token Tracking Middleware

- Records per-invocation: profile, model, tokens, cost, agent, task
- Emits events for downstream aggregation (database, dashboard)
- Budget enforcement: soft warnings, hard caps

#### Rate Limiter Middleware

- Per-provider request throttling (token bucket)
- Respects provider-published rate limits
- Queues excess requests vs. rejecting them

---

### 2.2 Extended Model Catalog

Add back when cost visibility becomes a priority:

```typescript
export interface ModelDefinition {
  // ... Part 1 fields ...
  costPer1kInput: number;
  costPer1kOutput: number;
  supportsStructuredOutput: boolean;
  deprecationDate?: string;
}
```

---

### 2.3 Fallback Chains

Extended profile mapping:

```typescript
export interface ProfileMapping {
  profileName: string;
  primaryModelId: string;
  fallbackModelIds: string[]; // Ordered fallback chain
  temperature: number;
  maxTokens: number;
  systemPromptId?: string;
}
```

| Profile       | Primary          | Fallback 1      | Fallback 2     |
| ------------- | ---------------- | --------------- | -------------- |
| planning      | claude-4-sonnet  | gpt-4.1         | gemini-2.5-pro |
| coding        | claude-4-sonnet  | gpt-4.1         | gemini-2.5-pro |
| review        | gpt-4.1          | claude-4-sonnet | —              |
| retrieval     | gemini-2.5-flash | gpt-4.1-mini    | —              |
| summarization | gemini-2.5-flash | gpt-4.1-mini    | —              |

---

### 2.4 Cost Governance

```typescript
export interface UsageRecord {
  timestamp: Date;
  profileName: string;
  modelId: string;
  agentName: string;
  taskId: string;
  usage: TokenUsage;
  costUsd: number;
}

export interface BudgetPolicy {
  dailyLimitUsd: number;
  perTaskLimitUsd: number;
  alertThresholdPercent: number;
}
```

---

### 2.5 Advanced Routing

If needed (unlikely for most teams):

- **Capability-based routing**: Match request requirements to model capabilities
- **Cost-optimized routing**: Prefer cheaper models when capability is equivalent
- **Latency-optimized routing**: Route to fastest available model
- **A/B testing**: Split traffic between models for quality comparison

---

### 2.6 Observability Integration

- OpenTelemetry spans per model invocation
- Structured logging: model, latency, tokens, cost, success/failure
- Dashboard: cost per agent, cost per task, model utilization, error rates
- Alerts: budget threshold, error rate spike, latency degradation

---

### 2.7 Part 2 Delivery Order

| Step | Trigger                        | What to Build                         |
| ---- | ------------------------------ | ------------------------------------- |
| 1    | First production timeout/error | RetryMiddleware                       |
| 2    | Provider outage                | FallbackMiddleware + fallback chains  |
| 3    | Cost visibility needed         | TokenTrackingMiddleware + cost fields |
| 4    | Hitting rate limits            | RateLimiterMiddleware                 |
| 5    | Multi-environment deploy       | Environment-based profile overrides   |
| 6    | Cost optimization needed       | Budget policies + alerts              |
| 7    | Quality comparison needed      | A/B routing                           |

---

## Dependency Graph

```
                @ai-sdlc/ai/model-gateway
                ┌────────────────────────┐
                │                        │
    depends on  │                        │  depends on
    ┌───────────┤                        ├──────────────┐
    ▼           │                        │              ▼
@langchain/core │                        │    @ai-sdlc/shared/types
@langchain/openai                        │    @ai-sdlc/shared/prompts
@langchain/anthropic                     │
@langchain/google-genai                  │
                └────────────────────────┘
                          ▲
                          │ depends on
                ┌─────────┴──────────┐
                │ libs/agents/core   │
                │ libs/agents/*      │
                └────────────────────┘
```

---

## Summary

| Concern                         | Part 1                | Part 2                     |
| ------------------------------- | --------------------- | -------------------------- |
| Provider adapters               | ✅ Implement          | —                          |
| Registry + profiles             | ✅ Implement          | —                          |
| Gateway service (invoke/stream) | ✅ Implement          | —                          |
| Model catalog (slim)            | ✅ Implement          | Extend with costs          |
| Token usage capture             | ✅ Read from response | Persist + dashboard        |
| Prompt ↔ profile link           | ✅ Implement          | —                          |
| Agent integration               | ✅ All 5 agents       | —                          |
| Retry                           | ❌ Skip               | ✅ On first errors         |
| Fallback chains                 | ❌ Skip               | ✅ On first outage         |
| Rate limiting                   | ❌ Skip               | ✅ On hitting limits       |
| Cost governance                 | ❌ Skip               | ✅ On cost visibility need |
| Middleware pipeline             | ❌ Skip               | ✅ Foundation for above    |
| Advanced routing                | ❌ Skip               | ✅ If ever needed          |
| Observability                   | ❌ Skip               | ✅ On production deploy    |
