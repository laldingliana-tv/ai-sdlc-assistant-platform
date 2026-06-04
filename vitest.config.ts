import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@ai-sdlc/agents/core': resolve(__dirname, 'libs/agents/core/src/index.ts'),
      '@ai-sdlc/agents/planner': resolve(__dirname, 'libs/agents/planner/src/index.ts'),
      '@ai-sdlc/agents/retriever': resolve(__dirname, 'libs/agents/retriever/src/index.ts'),
      '@ai-sdlc/agents/reviewer': resolve(__dirname, 'libs/agents/reviewer/src/index.ts'),
      '@ai-sdlc/agents/architecture': resolve(__dirname, 'libs/agents/architecture/src/index.ts'),
      '@ai-sdlc/agents/implementor': resolve(__dirname, 'libs/agents/implementor/src/index.ts'),
      '@ai-sdlc/ai/model-gateway': resolve(__dirname, 'libs/ai/model-gateway/src/index.ts'),
      '@ai-sdlc/shared/types': resolve(__dirname, 'libs/shared/types/src/index.ts'),
      '@ai-sdlc/shared/schemas': resolve(__dirname, 'libs/shared/schemas/src/index.ts'),
      '@ai-sdlc/shared/constants': resolve(__dirname, 'libs/shared/constants/src/index.ts'),
      '@ai-sdlc/shared/prompts': resolve(__dirname, 'libs/shared/prompts/src/index.ts'),
      '@ai-sdlc/infra/telemetry': resolve(__dirname, 'libs/infra/telemetry/src/index.ts'),
      '@ai-sdlc/infra/logging': resolve(__dirname, 'libs/infra/logging/src/index.ts'),
      '@ai-sdlc/infra/governance': resolve(__dirname, 'libs/infra/governance/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['libs/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
