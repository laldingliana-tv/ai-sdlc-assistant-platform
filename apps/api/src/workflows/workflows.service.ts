import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { WorkflowTriggerRequestInput } from '@ai-sdlc/shared/schemas';

interface WorkflowExecution {
  id: string;
  taskId: string;
  temporalWorkflowId: string;
  temporalRunId: string;
  status: string;
  currentStep: string;
  steps: Array<{
    step: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
  }>;
  startedAt: string;
  completedAt?: string;
}

/**
 * WorkflowsService acts as a Temporal client — it starts and queries workflows.
 * Actual workflow definitions and activity sequencing are owned by Temporal (Phase 5).
 */
@Injectable()
export class WorkflowsService {
  private readonly executions = new Map<string, WorkflowExecution>();

  async trigger(request: WorkflowTriggerRequestInput): Promise<WorkflowExecution> {
    // TODO: Replace with actual Temporal client connection in Phase 5
    // const handle = await temporalClient.workflow.start('aiSdlcWorkflow', {
    //   taskQueue: 'ai-sdlc-tasks',
    //   workflowId: `task-${request.taskId}`,
    //   args: [{ taskId: request.taskId }],
    // });

    const execution: WorkflowExecution = {
      id: uuidv4(),
      taskId: request.taskId,
      temporalWorkflowId: `task-${request.taskId}`,
      temporalRunId: uuidv4(),
      status: 'running',
      currentStep: 'planning',
      steps: [
        { step: 'planning', status: 'running', startedAt: new Date().toISOString() },
        { step: 'retrieval', status: 'pending' },
        { step: 'architecture_review', status: 'pending' },
        { step: 'approval_gate', status: 'pending' },
        { step: 'implementation', status: 'pending' },
        { step: 'review', status: 'pending' },
        { step: 'finalization', status: 'pending' },
      ],
      startedAt: new Date().toISOString(),
    };

    this.executions.set(execution.id, execution);
    return execution;
  }

  getStatus(id: string): WorkflowExecution {
    const execution = this.executions.get(id);
    if (!execution) {
      throw new NotFoundException(`Workflow execution ${id} not found`);
    }
    return execution;
  }
}
