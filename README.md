# AI SDLC Assistant Platform

An enterprise AI platform that orchestrates multiple AI agents through SDLC workflows using Temporal, LangGraph, and MCP. Developers submit engineering tasks and AI agents collaborate through structured workflows (Planner → Retriever → Architecture Review → Approval Gate → Implementor → Reviewer) to produce reviewable outputs.

## Tech Stack

| Layer         | Technology                                                       |
| ------------- | ---------------------------------------------------------------- |
| Monorepo      | Nx 22, pnpm 9                                                    |
| Frontend      | Next.js 16, React 19, TypeScript 5.9, Tailwind CSS v4, shadcn/ui |
| Backend       | NestJS 10, Fastify adapter                                       |
| AI/Agents     | LangChain/LangGraph 1.x, MCP, A2A/ADK                            |
| Workflow      | Temporal                                                         |
| Database      | PostgreSQL 15 + pgvector, Prisma 6                               |
| Observability | OpenTelemetry 2.x, Langfuse, Pino                                |
| Testing       | Vitest 3, Playwright, Supertest                                  |
| Linting       | ESLint 9 (flat config), Prettier                                 |

## Project Structure

```
ai-sdlc-assistant-platform/
├── apps/
│   ├── api/              # NestJS backend (Fastify)
│   ├── web/              # Next.js frontend
│   └── workers/          # Temporal worker
├── libs/
│   ├── shared/           # Shared types, schemas, constants, prompts
│   ├── infra/            # Telemetry, logging, auth, database, governance
│   ├── agents/           # AI agent implementations
│   ├── mcp/             # Model Context Protocol integration
│   └── evaluations/     # Agent evaluation framework
├── docs/                 # Architecture decisions and planning
├── docker-compose.yml    # PostgreSQL + Temporal
├── nx.json              # Nx workspace configuration
├── tsconfig.base.json   # Shared TypeScript config with path aliases
└── Makefile             # Dev orchestration commands
```

## Prerequisites

- **Node.js** 20+ LTS
- **pnpm** 9.x (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Docker** & Docker Compose (for PostgreSQL and Temporal)

## Getting Started

```bash
# 1. Clone and install dependencies
git clone <repo-url> && cd ai-sdlc-assistant-platform
make install

# 2. Set up environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start infrastructure (Postgres + Temporal)
make docker

# 4. Run database migrations
make migrate

# 5. Start development servers
make dev
```

> **Windows users without `make`:** See the equivalent commands in the [Available Commands](#available-commands) table below.

```powershell
# Windows (PowerShell) — without make:
pnpm install                                              # Step 1
Copy-Item .env.example .env                               # Step 2
docker-compose up -d                                      # Step 3
pnpm nx run infra-database:prisma:migrate:dev              # Step 4
pnpm nx run-many -t serve --projects=api,web              # Step 5
```

The API will be available at `http://localhost:3000` and the web UI at `http://localhost:4200`.

## How the Platform Works (New Joiner Guide)

This section explains the end-to-end flow of the platform so you can understand how all the pieces fit together.

### The Big Picture

This platform automates parts of the Software Development Lifecycle (SDLC) using AI agents. Instead of a single LLM chat, it orchestrates **multiple specialized AI agents** that each handle one phase of a development task — planning, context retrieval, architecture review, implementation, and code review.

Think of it like a virtual engineering team: you describe a task, and the agents collaborate through a structured pipeline to produce a reviewable output (plans, code, reviews).

### End-to-End Flow

```
Developer submits task ─► API ─► Temporal Workflow ─► Agent Pipeline ─► Results streamed to UI
```

Here's what happens step by step:

1. **You submit a task** via the Next.js web UI (e.g., "Add dark mode to the settings page").
2. **The NestJS API** validates the request, persists the task in PostgreSQL, and starts a **Temporal workflow**.
3. **Temporal** (a durable workflow engine) orchestrates the agent pipeline. Each agent runs as a Temporal "activity" — meaning it's retried automatically on failure and the overall progress is persisted even if a worker crashes.
4. **The agents execute in sequence:**

   | Step | Agent             | What it does                                                                       |
   | ---- | ----------------- | ---------------------------------------------------------------------------------- |
   | 1    | **Planner**       | Breaks the task into structured phases/work items                                  |
   | 2    | **Retriever**     | Fetches relevant code, docs, and PRs via MCP tools (GitHub, Jira, internal docs)   |
   | 3    | **Architecture**  | Evaluates the plan against architectural constraints; produces ADR-style decisions |
   | 4    | **Approval Gate** | Pauses the workflow and waits for a human to approve or reject (up to 24 hours)    |
   | 5    | **Implementor**   | Generates code changes and a test strategy                                         |
   | 6    | **Reviewer**      | Reviews the implementation for quality, correctness, and best practices            |

5. **Each agent calls the Model Gateway**, which routes LLM requests to the best available provider (OpenAI, Anthropic, or Google) based on the task's capability profile (e.g., `"coding"` vs `"planning"`).
6. **Results stream back** to the frontend via Server-Sent Events (SSE), so you see progress in real time.

### Key Concepts

| Concept                          | What it means                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Temporal**                     | A workflow engine that makes the pipeline durable — steps survive crashes and can be retried. The workflow code lives in `apps/workers/`.       |
| **LangGraph**                    | A graph-based framework (from LangChain) used to define each agent's internal reasoning as a state machine. Agent code lives in `libs/agents/`. |
| **MCP (Model Context Protocol)** | A standard protocol for giving AI agents access to external tools (GitHub search, file reading, Jira lookups). Configured in `libs/mcp/`.       |
| **Model Gateway**                | An abstraction layer (`libs/ai/model-gateway/`) that lets agents request LLM capabilities without being coupled to a specific provider.         |
| **Human-in-the-Loop (HITL)**     | The approval gate where a human reviews the architecture before code generation starts. The workflow pauses until a signal is received.         |
| **A2A / ADK**                    | Future protocols for agent-to-agent communication and Google ADK interoperability (currently placeholder interfaces).                           |

### Where Things Live

| What you're looking for      | Where to find it                                                     |
| ---------------------------- | -------------------------------------------------------------------- |
| Frontend (UI)                | `apps/web/` — Next.js 16 + React 19                                  |
| Backend API                  | `apps/api/` — NestJS with Fastify                                    |
| Temporal workers & workflows | `apps/workers/`                                                      |
| Agent implementations        | `libs/agents/{planner,retriever,architecture,implementor,reviewer}/` |
| Shared types & validation    | `libs/shared/`                                                       |
| Database schema & migrations | `libs/infra/database/`                                               |
| Observability & logging      | `libs/infra/telemetry/`, `libs/infra/logging/`                       |
| MCP tool providers           | `libs/mcp/`                                                          |
| Model gateway                | `libs/ai/model-gateway/`                                             |

### Development Tips for New Joiners

- **You only need one AI provider key** (OpenAI, Anthropic, or Google) to run the agents. Set it in `.env`.
- **Docker must be running** for PostgreSQL and Temporal. Use `make docker` to start them.
- **Nx manages the monorepo.** Use `pnpm nx <target> <project>` to run tasks for specific projects (e.g., `pnpm nx test api`).
- **Agent outputs are currently mock data.** The pipeline structure is real, but agents return golden demo responses rather than calling live LLMs (real integration is in progress).
- **Check `docs/` for design decisions** — architecture plans, implementation phases, and reviews are documented there.

## API Keys

The app starts without any API keys — all are optional and features gracefully degrade when keys are missing.

### AI Provider Keys (needed to run AI agents)

You only need **one** of the following, depending on which LLM provider you want to use:

| Variable            | How to Get                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `OPENAI_API_KEY`    | Sign up at [platform.openai.com](https://platform.openai.com/api-keys) → API Keys → Create new secret key          |
| `ANTHROPIC_API_KEY` | Sign up at [console.anthropic.com](https://console.anthropic.com/settings/keys) → Settings → API Keys → Create Key |
| `GOOGLE_AI_API_KEY` | Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → Create API Key (free tier available)      |

### Observability Keys (optional — for tracing agent runs)

| Variable              | How to Get                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| `LANGFUSE_PUBLIC_KEY` | Sign up at [cloud.langfuse.com](https://cloud.langfuse.com) → Project Settings → API Keys → Copy Public Key |
| `LANGFUSE_SECRET_KEY` | Same page as above → Copy Secret Key                                                                        |

> **Note:** If Langfuse keys are not set, telemetry is silently disabled. The app runs normally without them.

### MCP Integration Keys (optional — for code retrieval)

| Variable         | How to Get                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN`   | [github.com/settings/tokens](https://github.com/settings/tokens) → Generate new token (classic) with `repo` scope                     |
| `JIRA_BASE_URL`  | Your Jira instance URL (e.g., `https://yourorg.atlassian.net`)                                                                        |
| `JIRA_API_TOKEN` | [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens) → Create API token |

### Auth (auto-configured for development)

| Variable     | Notes                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------- |
| `JWT_SECRET` | Pre-filled in `.env.example` with a dev default. **Change in production** (min 16 chars). |

## Available Commands

| Make Command     | Direct Command                                  | Description                                |
| ---------------- | ----------------------------------------------- | ------------------------------------------ |
| `make install`   | `pnpm install`                                  | Install all dependencies                   |
| `make docker`    | `docker-compose up -d`                          | Start Docker services (Postgres, Temporal) |
| `make migrate`   | `pnpm nx run infra-database:prisma:migrate:dev` | Run Prisma migrations                      |
| `make seed`      | `pnpm nx run infra-database:db:seed`            | Seed the database                          |
| `make dev`       | `pnpm nx run-many -t serve --projects=api,web`  | Start API + Web in development mode        |
| `make lint`      | `pnpm nx run-many -t lint`                      | Lint all projects                          |
| `make test`      | `pnpm nx run-many -t test`                      | Run all unit tests                         |
| `make typecheck` | `pnpm nx run-many -t typecheck`                 | Type-check all projects                    |
| `make clean`     | `rm -rf node_modules dist tmp .nx`              | Remove node_modules, dist, tmp             |

## Development

### Running specific projects

```bash
# Single app
pnpm nx serve api
pnpm nx serve web

# Run tests for a specific project
pnpm nx test api
pnpm nx test web
```

### Adding a new library

```bash
pnpm nx g @nx/js:library my-lib --directory=libs/shared/my-lib
```

## Architecture

```mermaid
graph TD
    subgraph Frontend
        WEB[Next.js Web App]
    end

    subgraph Backend
        API[NestJS API]
    end

    subgraph Orchestration
        TEMPORAL[Temporal Server]
        WORKER[Temporal Worker]
    end

    subgraph AI Layer
        GW[Model Gateway]
        PLANNER[Planner Agent]
        RETRIEVER[Retriever Agent]
        ARCH[Architecture Agent]
        APPROVAL[Approval Gate / HITL]
        IMPL[Implementor Agent]
        REVIEWER[Reviewer Agent]
    end

    subgraph Providers
        OPENAI[OpenAI]
        ANTHROPIC[Anthropic]
        GOOGLE[Google AI]
    end

    subgraph Infrastructure
        DB[(PostgreSQL + pgvector)]
        MCP[MCP Servers]
        OTEL[OpenTelemetry + Langfuse]
    end

    WEB -->|SSE / REST| API
    API -->|start workflow| TEMPORAL
    API -->|signal: approve/reject| TEMPORAL
    TEMPORAL -->|dispatch activities| WORKER
    WORKER --> PLANNER
    WORKER --> RETRIEVER
    WORKER --> ARCH
    WORKER -->|waits for signal| APPROVAL
    WORKER --> IMPL
    WORKER --> REVIEWER

    PLANNER --> GW
    RETRIEVER --> GW
    ARCH --> GW
    IMPL --> GW
    REVIEWER --> GW

    GW --> OPENAI
    GW --> ANTHROPIC
    GW --> GOOGLE

    RETRIEVER --> MCP
    API --> DB
    API --> OTEL
    WORKER --> OTEL
```

### How It Works

1. A developer submits a task via the **Web UI**.
2. The **API** starts a Temporal workflow that orchestrates the agent pipeline.
3. The **Temporal Worker** executes each agent as a durable activity:
   - **Planner** → breaks the task into structured work items
   - **Retriever** → fetches relevant code/docs via MCP
   - **Architecture** → validates against architectural constraints
   - **Approval Gate** → human-in-the-loop checkpoint
   - **Implementor** → generates code changes
   - **Reviewer** → checks quality and correctness
4. Each agent calls the **Model Gateway** by capability profile (e.g. `"coding"`, `"planning"`). The gateway resolves the profile to the best available LLM provider.
5. Results flow back through the workflow and are streamed to the frontend via SSE.

### Key Library Docs

| Library                                                  | Description                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| [libs/ai/model-gateway](libs/ai/model-gateway/README.md) | Provider-agnostic LLM gateway with capability-based routing |
