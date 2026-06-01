import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { WorkflowsService } from './workflows.service.js';
import { WorkflowTriggerRequestSchema } from '@ai-sdlc/shared/schemas';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { WorkflowTriggerRequestInput } from '@ai-sdlc/shared/schemas';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post('trigger')
  trigger(
    @Body(new ZodValidationPipe(WorkflowTriggerRequestSchema)) body: WorkflowTriggerRequestInput,
  ) {
    return this.workflowsService.trigger(body);
  }

  @Get(':id')
  getStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowsService.getStatus(id);
  }
}
