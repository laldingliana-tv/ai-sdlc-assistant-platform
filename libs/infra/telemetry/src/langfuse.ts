/**
 * Langfuse integration for LLM observability.
 * Placeholder — will be fully wired once agents are active.
 */

import { Langfuse } from 'langfuse';

import { logger } from './logger.js';

export interface LangfuseConfig {
  publicKey?: string;
  secretKey?: string;
  baseUrl?: string;
  enabled?: boolean;
}

let langfuseInstance: Langfuse | undefined;

export function initLangfuse(config: LangfuseConfig = {}): Langfuse | undefined {
  const {
    publicKey = process.env['LANGFUSE_PUBLIC_KEY'],
    secretKey = process.env['LANGFUSE_SECRET_KEY'],
    baseUrl = process.env['LANGFUSE_HOST'] ?? 'https://cloud.langfuse.com',
    enabled = !!(process.env['LANGFUSE_PUBLIC_KEY'] && process.env['LANGFUSE_SECRET_KEY']),
  } = config;

  if (!enabled || !publicKey || !secretKey) {
    logger.info('Langfuse disabled (missing keys or explicitly disabled)');
    return undefined;
  }

  langfuseInstance = new Langfuse({
    publicKey,
    secretKey,
    baseUrl,
  });

  logger.info({ baseUrl }, 'Langfuse initialized');
  return langfuseInstance;
}

export function getLangfuse(): Langfuse | undefined {
  return langfuseInstance;
}

export async function shutdownLangfuse(): Promise<void> {
  if (langfuseInstance) {
    await langfuseInstance.shutdownAsync();
    logger.info('Langfuse shut down');
  }
}
