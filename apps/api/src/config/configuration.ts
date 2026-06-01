import { EnvSchema } from '@ai-sdlc/shared/schemas';
import type { Env } from '@ai-sdlc/shared/schemas';

export function configuration(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.errors
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${formatted}`);
  }
  return result.data;
}
