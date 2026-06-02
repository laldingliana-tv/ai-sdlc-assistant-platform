/**
 * NestJS LoggerService adapter that wraps the telemetry pino logger.
 */

import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

import { createLogger } from '@ai-sdlc/infra/telemetry';
import type { Logger } from '@ai-sdlc/infra/telemetry';

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private readonly logger: Logger;

  constructor(context?: string) {
    this.logger = createLogger({ name: context ?? 'NestApp' });
  }

  log(message: string, ...optionalParams: unknown[]) {
    this.logger.info({ context: optionalParams[0] }, message);
  }

  error(message: string, ...optionalParams: unknown[]) {
    const [trace, context] = optionalParams;
    this.logger.error({ err: trace, context }, message);
  }

  warn(message: string, ...optionalParams: unknown[]) {
    this.logger.warn({ context: optionalParams[0] }, message);
  }

  debug(message: string, ...optionalParams: unknown[]) {
    this.logger.debug({ context: optionalParams[0] }, message);
  }

  verbose(message: string, ...optionalParams: unknown[]) {
    this.logger.trace({ context: optionalParams[0] }, message);
  }

  fatal(message: string, ...optionalParams: unknown[]) {
    this.logger.fatal({ context: optionalParams[0] }, message);
  }
}
