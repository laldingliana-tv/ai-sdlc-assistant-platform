import { Module, forwardRef } from '@nestjs/common';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';
import { WorkflowsModule } from '../workflows/workflows.module.js';
import { PrismaService } from '@ai-sdlc/infra/database';

@Module({
  imports: [forwardRef(() => WorkflowsModule)],
  controllers: [TasksController],
  providers: [PrismaService, TasksService],
  exports: [TasksService],
})
export class TasksModule {}
