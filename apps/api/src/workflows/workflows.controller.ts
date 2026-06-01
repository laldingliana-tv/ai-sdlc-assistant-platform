import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { WorkflowsService } from './workflows.service.js';
import {
  WorkflowTriggerRequestSchema,
  ApproveWorkflowSchema,
  RejectWorkflowSchema,
} from '@ai-sdlc/shared/schemas';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type {
  WorkflowTriggerRequestInput,
  ApproveWorkflowInput,
  RejectWorkflowInput,
} from '@ai-sdlc/shared/schemas';

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

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ApproveWorkflowSchema)) body: ApproveWorkflowInput,
  ) {
    return this.workflowsService.sendApproval(id, {
      approvedBy: body.approvedBy,
      comments: body.comments,
    });
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RejectWorkflowSchema)) body: RejectWorkflowInput,
  ) {
    return this.workflowsService.sendRejection(id, {
      rejectedBy: body.rejectedBy,
      reason: body.reason,
    });
  }
}
