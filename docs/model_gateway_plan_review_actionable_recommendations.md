# Model Gateway Plan Review - Actionable Recommendations

## Overall Verdict

- Keep the plan.
- Architecture direction is correct.
- Scope is too large for the current phase.
- Implement incrementally.
- Prioritize working AI behavior over platform infrastructure.

---

## Implement Immediately (Phase 1)

### Create Library

```text
libs/ai/model-gateway/
```

### Implement

```text
interfaces/
providers/
registry/
```

### Providers

```text
openai.provider.ts
anthropic.provider.ts
google.provider.ts
```

### Registry

Support:

```text
registerProvider()
registerProfile()
resolveProfile()
```

---

## Keep Capability Profiles

Implement:

```text
planning
coding
review
retrieval
summarization
```

Example:

```text
PlannerAgent -> planning
ReviewerAgent -> review
RetrieverAgent -> retrieval
```

Agents should never reference specific models directly.

---

## Keep Prompt ↔ Profile Integration

Allow prompts to specify:

```typescript
modelConfig: {
  profile: 'planning';
}
```

Benefits:

- Provider agnostic prompts
- Easy model swaps
- Centralized configuration

---

## Implement Thin Provider Adapters

Providers should:

- Configure LangChain models
- Handle API keys
- Handle provider-specific setup

Providers should NOT:

- Perform routing
- Perform retries
- Perform fallback logic
- Manage prompts

Keep them thin.

---

## Do NOT Rebuild LangChain

Avoid creating abstraction layers that simply wrap:

```text
ChatOpenAI
ChatAnthropic
ChatGoogleGenerativeAI
```

without adding platform value.

Use LangChain's abstraction and build platform capabilities around it.

---

## Defer Until Real Agents Exist (Phase 2)

### Do NOT Implement Yet

```text
RetryMiddleware
FallbackMiddleware
RateLimiterMiddleware
TokenTrackingMiddleware
```

Reason:
No real model traffic exists yet.

---

## Delay Fallback Chains

Add only after:

```text
Planner -> Real Model
Retriever -> Real Model
Reviewer -> Real Model
```

are working.

---

## Delay Cost Tracking

Add after:

- multiple models are active
- real usage data exists

---

## Delay Rate Limiting

Add when:

- provider quotas become a real concern

---

## Simplify Model Catalog

Initially keep only:

```typescript
id;
provider;
modelName;
capabilities;
```

Avoid maintaining:

- pricing tables
- detailed capability matrices
- constantly changing provider metadata

---

## Remove Unnecessary Complexity

Do not implement yet:

```text
Routing strategies
Provider factories
Provider proxies
Provider bridges
Complex caching
```

Keep the gateway simple.

---

## Immediate Success Criteria

Validate only this:

```text
PlannerAgent
    ->
ModelGateway
    ->
Claude
    ->
Response
```

Then:

```text
RetrieverAgent
    ->
ModelGateway
    ->
Gemini Flash
    ->
Response
```

Then:

```text
ReviewerAgent
    ->
ModelGateway
    ->
GPT
    ->
Response
```

If these work, the abstraction is validated.

---

## Recommended Delivery Order

### Step 1

Create:

```text
libs/ai/model-gateway
```

### Step 2

Implement:

```text
Provider Adapters
Registry
Profiles
```

### Step 3

Integrate PlannerAgent

### Step 4

Get real Claude response

### Step 5

Integrate RetrieverAgent

### Step 6

Get real Gemini response

### Step 7

Integrate ReviewerAgent

### Step 8

Get real GPT response

### Step 9

Evaluate actual usage patterns

### Step 10

Only then consider:

```text
Retry middleware
Fallback middleware
Cost tracking
Rate limiting
```

---

## Final Recommendation

Adopt immediately:

- model-gateway library
- capability profiles
- provider adapters
- registry
- prompt/profile integration

Delay:

- middleware stack
- cost governance
- fallback chains
- rate limiting
- advanced catalog management

Primary objective:

```text
Real Agents
    ->
Real Models
    ->
Real Responses
```

before building additional infrastructure.
