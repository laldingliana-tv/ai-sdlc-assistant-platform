import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { HealthModule } from './health/health.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { WorkflowsModule } from './workflows/workflows.module.js';
import { EvaluationsModule } from './evaluations/evaluations.module.js';
import { EventsModule } from './events/events.module.js';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor.js';

@Module({
  imports: [
    ConfigModule,
    HealthModule,
    TasksModule,
    WorkflowsModule,
    EvaluationsModule,
    EventsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
