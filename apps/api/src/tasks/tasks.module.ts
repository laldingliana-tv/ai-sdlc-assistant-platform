import { PrismaService } from '@ai-sdlc/infra/database';
import { Module, forwardRef } from '@nestjs/common';

import { WorkflowsModule } from '../workflows/workflows.module.js';

import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

@Module({
  imports: [forwardRef(() => WorkflowsModule)],
  controllers: [TasksController],
  providers: [PrismaService, TasksService],
  exports: [TasksService],
})
export class TasksModule {}
