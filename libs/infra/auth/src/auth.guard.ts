import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * Auth guard placeholder — will be replaced with JWT validation in Phase 6.
 * Currently allows all requests through for development.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // TODO: Implement JWT validation
    // const request = context.switchToHttp().getRequest();
    // const token = this.extractToken(request);
    // if (!token) return false;
    // const payload = await this.jwtService.verifyAsync(token);
    // request.user = payload;
    return true;
  }
}
