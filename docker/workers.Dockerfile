# Stage 1: Dependencies
# Use node:20-slim instead of alpine for Temporal native bindings compatibility
FROM node:20-slim AS deps

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Install build dependencies needed for native modules (@temporalio/worker)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace config and lockfile
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy all package.json files for workspace resolution
COPY apps/workers/package.json ./apps/workers/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY libs/shared/types/package.json ./libs/shared/types/
COPY libs/shared/schemas/package.json ./libs/shared/schemas/
COPY libs/shared/constants/package.json ./libs/shared/constants/
COPY libs/shared/prompts/package.json ./libs/shared/prompts/
COPY libs/infra/database/package.json ./libs/infra/database/
COPY libs/infra/telemetry/package.json ./libs/infra/telemetry/
COPY libs/infra/logging/package.json ./libs/infra/logging/
COPY libs/infra/auth/package.json ./libs/infra/auth/
COPY libs/infra/governance/package.json ./libs/infra/governance/
COPY libs/agents/core/package.json ./libs/agents/core/
COPY libs/agents/planner/package.json ./libs/agents/planner/
COPY libs/agents/retriever/package.json ./libs/agents/retriever/
COPY libs/agents/reviewer/package.json ./libs/agents/reviewer/
COPY libs/agents/architecture/package.json ./libs/agents/architecture/
COPY libs/agents/implementor/package.json ./libs/agents/implementor/
COPY libs/agents/a2a/package.json ./libs/agents/a2a/
COPY libs/agents/adk/package.json ./libs/agents/adk/
COPY libs/mcp/package.json ./libs/mcp/
COPY libs/evaluations/package.json ./libs/evaluations/

RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-slim AS build

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the workers app
RUN pnpm nx build workers

# Stage 3: Runner
FROM node:20-slim AS runner

RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup appuser

WORKDIR /app

# Copy built output
COPY --from=build /app/dist/apps/workers ./dist/apps/workers

# Copy node_modules for runtime dependencies (includes Temporal native bindings)
COPY --from=build /app/node_modules ./node_modules

USER appuser

EXPOSE 8081

LABEL org.opencontainers.image.source="https://github.com/ai-sdlc/assistant-platform"
LABEL org.opencontainers.image.description="AI SDLC Assistant Platform - Temporal Workers"

CMD ["node", "dist/apps/workers/main.js"]
