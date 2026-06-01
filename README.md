# AI SDLC Assistant Platform

An enterprise AI platform that orchestrates multiple AI agents through SDLC workflows using Temporal, LangGraph, and MCP. Developers submit engineering tasks and AI agents collaborate through structured workflows (Planner → Retriever → Architecture Review → Approval Gate → Implementor → Reviewer) to produce reviewable outputs.

## Tech Stack

| Layer         | Technology                                         |
| ------------- | -------------------------------------------------- |
| Monorepo      | Nx + pnpm                                          |
| Frontend      | Next.js 14, React, TypeScript, Tailwind, shadcn/ui |
| Backend       | NestJS 10, Fastify adapter                         |
| AI/Agents     | LangGraphJS, MCP, A2A/ADK                          |
| Workflow      | Temporal                                           |
| Database      | PostgreSQL 15 + pgvector, Prisma                   |
| Observability | OpenTelemetry, Langfuse, Pino                      |
| Testing       | Vitest, Playwright, Supertest                      |

## Project Structure

```
ai-sdlc-assistant-platform/
├── apps/
│   ├── api/              # NestJS backend (Fastify)
│   └── web/              # Next.js frontend
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

- **Node.js** 20 LTS (`nvm use` will pick up `.nvmrc`)
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
pnpm nx run @ai-sdlc/infra-database:prisma:migrate:dev    # Step 4
pnpm nx run-many -t serve --projects=api,web              # Step 5
```

The API will be available at `http://localhost:3001` and the web UI at `http://localhost:3000`.

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

| Make Command     | Direct Command                                           | Description                                |
| ---------------- | -------------------------------------------------------- | ------------------------------------------ |
| `make install`   | `pnpm install`                                           | Install all dependencies                   |
| `make docker`    | `docker-compose up -d`                                   | Start Docker services (Postgres, Temporal) |
| `make migrate`   | `pnpm nx run @ai-sdlc/infra-database:prisma:migrate:dev` | Run Prisma migrations                      |
| `make seed`      | `pnpm nx run @ai-sdlc/infra-database:db:seed`            | Seed the database                          |
| `make dev`       | `pnpm nx run-many -t serve --projects=api,web`           | Start API + Web in development mode        |
| `make lint`      | `pnpm nx run-many -t lint`                               | Lint all projects                          |
| `make test`      | `pnpm nx run-many -t test`                               | Run all unit tests                         |
| `make typecheck` | `pnpm nx run-many -t typecheck`                          | Type-check all projects                    |
| `make clean`     | `rm -rf node_modules dist tmp .nx`                       | Remove node_modules, dist, tmp             |

## Development

### Running specific projects

```bash
# Single app
pnpm nx serve api
pnpm nx serve web

# Run tests for a specific library
pnpm nx test shared-types
```

### Adding a new library

```bash
pnpm nx g @nx/js:library my-lib --directory=libs/shared/my-lib
```

## Architecture

The platform follows a multi-agent orchestration pattern:

1. **Planner Agent** — Breaks down tasks into structured work items
2. **Retriever Agent** — Fetches relevant context from codebase and docs
3. **Architecture Agent** — Reviews proposals against architectural constraints
4. **Approval Gate** — Human-in-the-loop checkpoint
5. **Implementor Agent** — Generates code changes
6. **Reviewer Agent** — Reviews output for quality and correctness

Temporal manages the workflow state machine, ensuring durability and observability across the entire pipeline.
