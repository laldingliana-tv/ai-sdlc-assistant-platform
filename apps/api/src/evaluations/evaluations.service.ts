import { Injectable, NotFoundException } from '@nestjs/common';

interface EvaluationResult {
  id: string;
  taskId: string;
  agentName: string;
  workflowExecutionId: string;
  scores: Array<{ criteria: string; score: number; reasoning?: string }>;
  overallScore: number;
  evaluatedAt: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class EvaluationsService {
  private readonly evaluations = new Map<string, EvaluationResult>();

  findAll(taskId?: string): EvaluationResult[] {
    const results = [...this.evaluations.values()];
    if (taskId) {
      return results.filter((e) => e.taskId === taskId);
    }
    return results;
  }

  findOne(id: string): EvaluationResult {
    const evaluation = this.evaluations.get(id);
    if (!evaluation) {
      throw new NotFoundException(`Evaluation ${id} not found`);
    }
    return evaluation;
  }
}
