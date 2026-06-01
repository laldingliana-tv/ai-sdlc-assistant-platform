# AI SDLC Assistant Platform — Project Scaffolding Prompt

You are a principal software architect and senior staff engineer.

Your task is to generate the INITIAL PRODUCTION-GRADE PROJECT SCAFFOLDING for a modern AI Agent Platform called:

# "AI SDLC Assistant Platform"

The project is NOT a toy chatbot.

It is an enterprise-oriented AI engineering assistant platform that demonstrates:
- AI agents
- MCP integrations
- multi-agent orchestration
- observability
- evaluations
- governance
- workflow orchestration
- modern TypeScript platform architecture

The system should feel like a real production-grade internal engineering platform.

---

# PRIMARY GOAL

Generate:
- monorepo structure
- apps/libs structure
- initial configs
- starter implementations
- clean architecture
- developer experience setup
- shared contracts/types
- Docker/dev infra
- CI scaffolding
- observability hooks
- placeholders for future agent workflows

DO NOT generate:
- massive business logic
- fake/generated implementation dumps
- giant placeholder code files
- over-engineered abstractions
- excessive comments
- tutorial-style explanations

Focus on:
- realistic production structure
- modularity
- maintainability
- scalability
- clean developer experience

---

# HIGH LEVEL PRODUCT DESCRIPTION

The platform allows developers to submit SDLC-related tasks such as:

- feature requests
- implementation tasks
- architecture reviews
- PR reviews
- migration tasks
- refactoring requests

Example prompt:

"Implement dark mode support in all mobile and web MFEs."

The system then orchestrates multiple AI agents:

- Planner Agent
- Retriever Agent
- Architecture Validation Agent
- Reviewer Agent
- Implementation Proposal Agent

The agents collaborate using:
- MCP tools
- shared workflows
- structured outputs
- optional A2A messaging

The UI should later support:
- task submission
- streaming updates
- agent trace visualization
- approval workflows
- execution history
- observability dashboards

---

# REQUIRED TECH STACK

# Monorepo
- Nx

# Frontend
- Next.js (latest App Router)
- React
- TypeScript
- Tailwind
- shadcn/ui
- React Query
- Zustand (minimal usage only)

# Backend API
- NestJS
- Fastify adapter
- TypeScript

# AI / Agent Layer
- LangGraphJS
- Google ADK integration placeholders
- MCP support
- A2A support placeholders

# Workflow Orchestration
- Temporal

# Database
- PostgreSQL

# Vector Search
- pgvector

# ORM
- Prisma

# Observability
- Langfuse integration placeholders
- OpenTelemetry setup

# Validation / Schemas
- Zod

# Auth
- Placeholder auth module
- JWT-ready architecture
- RBAC-ready architecture

# Infra / Dev
- Docker Compose
- pnpm
- ESLint
- Prettier
- Husky
- lint-staged

# Testing
- Vitest
- Playwright placeholders
- Supertest

# Deployment
- Cloud Run friendly
- Kubernetes friendly
- 12-factor principles

---

# IMPORTANT ARCHITECTURAL REQUIREMENTS

# 1. KEEP ARCHITECTURE PRAGMATIC

DO NOT:
- over-engineer DDD layers
- create excessive abstractions
- generate unnecessary boilerplate
- create hundreds of tiny libs

The architecture should feel:
- modular
- enterprise-grade
- pragmatic
- understandable

---

# 2. MONOREPO STRUCTURE

Generate a structure similar to:

```txt
apps/
  web/
  api/
  workers/

libs/
  agents/
    planner/
    reviewer/
    retriever/
    architecture/

  mcp/
    github/
    docs/
    jira/

  shared/
    types/
    schemas/
    prompts/
    constants/

  infra/
    logging/
    telemetry/
    auth/

  ui/
```

Keep structure clean and minimal.

---

# 3. FRONTEND REQUIREMENTS

Generate:
- modern dashboard shell
- sidebar layout
- task submission page
- placeholder trace visualization page
- React Query setup
- API client setup
- clean shadcn integration

UI aesthetic:
- modern enterprise developer tooling
- minimal
- dark-mode ready
- similar feel to Linear / Vercel / Cursor

DO NOT:
- generate bloated UI components
- generate fake business dashboards

---

# 4. BACKEND REQUIREMENTS

Generate:
- NestJS modular architecture
- Fastify adapter
- health endpoint
- task endpoint
- workflow endpoint
- SSE/WebSocket placeholder support
- structured logging
- global validation
- OpenTelemetry hooks

Architecture should support:
- future microservice extraction
- workflow orchestration
- agent coordination

---

# 5. AGENT ARCHITECTURE

Create placeholders/stubs for:

- PlannerAgent
- RetrieverAgent
- ReviewerAgent
- ArchitectureAgent

Each should:
- use interfaces/contracts
- support structured outputs
- support MCP tools
- support LangGraph integration

DO NOT implement complex prompts yet.

---

# 6. MCP REQUIREMENTS

Generate:
- MCP abstraction layer
- example GitHub MCP client
- example Docs MCP client

Use:
- clean TypeScript interfaces
- provider-based design
- transport abstraction

Keep implementations minimal but realistic.

---

# 7. TEMPORAL REQUIREMENTS

Generate:
- Temporal worker setup
- example workflow
- example activity
- workflow orchestration placeholders

The workflow should model:

Task Submitted
→ Planner Agent
→ Retriever Agent
→ Architecture Review
→ Reviewer Agent
→ Final Response

---

# 8. DATABASE REQUIREMENTS

Generate:
- Prisma schema
- migrations setup
- pgvector support placeholder

Suggested entities:
- User
- Task
- AgentExecution
- WorkflowExecution
- EvaluationResult
- Approval

Keep schema simple but extensible.

---

# 9. OBSERVABILITY

Generate:
- structured logging
- correlation IDs
- OpenTelemetry bootstrap
- Langfuse placeholder hooks

All major operations should support tracing.

---

# 10. SHARED TYPES

Generate shared contracts for:
- task requests
- agent outputs
- workflow state
- MCP tool responses

Use:
- Zod
- inferred TypeScript types

---

# 11. DOCKER + DEV ENV

Generate:
- Docker Compose
- Postgres
- Temporal
- pgvector support
- local dev setup

Include:
- .env.example
- startup instructions

---

# 12. CI/CD PLACEHOLDERS

Generate:
- GitHub Actions skeleton
- lint
- test
- build
- typecheck pipelines

---

# 13. CODING STANDARDS

Use:
- strict TypeScript
- clean naming
- modular design
- functional where appropriate
- async/await
- minimal comments

Avoid:
- magic strings
- giant files
- unnecessary inheritance
- framework worship

---

# 14. OUTPUT FORMAT

Generate:

1. COMPLETE PROJECT TREE
2. IMPORTANT FILE CONTENTS
3. INITIAL IMPLEMENTATIONS
4. CONFIG FILES
5. PACKAGE DEPENDENCIES
6. STARTUP INSTRUCTIONS

DO NOT skip critical infrastructure files.

---

# 15. VERY IMPORTANT

This is NOT:
- a tutorial
- a toy chatbot
- a prompt-engineering demo

It should resemble:
- a modern enterprise AI platform foundation
- something a real engineering org could evolve
- production-oriented architecture

Focus heavily on:
- maintainability
- clarity
- scalability
- modularity
- developer experience
- future extensibility

The generated code should be:
- runnable
- coherent
- internally consistent
- modern
- production-quality scaffolding
