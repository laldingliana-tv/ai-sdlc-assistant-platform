# AI SDLC Assistant Platform

An enterprise AI platform that orchestrates multiple AI agents through SDLC workflows using Temporal, LangGraph, and MCP. Developers submit engineering tasks and AI agents collaborate through structured workflows (Planner → Retriever → Architecture Review → Approval Gate → Implementor → Reviewer) to produce reviewable outputs.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Nx + pnpm |
| Frontend | Next.js 14, React, TypeScript, Tailwind, shadcn/ui |
| Backend | NestJS 10, Fastify adapter |
| AI/Agents | LangGraphJS, MCP, A2A/ADK |
| Workflow | Temporal |
| Database | PostgreSQL 15 + pgvector, Prisma |
| Observability | OpenTelemetry, Langfuse, Pino |
| Testing | Vitest, Playwright, Supertest |

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

The API will be available at `http://localhost:3001` and the web UI at `http://localhost:3000`.

## Available Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make docker` | Start Docker services (Postgres, Temporal) |
| `make migrate` | Run Prisma migrations |
| `make seed` | Seed the database |
| `make dev` | Start API + Web in development mode |
| `make lint` | Lint all projects |
| `make test` | Run all unit tests |
| `make typecheck` | Type-check all projects |
| `make clean` | Remove node_modules, dist, tmp |

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
