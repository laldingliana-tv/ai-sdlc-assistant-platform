# Stage 1: Dependencies
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

WORKDIR /app

# Copy workspace config and lockfile
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy all package.json files for workspace resolution
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY apps/workers/package.json ./apps/workers/
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
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm nx build web

# Stage 3: Runner
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy Next.js standalone output if available, otherwise full build
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

USER appuser

EXPOSE 3000

LABEL org.opencontainers.image.source="https://github.com/ai-sdlc/assistant-platform"
LABEL org.opencontainers.image.description="AI SDLC Assistant Platform - Web"

CMD ["node", "apps/web/server.js"]
