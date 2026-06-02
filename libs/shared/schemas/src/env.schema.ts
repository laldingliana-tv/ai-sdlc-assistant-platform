import { z } from 'zod';

/**
 * Treats empty strings as undefined, so empty env vars don't fail URL validation.
 */
const optionalUrl = z.preprocess(
  (val) => (val === '' ? undefined : val),
  z.string().url().optional(),
);

const optionalString = z.preprocess((val) => (val === '' ? undefined : val), z.string().optional());

/**
 * Reusable environment variable validation schema.
 * Used at app bootstrap to fail fast on missing/invalid config.
 */
export const EnvSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database
  DATABASE_URL: optionalUrl,

  // Auth
  JWT_SECRET: optionalString,
  JWT_EXPIRES_IN: z.string().default('1h'),

  // Temporal
  TEMPORAL_ADDRESS: z.string().default('localhost:7233'),
  TEMPORAL_NAMESPACE: z.string().default('default'),
  TEMPORAL_TASK_QUEUE: z.string().default('ai-sdlc-tasks'),

  // LLM Providers
  OPENAI_API_KEY: optionalString,
  ANTHROPIC_API_KEY: optionalString,

  // Observability
  LANGFUSE_PUBLIC_KEY: optionalString,
  LANGFUSE_SECRET_KEY: optionalString,
  LANGFUSE_HOST: optionalUrl,
  OTEL_EXPORTER_OTLP_ENDPOINT: optionalUrl,

  // MCP Providers
  GITHUB_TOKEN: optionalString,
  JIRA_BASE_URL: optionalUrl,
  JIRA_API_TOKEN: optionalString,
});

export type Env = z.infer<typeof EnvSchema>;
