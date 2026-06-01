import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const correlationId =
      request.headers[CORRELATION_ID_HEADER] ?? uuidv4();

    request.headers[CORRELATION_ID_HEADER] = correlationId;
    response.header(CORRELATION_ID_HEADER, correlationId);

    return next.handle();
  }
}
