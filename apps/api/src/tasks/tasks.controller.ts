import { TaskListQuerySchema } from '@ai-sdlc/shared/schemas';
import type { TaskListQueryInput } from '@ai-sdlc/shared/schemas';
import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import type { CreateTaskDto } from './dto/create-task.dto.js';
import { CreateTaskDtoSchema } from './dto/create-task.dto.js';
import { TasksService } from './tasks.service.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body(new ZodValidationPipe(CreateTaskDtoSchema)) createTaskDto: Record<string, unknown>) {
    return this.tasksService.create(createTaskDto as unknown as CreateTaskDto);
  }

  @Get()
  findAll(@Query(new ZodValidationPipe(TaskListQuerySchema)) query: TaskListQueryInput) {
    return this.tasksService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }

  @Post(':id/submit')
  submit(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.submit(id);
  }
}
