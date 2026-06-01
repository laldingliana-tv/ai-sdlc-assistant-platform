import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { ThrottleGuard } from './throttle.guard.js';

@Module({
  providers: [AuthGuard, ThrottleGuard],
  exports: [AuthGuard, ThrottleGuard],
})
export class AuthModule {}
