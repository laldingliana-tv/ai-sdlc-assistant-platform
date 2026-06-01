# Stage 1: Dependencies
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

WORKDIR /app

# Copy workspace config and lockfile
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy all package.json files for workspace resolution
COPY apps/api/package.json ./apps/api/
COPY libs/infra/database/package.json ./libs/infra/database/
COPY libs/infra/telemetry/package.json ./libs/infra/telemetry/
COPY libs/infra/logging/package.json ./libs/infra/logging/
COPY libs/infra/auth/package.json ./libs/infra/auth/
COPY libs/infra/governance/package.json ./libs/infra/governance/
COPY libs/shared/types/package.json ./libs/shared/types/
COPY libs/shared/schemas/package.json ./libs/shared/schemas/
COPY libs/shared/constants/package.json ./libs/shared/constants/
COPY libs/shared/prompts/package.json ./libs/shared/prompts/
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
COPY apps/web/package.json ./apps/web/
COPY apps/workers/package.json ./apps/workers/

RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN pnpm nx run infra-database:prisma-generate 2>/dev/null || npx prisma generate --schema=libs/infra/database/prisma/schema.prisma

# Build the API
RUN pnpm nx build api

# Stage 3: Runner
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

WORKDIR /app

# Copy built output
COPY --from=build /app/dist/apps/api ./dist/apps/api

# Copy node_modules for runtime dependencies
COPY --from=build /app/node_modules ./node_modules

# Copy Prisma schema and generated client for runtime
COPY --from=build /app/libs/infra/database/prisma ./libs/infra/database/prisma

USER appuser

EXPOSE 3000

LABEL org.opencontainers.image.source="https://github.com/ai-sdlc/assistant-platform"
LABEL org.opencontainers.image.description="AI SDLC Assistant Platform - API"

CMD ["node", "dist/apps/api/main.js"]
