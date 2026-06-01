import { Module, forwardRef } from '@nestjs/common';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';
import { WorkflowsModule } from '../workflows/workflows.module.js';

@Module({
  imports: [forwardRef(() => WorkflowsModule)],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
