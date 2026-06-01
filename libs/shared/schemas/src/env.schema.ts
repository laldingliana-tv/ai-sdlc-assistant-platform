import { z } from 'zod';

/**
 * Reusable environment variable validation schema.
 * Used at app bootstrap to fail fast on missing/invalid config.
 */
export const EnvSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // Auth
  JWT_SECRET: z.string().min(16).optional(),
  JWT_EXPIRES_IN: z.string().default('1h'),

  // Temporal
  TEMPORAL_ADDRESS: z.string().default('localhost:7233'),
  TEMPORAL_NAMESPACE: z.string().default('default'),
  TEMPORAL_TASK_QUEUE: z.string().default('ai-sdlc-tasks'),

  // LLM Providers
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Observability
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_HOST: z.string().url().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),

  // MCP Providers
  GITHUB_TOKEN: z.string().optional(),
  JIRA_BASE_URL: z.string().url().optional(),
  JIRA_API_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;
