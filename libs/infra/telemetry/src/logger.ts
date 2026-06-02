/**
 * Structured logger built on pino (framework-agnostic).
 */

import pino from 'pino';

export interface LoggerOptions {
  name?: string;
  level?: string;
  pretty?: boolean;
}

export function createLogger(options: LoggerOptions = {}) {
  const { name = 'ai-sdlc', level = 'info', pretty } = options;

  const usePretty = pretty ?? process.env['NODE_ENV'] !== 'production';

  return pino({
    name,
    level: process.env['LOG_LEVEL'] ?? level,
    ...(usePretty ? { transport: { target: 'pino-pretty', options: { colorize: true } } } : {}),
  });
}

export type Logger = pino.Logger;

/** Default singleton logger instance */
export const logger = createLogger();
