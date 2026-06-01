# AI SDLC Assistant Platform — What We're Building & Why

## For the dev team. Written in plain language.

---

## Part 1: What Is This Thing?

### One-liner

A web platform where developers submit engineering tasks and AI agents collaborate to produce structured, reviewable outputs — with a human approval step before anything gets finalized.

### The Problem It Solves

Developers spend significant time on repetitive SDLC tasks:
- Breaking down feature requests into implementation plans
- Gathering context from docs, repos, and tickets
- Reviewing architecture decisions
- Writing implementation proposals

This platform automates the grunt work while keeping humans in control of the final decisions.

### How It Works (User Perspective)

1. Developer opens the web UI
2. Types a task like: "Implement dark mode support across all MFEs"
3. The system kicks off a workflow that:
   - **Plans** the task (breaks it into steps)
   - **Retrieves** relevant context (from GitHub, docs, Jira)
   - **Reviews** the architecture implications
   - **Pauses for human approval** (you review what the agents produced so far)
   - **Generates** an implementation proposal
   - **Reviews** the final output for quality
4. Developer sees the full trace of what each agent did, approves or rejects, and gets the final output

### What It Is NOT

- Not a chatbot
- Not a code generator that pushes to prod
- Not autonomous — humans approve before final outputs
- Not a toy demo — it's architected like a real internal platform

---

## Part 2: What Are We Delivering in This POC?

### The "Golden Demo"

One fully working scenario, polished end-to-end:

> **Task:** "Implement dark mode support across all MFEs"

This single task flows through every layer of the system. If this works beautifully, the POC is a success. Everything else is secondary.

### What "Done" Looks Like

By the end of the month, a stakeholder can:

1. Open the web app
2. Submit the dark mode task
3. Watch it progress through workflow stages in real-time
4. See what each AI agent produced at each step
5. Hit "Approve" at the approval gate
6. See the final implementation proposal
7. View the full execution trace (which agents ran, what they returned, how long it took)

### What's NOT in Scope for This POC

- User authentication (placeholder only)
- Multiple simultaneous users
- Production deployment
- Exhaustive error handling for edge cases
- Real integrations with GitHub/Jira (MCP tools return structured stubs for now)
- Cost tracking or billing

---

## Part 3: System Architecture (Plain English)

### The Three Apps

| App | What it does | Tech |
|---|---|---|
| **Web** (`apps/web/`) | The UI. Dashboard, task submission, trace viewer. | Next.js, React, Tailwind |
| **API** (`apps/api/`) | The backend. Receives requests, talks to the database, triggers workflows. | NestJS, Fastify, Prisma |
| **Workers** (`apps/workers/`) | Runs the AI workflow. Executes agents in sequence, handles the approval gate. | Temporal |

### How They Talk to Each Other

```
User → Web UI → API → Temporal (starts workflow)
                          ↓
                    Workers execute agents in order:
                    Planner → Retriever → Architecture → [APPROVAL GATE] → Implementor → Reviewer
                          ↓
                    Results stored in DB
                          ↓
                    API serves results → Web UI displays them
```

### The Shared Libraries

These live in `libs/` and are used by multiple apps:

| Library | Purpose |
|---|---|
| `libs/shared/types/` | TypeScript types shared across frontend, backend, and workers |
| `libs/shared/schemas/` | Validation rules (Zod) — ensures data is correctly shaped everywhere |
| `libs/shared/prompts/` | AI prompt templates used by agents |
| `libs/agents/*/` | Each AI agent (planner, retriever, reviewer, etc.) as a self-contained module |
| `libs/mcp/` | Connectors to external tools (GitHub, Docs, Jira) |
| `libs/evaluations/` | Scoring system for agent output quality |
| `libs/infra/*/` | Cross-cutting infrastructure: logging, auth, telemetry, governance |

---

## Part 4: Key Architecture Decisions (ADRs)

### ADR 1: Why Temporal for Workflow Orchestration?

**Decision:** Use Temporal to manage the multi-step agent workflow.

**Why not just chain function calls?**
- If the server crashes mid-workflow, we lose all progress. Temporal automatically resumes from where it stopped.
- The approval gate requires the workflow to pause indefinitely (hours, days) until a human responds. Normal code can't do that without hacks.
- Temporal gives us retry logic, timeouts, and a built-in UI to inspect workflow state.

**What this means for devs:**
- Workflows are defined as regular TypeScript functions in `apps/workers/`
- Each agent call is wrapped in an "activity" (Temporal's unit of work)
- You'll need Docker running locally to start the Temporal server

---

### ADR 2: Why LangGraph for Agent Logic?

**Decision:** Each AI agent uses LangGraph to define its reasoning steps.

**Why not just call the LLM directly?**
- Agents need to call external tools (MCP), handle structured outputs, and sometimes loop/branch
- LangGraph gives us a graph-based model: define nodes (steps) and edges (transitions)
- It integrates with observability so we can trace exactly what the agent did

**What this means for devs:**
- Each agent in `libs/agents/*/` defines a LangGraph "graph"
- Graphs are invoked inside Temporal activities
- You don't need to understand LangGraph deeply to work on the API or frontend

---

### ADR 3: Why Nx Monorepo?

**Decision:** Single repository managed by Nx.

**Why?**
- Three apps (web, api, workers) share types and schemas — monorepo keeps them in sync
- Nx provides build caching, dependency graph awareness, and affected-only testing
- One `pnpm install`, one repo to clone

**What this means for devs:**
- Run individual apps: `nx serve api`, `nx serve web`
- Run all tests: `nx run-many -t test`
- Shared code lives in `libs/`, app code in `apps/`

---

### ADR 4: Why No Redis?

**Decision:** Use in-memory rate limiting instead of Redis for the POC.

**Why?**
- Redis adds another service to run locally, another thing to debug
- For a single-instance POC, in-memory rate limiting is sufficient
- Can be added later if we scale to multiple instances

---

### ADR 5: Why NestJS + Fastify (Not Express)?

**Decision:** Backend uses NestJS framework with Fastify as the HTTP engine.

**Why NestJS?**
- Provides modular architecture out of the box (modules, services, controllers)
- Built-in dependency injection makes testing easy
- Good TypeScript support

**Why Fastify over Express?**
- Faster (matters for streaming/SSE)
- Better plugin ecosystem for rate limiting, CORS
- Schema-based validation support

---

### ADR 6: Why Zod for Validation?

**Decision:** All data contracts use Zod schemas, shared across frontend and backend.

**Why?**
- Single source of truth: define a schema once, infer TypeScript types from it
- Runtime validation at API boundaries (not just compile-time)
- Frontend can validate responses using the same schemas the backend uses to validate requests

---

### ADR 7: Why A2A and ADK Are Placeholders Only?

**Decision:** A2A (Agent-to-Agent protocol) and Google ADK are included as interfaces but not implemented.

**Why include them at all?**
- The master requirements specify them as future capabilities
- Having the interfaces now means we can implement them later without restructuring

**Why not implement them now?**
- A2A is a protocol spec without a mature runtime — we'd be building infrastructure from scratch
- ADK's TypeScript SDK is early-stage
- Temporal + LangGraph already cover our orchestration needs for the POC
- These are planned for a separate Demo 2 after the POC ships

---

## Part 5: Local Development Setup (What You'll Need)

| Requirement | Why |
|---|---|
| Node.js 20 | Runtime for all apps |
| pnpm | Package manager (faster than npm, workspace support) |
| Docker | Runs Postgres + Temporal locally |
| An LLM API key | For agents to call (Gemini/Claude) |

### Getting Started (after repo is scaffolded)

```bash
pnpm install          # Install all dependencies
make docker           # Start Postgres + Temporal via Docker Compose
make migrate          # Run database migrations
make seed             # Seed development data
nx serve api          # Start backend on :3001
nx serve web          # Start frontend on :3000
```

---

## Part 6: Who Works on What?

| Area | Skills Needed | Key Files |
|---|---|---|
| Frontend | React, Next.js, Tailwind, React Query | `apps/web/` |
| Backend API | NestJS, Prisma, TypeScript | `apps/api/` |
| Workflow/Agents | Temporal, LangGraph, LLM prompting | `apps/workers/`, `libs/agents/` |
| Infrastructure | Docker, CI/CD, GitHub Actions | `docker/`, `.github/` |
| Shared Contracts | Zod, TypeScript | `libs/shared/` |

> **Important:** Everyone should understand the golden demo flow even if they only work on one layer. The goal is one working thread through the entire system, not isolated pieces.

---

## Part 7: Glossary

| Term | What it means in this project |
|---|---|
| **Agent** | An AI module that performs one specific task (planning, retrieving, reviewing, etc.) |
| **MCP** | Model Context Protocol — a standard way for agents to call external tools (GitHub API, Jira, docs) |
| **Temporal** | A workflow engine that manages long-running processes with durability and retry logic |
| **LangGraph** | A framework for building agent reasoning as a graph of steps |
| **Activity** | Temporal's name for a single unit of work inside a workflow (one agent call = one activity) |
| **HITL** | Human-In-The-Loop — the approval step where a human reviews and approves/rejects |
| **Signal** | Temporal's mechanism for sending external input to a paused workflow (e.g., "approved") |
| **A2A** | Agent-to-Agent protocol — future standard for agents to communicate across systems |
| **ADK** | Google's Agent Development Kit — future framework for agent interoperability |
| **Golden demo** | The one fully polished scenario we optimize everything around |
| **Trace** | The full record of what happened during a workflow execution (which agents ran, what they returned) |
| **Governance** | Rules that control what agents can/can't do (e.g., "require approval before implementation") |
| **Evaluations** | Automated scoring of agent outputs (was the response relevant? high quality?) |
