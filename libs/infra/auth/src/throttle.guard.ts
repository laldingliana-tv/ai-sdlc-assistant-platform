import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

interface RequestRecord {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiting guard.
 * For production, replace with a Redis-backed or Fastify plugin approach.
 */
@Injectable()
export class ThrottleGuard implements CanActivate {
  private readonly store = new Map<string, RequestRecord>();
  private readonly limit = 100;
  private readonly windowMs = 60_000; // 1 minute

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = request.ip ?? request.headers['x-forwarded-for'] ?? 'unknown';
    const now = Date.now();

    const record = this.store.get(key);

    if (!record || now > record.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    record.count++;
    if (record.count > this.limit) {
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
