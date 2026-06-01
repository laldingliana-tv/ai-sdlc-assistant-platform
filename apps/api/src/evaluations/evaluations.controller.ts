import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service.js';

@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Get()
  findAll(@Query('taskId') taskId?: string) {
    return this.evaluationsService.findAll(taskId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.evaluationsService.findOne(id);
  }
}
