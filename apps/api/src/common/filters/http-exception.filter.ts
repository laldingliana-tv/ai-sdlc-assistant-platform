import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { createLogger } from '@ai-sdlc/infra/telemetry';

const logger = createLogger({ name: 'HttpExceptionFilter' });

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const body = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      error: typeof message === 'string' ? { message } : message,
    };

    if (status >= 500) {
      logger.error({ err: exception, statusCode: status }, 'Unhandled exception');
    } else {
      logger.warn({ statusCode: status, message }, 'Client error');
    }

    response.status(status).send(body);
  }
}
