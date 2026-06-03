# Model Abstraction Layer — Implementation Plan

## Executive Summary

Your instinct is correct: you need a **Model Abstraction Layer**. However, your proposed structure needs significant rethinking. Here's why, and here's the better design.

### Why Your Original Proposal Needs Adjustment

Your outline essentially reinvents what **LangChain already does** — LangChain's `BaseChatModel` IS a model abstraction (ChatOpenAI, ChatAnthropic, ChatGoogleGenerativeAI all implement it). Wrapping it again creates a "wrapper wrapper" anti-pattern.

What you're **actually missing** is not the model call abstraction, but rather:

1. **Model Selection** — Which model should which agent use?
2. **Configuration Management** — How are models configured per environment?
3. **Resilience** — What happens when a model fails? Retries? Fallbacks?
4. **Observability** — Token tracking, cost calculation, latency monitoring
5. **Governance** — Rate limits, budget caps, model approval policies

### The Right Mental Model

Think of it like a **database layer**:

- LangChain = Database Driver (pg, mysql2)
- Model Provider Layer = Connection Pool + Query Router + Metrics (like Prisma or TypeORM)
- Your Agents = Application code that calls the ORM

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AGENT LAYER                                   │
│  (PlannerAgent, RetrieverAgent, ArchitectureAgent, etc.)           │
│  Owns: reasoning logic, state machines, tool orchestration          │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ asks for "a model that can do X"
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MODEL GATEWAY (libs/ai/model-gateway)             │
│                                                                      │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────────┐ │
│  │ Model Router │  │ Model Factory │  │ Middleware Pipeline      │ │
│  │              │  │               │  │                          │ │
│  │ "planner" →  │  │ Creates pre-  │  │ retry → fallback →      │ │
│  │  claude-4    │  │ configured    │  │ token-track → rate-limit │ │
│  │              │  │ LangChain     │  │                          │ │
│  │ "reviewer" → │  │ ChatModel     │  └──────────────────────────┘ │
│  │  gpt-4.1    │  │ instances     │                                │
│  └──────────────┘  └───────────────┘                                │
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ Model Catalog       │  │ Usage Tracker                       │  │
│  │                     │  │                                     │  │
│  │ Available models,   │  │ Token counts, cost per invocation,  │  │
│  │ capabilities, costs │  │ budget enforcement                  │  │
│  └─────────────────────┘  └─────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ instantiates
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LANGCHAIN MODEL LAYER                             │
│  ChatOpenAI | ChatAnthropic | ChatGoogleGenerativeAI               │
│  (These make the actual HTTP calls to provider APIs)                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Ownership Boundaries

| Layer             | Library                      | Owns                                                                   | Does NOT Own                                           |
| ----------------- | ---------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| **Model Gateway** | `libs/ai/model-gateway`      | Model instantiation, configuration, routing, resilience, cost tracking | Reasoning logic, prompt content, tool orchestration    |
| **Agents**        | `libs/agents/*`              | Reasoning graphs, prompt assembly, tool selection, domain logic        | Which model to use, retry policies, rate limits        |
| **Prompts**       | `libs/shared/prompts`        | Template content, variable schemas, versioning                         | Model configuration, rendering into LangChain messages |
| **Shared Types**  | `libs/shared/types`          | Cross-cutting type contracts                                           | Implementation details                                 |
| **Config**        | Environment / runtime config | API keys, endpoint URLs, budget limits                                 | Business logic                                         |

### The Golden Rule

> **Agents should never directly instantiate `ChatOpenAI(...)` or any LangChain model class.**  
> They request a model from the Gateway by **capability profile** (e.g., "I need a coding-capable model with 128K context").

This means:

- Swapping from GPT-4.1 to Claude 4 requires **zero agent code changes**
- Adding a new provider (e.g., Mistral, Llama) requires **zero agent code changes**
- Changing retry/fallback strategy requires **zero agent code changes**

---

## 2. Interface Structure

### Core Contracts

```typescript
// libs/ai/model-gateway/src/interfaces/model-gateway.interface.ts

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseMessage } from '@langchain/core/messages';
import type { AIMessageChunk } from '@langchain/core/messages';

/**
 * The primary interface agents interact with.
 * Agents never see provider details — they ask for a model by profile.
 */
export interface ModelGateway {
  /**
   * Get a configured model instance for a given profile.
   * The gateway handles selection, configuration, and wrapping.
   */
  getModel(profile: ModelProfile): ChatModelInstance;

  /**
   * Invoke a model directly with messages (convenience method).
   * Handles routing, retries, fallbacks, and tracking internally.
   */
  invoke(request: ModelRequest): Promise<ModelResponse>;

  /**
   * Stream a model response (for real-time UX).
   */
  stream(request: ModelRequest): AsyncIterable<ModelStreamChunk>;
}

/**
 * A model profile describes WHAT capability is needed, not HOW to provide it.
 * This is the key abstraction — agents think in capabilities, not provider names.
 */
export interface ModelProfile {
  /** Named profile from the catalog (e.g., 'coding', 'planning', 'summarization') */
  name: string;

  /** Optional overrides for this specific call */
  overrides?: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'text' | 'json';
  };
}

/**
 * Unified request type that agents submit.
 */
export interface ModelRequest {
  profile: ModelProfile;
  messages: BaseMessage[];
  tools?: ToolDefinition[];
  metadata?: RequestMetadata;
}

/**
 * Unified response type agents receive.
 */
export interface ModelResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: TokenUsage;
  metadata: ResponseMetadata;
}

/**
 * Streaming chunk for real-time responses.
 */
export interface ModelStreamChunk {
  content?: string;
  toolCallDelta?: Partial<ToolCall>;
  done: boolean;
}
```

### Middleware Interface

```typescript
// libs/ai/model-gateway/src/interfaces/middleware.interface.ts

/**
 * Middleware intercepts model calls for cross-cutting concerns.
 * Inspired by Express/Koa middleware pattern.
 */
export interface ModelMiddleware {
  readonly name: string;

  /**
   * Wraps a model invocation. Call `next()` to proceed to the next middleware.
   */
  handle(request: ModelRequest, next: () => Promise<ModelResponse>): Promise<ModelResponse>;
}
```

### Configuration Interface

```typescript
// libs/ai/model-gateway/src/interfaces/model-config.interface.ts

/**
 * Defines a model available in the catalog.
 */
export interface ModelDefinition {
  id: string; // e.g., 'claude-4-sonnet'
  provider: ProviderType; // 'openai' | 'anthropic' | 'google'
  modelName: string; // Provider-specific name: 'claude-sonnet-4-20250514'
  capabilities: ModelCapability[]; // ['coding', 'reasoning', 'vision', 'large-context']
  contextWindow: number; // Max tokens (input + output)
  maxOutputTokens: number;
  costPer1kInput: number; // USD per 1K input tokens
  costPer1kOutput: number; // USD per 1K output tokens
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
  supportsStructuredOutput: boolean;
}

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
 * Maps a named profile to a specific model + configuration.
 */
export interface ProfileMapping {
  profileName: string; // 'coding', 'planning', etc.
  primaryModelId: string; // Which model to use
  fallbackModelIds: string[]; // Ordered fallback chain
  temperature: number;
  maxTokens: number;
  systemPromptId?: string; // Links to PromptRegistry
}
```

---

## 3. Provider Structure

### Design Philosophy

Providers are **thin adapters** — NOT full reimplementations. They:

1. Translate our `ModelDefinition` config into LangChain constructor args
2. Handle provider-specific quirks (auth patterns, endpoint URLs)
3. Expose a unified factory interface

```typescript
// libs/ai/model-gateway/src/providers/provider.interface.ts

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ModelDefinition } from '../interfaces/model-config.interface.js';

/**
 * Provider adapter — creates LangChain model instances from our config.
 */
export interface ModelProviderAdapter {
  readonly providerType: ProviderType;

  /**
   * Create a LangChain ChatModel from our model definition.
   */
  createModel(definition: ModelDefinition, options?: ProviderOptions): BaseChatModel;

  /**
   * Validate that the provider is properly configured (API keys, etc.)
   */
  validateConfig(): ProviderHealthStatus;
}

export interface ProviderOptions {
  apiKey?: string; // Override from env
  baseUrl?: string; // Custom endpoint (Azure, proxy, etc.)
  timeout?: number; // Request timeout in ms
  organization?: string; // OpenAI org ID
}

export interface ProviderHealthStatus {
  healthy: boolean;
  provider: ProviderType;
  error?: string;
}
```

### Provider Implementations

```typescript
// libs/ai/model-gateway/src/providers/openai.provider.ts

import { ChatOpenAI } from '@langchain/openai';
import type {
  ModelProviderAdapter,
  ProviderOptions,
  ProviderHealthStatus,
} from './provider.interface.js';
import type { ModelDefinition } from '../interfaces/model-config.interface.js';

export class OpenAIProvider implements ModelProviderAdapter {
  readonly providerType = 'openai' as const;

  createModel(definition: ModelDefinition, options?: ProviderOptions): ChatOpenAI {
    return new ChatOpenAI({
      modelName: definition.modelName,
      temperature: 0, // Default, overridden by profile
      maxTokens: definition.maxOutputTokens,
      openAIApiKey: options?.apiKey ?? process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: options?.baseUrl,
        organization: options?.organization,
      },
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
// libs/ai/model-gateway/src/providers/anthropic.provider.ts

import { ChatAnthropic } from '@langchain/anthropic';
import type {
  ModelProviderAdapter,
  ProviderOptions,
  ProviderHealthStatus,
} from './provider.interface.js';
import type { ModelDefinition } from '../interfaces/model-config.interface.js';

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
// libs/ai/model-gateway/src/providers/google.provider.ts

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type {
  ModelProviderAdapter,
  ProviderOptions,
  ProviderHealthStatus,
} from './provider.interface.js';
import type { ModelDefinition } from '../interfaces/model-config.interface.js';

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

### Why This Is Better Than Your Original Proposal

| Your Original                                        | This Design                             | Why                                                                        |
| ---------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `gemini.provider.ts` wraps raw HTTP                  | Thin adapter over LangChain             | LangChain handles auth, streaming, retries, serialization — don't reinvent |
| Each provider independently implements invoke/stream | Unified via LangChain's `BaseChatModel` | Guaranteed interface compatibility                                         |
| Provider knows about prompt formatting               | Provider only knows about connection    | Separation of concerns                                                     |

---

## 4. Agent ↔ Provider Relationship

### Current State (Broken)

```
Agent → directly creates ChatOpenAI → calls invoke()
       (tightly coupled, no fallback, no tracking)
```

### Target State (Decoupled)

```
Agent → requests model via Gateway → Gateway resolves profile →
  → Factory creates instance → Middleware wraps it → Agent uses it
```

### How Agents Will Use the Gateway

```typescript
// Example: PlannerAgent using the Model Gateway

import type { ModelGateway } from '@ai-sdlc/ai/model-gateway';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export class PlannerAgent implements BaseAgent {
  readonly name = 'planner';

  constructor(
    private readonly modelGateway: ModelGateway,
    private readonly promptRegistry: PromptRegistry,
  ) {}

  async invoke(input: AgentInput): Promise<AgentOutput> {
    // 1. Build the prompt (agent's responsibility)
    const systemPrompt = this.promptRegistry.render('planner-system', {
      taskTitle: input.context.taskTitle,
      taskDescription: input.context.taskDescription,
    });

    // 2. Request a model by capability profile (gateway's responsibility)
    const response = await this.modelGateway.invoke({
      profile: { name: 'planning' },
      messages: [new SystemMessage(systemPrompt), new HumanMessage(input.context.taskDescription)],
      metadata: {
        agentName: this.name,
        taskId: input.taskId,
      },
    });

    // 3. Parse the response (agent's responsibility)
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

### Profile-to-Model Mapping (Configuration, not code)

```typescript
// config/model-profiles.ts (or loaded from environment/database)

export const defaultProfileMappings: ProfileMapping[] = [
  {
    profileName: 'planning',
    primaryModelId: 'claude-4-sonnet', // Claude excels at structured planning
    fallbackModelIds: ['gpt-4.1', 'gemini-2.5-pro'],
    temperature: 0.3,
    maxTokens: 4096,
    systemPromptId: 'planner-system',
  },
  {
    profileName: 'coding',
    primaryModelId: 'claude-4-sonnet', // Best code generation
    fallbackModelIds: ['gpt-4.1', 'gemini-2.5-pro'],
    temperature: 0.1,
    maxTokens: 8192,
  },
  {
    profileName: 'review',
    primaryModelId: 'gpt-4.1', // Strong at finding issues
    fallbackModelIds: ['claude-4-sonnet'],
    temperature: 0.2,
    maxTokens: 4096,
  },
  {
    profileName: 'retrieval',
    primaryModelId: 'gemini-2.5-flash', // Fast + cheap for RAG
    fallbackModelIds: ['gpt-4.1-mini'],
    temperature: 0.0,
    maxTokens: 2048,
  },
  {
    profileName: 'summarization',
    primaryModelId: 'gemini-2.5-flash', // Fast + large context
    fallbackModelIds: ['gpt-4.1-mini'],
    temperature: 0.1,
    maxTokens: 1024,
  },
];
```

### Agent ↔ Profile Mapping

| Agent                 | Default Profile | Why                                                 |
| --------------------- | --------------- | --------------------------------------------------- |
| **PlannerAgent**      | `planning`      | Needs structured reasoning, medium cost acceptable  |
| **RetrieverAgent**    | `retrieval`     | Needs speed + large context for RAG, cost-sensitive |
| **ArchitectureAgent** | `coding`        | Needs deep technical reasoning + structured output  |
| **ImplementorAgent**  | `coding`        | Needs best code generation + large output           |
| **ReviewerAgent**     | `review`        | Needs strong analytical capability                  |

---

## 5. Registry Structure

### Model Registry (The Brain)

```typescript
// libs/ai/model-gateway/src/registry/model-registry.ts

import type {
  ModelDefinition,
  ProfileMapping,
  ProviderType,
} from '../interfaces/model-config.interface.js';
import type { ModelProviderAdapter } from '../providers/provider.interface.js';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

/**
 * Central registry that knows about all available models and how to create them.
 *
 * Responsibilities:
 * - Stores the model catalog (what's available)
 * - Stores profile mappings (what to use for what)
 * - Instantiates models via provider adapters
 * - Caches model instances (connection pooling equivalent)
 */
export class ModelRegistry {
  private catalog = new Map<string, ModelDefinition>();
  private profiles = new Map<string, ProfileMapping>();
  private providers = new Map<ProviderType, ModelProviderAdapter>();
  private instanceCache = new Map<string, BaseChatModel>();

  // --- Catalog Management ---

  registerModel(definition: ModelDefinition): void {
    this.catalog.set(definition.id, definition);
  }

  registerProfile(mapping: ProfileMapping): void {
    this.profiles.set(mapping.profileName, mapping);
  }

  registerProvider(adapter: ModelProviderAdapter): void {
    this.providers.set(adapter.providerType, adapter);
  }

  // --- Resolution ---

  resolveProfile(profileName: string): ModelDefinition {
    const mapping = this.profiles.get(profileName);
    if (!mapping) throw new Error(`Unknown model profile: ${profileName}`);

    const model = this.catalog.get(mapping.primaryModelId);
    if (!model) throw new Error(`Model not found in catalog: ${mapping.primaryModelId}`);

    return model;
  }

  getFallbacks(profileName: string): ModelDefinition[] {
    const mapping = this.profiles.get(profileName);
    if (!mapping) return [];

    return mapping.fallbackModelIds
      .map((id) => this.catalog.get(id))
      .filter((m): m is ModelDefinition => m !== undefined);
  }

  // --- Instance Creation ---

  createModelInstance(
    definition: ModelDefinition,
    overrides?: Partial<ProfileMapping>,
  ): BaseChatModel {
    const cacheKey = `${definition.id}:${JSON.stringify(overrides ?? {})}`;

    if (this.instanceCache.has(cacheKey)) {
      return this.instanceCache.get(cacheKey)!;
    }

    const provider = this.providers.get(definition.provider);
    if (!provider) throw new Error(`No provider registered for: ${definition.provider}`);

    const instance = provider.createModel(definition);
    this.instanceCache.set(cacheKey, instance);
    return instance;
  }

  // --- Health ---

  healthCheck(): Map<ProviderType, { healthy: boolean; error?: string }> {
    const results = new Map();
    for (const [type, provider] of this.providers) {
      results.set(type, provider.validateConfig());
    }
    return results;
  }
}
```

### Model Catalog (What's Available)

```typescript
// libs/ai/model-gateway/src/catalog/models.catalog.ts

import type { ModelDefinition } from '../interfaces/model-config.interface.js';

/**
 * Static catalog of all models the platform supports.
 * Updated when new models are released / deprecated.
 */
export const MODEL_CATALOG: ModelDefinition[] = [
  // --- Anthropic ---
  {
    id: 'claude-4-sonnet',
    provider: 'anthropic',
    modelName: 'claude-sonnet-4-20250514',
    capabilities: ['coding', 'reasoning', 'planning', 'tool-calling', 'large-context'],
    contextWindow: 200_000,
    maxOutputTokens: 16_384,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'claude-4-opus',
    provider: 'anthropic',
    modelName: 'claude-opus-4-20250514',
    capabilities: ['coding', 'reasoning', 'planning', 'tool-calling', 'large-context'],
    contextWindow: 200_000,
    maxOutputTokens: 32_000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsStructuredOutput: true,
  },

  // --- OpenAI ---
  {
    id: 'gpt-4.1',
    provider: 'openai',
    modelName: 'gpt-4.1',
    capabilities: ['coding', 'reasoning', 'planning', 'tool-calling', 'large-context'],
    contextWindow: 1_000_000,
    maxOutputTokens: 32_768,
    costPer1kInput: 0.002,
    costPer1kOutput: 0.008,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'gpt-4.1-mini',
    provider: 'openai',
    modelName: 'gpt-4.1-mini',
    capabilities: ['fast', 'summarization', 'tool-calling'],
    contextWindow: 1_000_000,
    maxOutputTokens: 16_384,
    costPer1kInput: 0.0004,
    costPer1kOutput: 0.0016,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsStructuredOutput: true,
  },

  // --- Google ---
  {
    id: 'gemini-2.5-pro',
    provider: 'google',
    modelName: 'gemini-2.5-pro',
    capabilities: ['coding', 'reasoning', 'planning', 'large-context', 'tool-calling'],
    contextWindow: 1_000_000,
    maxOutputTokens: 65_536,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.01,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsStructuredOutput: true,
  },
  {
    id: 'gemini-2.5-flash',
    provider: 'google',
    modelName: 'gemini-2.5-flash',
    capabilities: ['fast', 'summarization', 'large-context', 'tool-calling'],
    contextWindow: 1_000_000,
    maxOutputTokens: 65_536,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsStructuredOutput: true,
  },
];
```

---

## 6. Prompt Management

### Current State

You have `libs/shared/prompts` with a `PromptRegistry` and `PromptTemplate` types. This is a good start but needs integration with the Model Gateway.

### Enhanced Prompt Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AGENT                                  │
│  "I need the planner system prompt with these vars"      │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              PROMPT REGISTRY (existing)                   │
│  - Stores templates with {{variable}} placeholders       │
│  - Validates required variables                          │
│  - Renders final string                                  │
│  - Manages prompt versions                               │
└──────────────────────────┬──────────────────────────────┘
                           │ rendered string
                           ▼
┌─────────────────────────────────────────────────────────┐
│              MODEL GATEWAY                                │
│  - Wraps in proper message format (SystemMessage, etc.)  │
│  - Applies model-specific formatting                     │
│  - Handles token budget (truncation if needed)           │
└─────────────────────────────────────────────────────────┘
```

### Prompt Template Structure (Enhanced)

```typescript
// libs/shared/prompts/src/templates/planner.prompts.ts

import { promptRegistry } from '../registry.js';

promptRegistry.register({
  id: 'planner-system',
  name: 'Planner Agent System Prompt',
  description: 'System prompt for the planning agent that decomposes tasks',
  version: '1.0.0',
  variables: [
    { name: 'taskTitle', description: 'Title of the task', required: true },
    { name: 'taskDescription', description: 'Full task description', required: true },
    {
      name: 'previousContext',
      description: 'Context from prior steps',
      required: false,
      defaultValue: 'None',
    },
  ],
  modelConfig: {
    model: 'planning', // References a profile, not a specific model
    temperature: 0.3,
    maxTokens: 4096,
  },
  template: `You are a senior software architect and technical planner.

## Task
Title: {{taskTitle}}
Description: {{taskDescription}}

## Previous Context
{{previousContext}}

## Instructions
Decompose this task into a detailed implementation plan:
1. Break the task into ordered subtasks (max 8)
2. For each subtask, specify: title, description, acceptance criteria, estimated complexity (S/M/L)
3. Identify dependencies between subtasks
4. Flag any risks or unknowns that need investigation

## Output Format
Respond with a JSON object matching this schema:
{
  "plan": [{ "title": string, "description": string, "criteria": string[], "complexity": "S"|"M"|"L", "dependsOn": number[] }],
  "risks": [{ "description": string, "mitigation": string }],
  "reasoning": string
}`,
});
```

### Prompt + Model Integration

The key insight: **prompts carry a `modelConfig` that references a profile name**, not a specific model. The gateway resolves the profile to a concrete model at runtime. This means:

- Same prompt works with any model
- Prompt authors can suggest optimal settings (temperature, tokens)
- The gateway can override if needed (budget constraints, model unavailability)

---

## 7. Middleware Pipeline (Cross-Cutting Concerns)

```typescript
// The middleware pipeline handles everything agents shouldn't care about:

┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   Retry     │ →  │   Fallback   │ →  │   Token     │ →  │  Rate        │
│  Middleware │    │  Middleware   │    │  Tracker    │    │  Limiter     │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
       │                   │                  │                   │
       │ Retries on        │ Switches to      │ Records usage     │ Enforces
       │ transient errors  │ fallback model   │ and calculates    │ requests/min
       │ (429, 500, 503)   │ if primary fails │ cost in USD       │ per provider
       │                   │                  │                   │
```

### Retry Middleware

```typescript
export class RetryMiddleware implements ModelMiddleware {
  readonly name = 'retry';

  constructor(private config: { maxRetries: number; backoffMs: number }) {}

  async handle(request: ModelRequest, next: () => Promise<ModelResponse>): Promise<ModelResponse> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await next();
      } catch (error) {
        lastError = error as Error;
        if (!this.isRetryable(error) || attempt === this.config.maxRetries) throw error;
        await this.backoff(attempt);
      }
    }

    throw lastError;
  }

  private isRetryable(error: unknown): boolean {
    // Retry on rate limits (429), server errors (5xx), timeouts
    const status = (error as { status?: number }).status;
    return status === 429 || (status !== undefined && status >= 500);
  }

  private backoff(attempt: number): Promise<void> {
    const delay = this.config.backoffMs * Math.pow(2, attempt);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
```

### Token Tracking Middleware

```typescript
export class TokenTrackingMiddleware implements ModelMiddleware {
  readonly name = 'token-tracking';

  constructor(private tracker: UsageTracker) {}

  async handle(request: ModelRequest, next: () => Promise<ModelResponse>): Promise<ModelResponse> {
    const response = await next();

    this.tracker.record({
      profileName: request.profile.name,
      modelId: request.metadata?.resolvedModelId,
      usage: response.usage,
      costUsd: this.calculateCost(response.usage, request.metadata?.resolvedModelId),
      timestamp: new Date(),
      agentName: request.metadata?.agentName,
      taskId: request.metadata?.taskId,
    });

    return response;
  }
}
```

---

## 8. Final Directory Structure

```
libs/ai/model-gateway/
├── package.json
├── tsconfig.json
├── project.json
├── src/
│   ├── index.ts                              # Public API exports
│   │
│   ├── interfaces/
│   │   ├── model-gateway.interface.ts        # Core gateway contract
│   │   ├── model-config.interface.ts         # Configuration types
│   │   ├── middleware.interface.ts           # Middleware contract
│   │   └── usage-tracker.interface.ts        # Usage tracking contract
│   │
│   ├── providers/
│   │   ├── provider.interface.ts             # Provider adapter contract
│   │   ├── openai.provider.ts               # OpenAI adapter
│   │   ├── anthropic.provider.ts            # Anthropic adapter
│   │   └── google.provider.ts               # Google adapter
│   │
│   ├── registry/
│   │   └── model-registry.ts                # Central registry
│   │
│   ├── catalog/
│   │   └── models.catalog.ts                # Available models + costs
│   │
│   ├── router/
│   │   ├── model-router.ts                  # Profile → Model resolution
│   │   └── routing-strategy.ts              # Selection strategies
│   │
│   ├── middleware/
│   │   ├── retry.middleware.ts              # Retry with backoff
│   │   ├── fallback.middleware.ts           # Model fallback chain
│   │   ├── token-tracking.middleware.ts     # Usage recording
│   │   └── rate-limiter.middleware.ts       # Per-provider rate limits
│   │
│   ├── gateway/
│   │   └── model-gateway.service.ts         # Main implementation
│   │
│   └── config/
│       └── default-profiles.ts              # Default profile mappings
│
└── __tests__/
    ├── model-registry.spec.ts
    ├── model-gateway.spec.ts
    ├── retry.middleware.spec.ts
    └── fallback.middleware.spec.ts
```

---

## 9. Dependency Graph

```
                    @ai-sdlc/ai/model-gateway
                    ┌────────────────────────┐
                    │                        │
       depends on   │   depends on           │  depends on
       ┌────────────┤                        ├──────────────┐
       ▼            │                        │              ▼
@langchain/core     │                        │    @ai-sdlc/shared/types
@langchain/openai   │                        │    @ai-sdlc/shared/prompts
@langchain/anthropic│                        │
@langchain/google   │                        │
                    └────────────────────────┘
                              ▲
                              │ depends on
                              │
                    ┌─────────┴──────────┐
                    │ libs/agents/core   │
                    │ libs/agents/*      │
                    └────────────────────┘
```

### New Dependencies to Install

```bash
pnpm add @langchain/anthropic @langchain/google-genai
```

(You already have `@langchain/core` and `@langchain/openai`)

---

## 10. Implementation Phases

### Phase A: Foundation (Do First)

1. Create `libs/ai/model-gateway` library with Nx
2. Define all interfaces (`model-gateway.interface.ts`, `model-config.interface.ts`, `middleware.interface.ts`)
3. Define types (`ModelDefinition`, `ProfileMapping`, `ModelCapability`)
4. Create the model catalog (`models.catalog.ts`)
5. Implement `ModelRegistry` (registration + resolution logic)

### Phase B: Providers

6. Implement `OpenAIProvider` adapter
7. Implement `AnthropicProvider` adapter
8. Implement `GoogleProvider` adapter
9. Unit tests for each provider

### Phase C: Gateway Core

10. Implement `ModelGatewayService` (the main class)
11. Implement `ModelRouter` (profile → model resolution)
12. Wire up: registry + providers + router
13. Integration test: Gateway resolves profile and returns model

### Phase D: Middleware

14. Implement `RetryMiddleware`
15. Implement `FallbackMiddleware`
16. Implement `TokenTrackingMiddleware`
17. Implement `RateLimiterMiddleware`
18. Unit tests for each middleware

### Phase E: Integration

19. Update `libs/agents/core` to accept `ModelGateway` in `BaseAgent`
20. Update one agent (PlannerAgent) to use gateway instead of stub
21. Populate prompt templates for that agent
22. End-to-end test: Agent → Gateway → Real LLM → Response

### Phase F: Rollout

23. Migrate remaining agents to use gateway
24. Add streaming support
25. Add structured output support
26. Dashboard/observability integration

---

## 11. Key Design Decisions

| Decision           | Choice                                                      | Rationale                                                                           |
| ------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Abstraction level  | Wrap LangChain, don't replace it                            | LangChain handles HTTP, auth, streaming, serialization — no value in reimplementing |
| Routing strategy   | Profile-based (capabilities)                                | Agents think in tasks, not provider names. Enables hot-swapping.                    |
| Configuration      | Code + Environment                                          | Catalog in code (rarely changes), API keys in env, profile overrides at runtime     |
| Instance lifecycle | Cache with lazy creation                                    | Models are stateless HTTP clients — safe to share and cache                         |
| Middleware order   | Retry → Fallback → Track → Rate-limit                       | Retry before fallback; track after success; rate-limit closest to wire              |
| Streaming          | Native async iterable                                       | Works with LangGraph streaming; no custom protocol needed                           |
| Error handling     | Let LangChain errors propagate, wrap at middleware boundary | Don't mask useful errors; middleware decides retry/fallback                         |

---

## 12. What This Unlocks

Once this is in place, your agents go from **stubs** to **real AI** with:

- ✅ **One-line model swap**: Change a config line, all agents using that profile switch
- ✅ **Automatic fallbacks**: Claude down? Agents seamlessly use GPT-4.1
- ✅ **Cost visibility**: Know exactly how much each agent costs per task
- ✅ **Rate limit safety**: Never hit 429s in production
- ✅ **Multi-model agents**: A single agent can use fast/cheap model for summarization AND expensive model for reasoning
- ✅ **Provider agnosticism**: Add Mistral, Cohere, local Llama — zero agent code changes
- ✅ **Testing**: Mock the gateway in tests, never hit real APIs

---

## Summary: Your Original vs. This Design

| Aspect             | Your Original                    | This Design                                                 |
| ------------------ | -------------------------------- | ----------------------------------------------------------- |
| Library name       | `libs/ai/model-provider`         | `libs/ai/model-gateway` (it's more than a provider)         |
| Core abstraction   | Custom provider interface        | Profile-based routing over LangChain                        |
| Provider role      | Full implementation (HTTP calls) | Thin adapter (configures LangChain)                         |
| Model selection    | Implicit / manual                | Explicit profiles with fallback chains                      |
| Cross-cutting      | Not addressed                    | Middleware pipeline (retry, fallback, tracking, rate-limit) |
| Agent coupling     | Agents know providers            | Agents know only profiles ("give me a coding model")        |
| Prompt integration | Separate concern                 | Prompts carry profile hints; gateway respects them          |
| Cost tracking      | Not addressed                    | First-class via token tracking middleware                   |

Your fuzzy idea was **directionally correct** — you absolutely need this layer. The refinement is making it a **gateway** (routing + resilience + observability) rather than just a **provider wrapper**.
