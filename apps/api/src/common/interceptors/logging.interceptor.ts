import { createLogger } from '@ai-sdlc/infra/telemetry';
import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs';

const logger = createLogger({ name: 'HTTP' });

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const duration = Date.now() - start;
        logger.info(
          { method, url, statusCode, duration },
          `${method} ${url} ${statusCode} ${duration}ms`,
        );
      }),
    );
  }
}
