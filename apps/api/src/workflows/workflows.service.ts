import { Injectable, NotFoundException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Client, Connection } from '@temporalio/client';
import type { WorkflowTriggerRequestInput } from '@ai-sdlc/shared/schemas';

const TASK_QUEUE = 'ai-sdlc-tasks';
const TEMPORAL_ADDRESS = process.env['TEMPORAL_ADDRESS'] ?? 'localhost:7233';

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
export class WorkflowsService implements OnModuleInit, OnModuleDestroy {
  private connection: Connection | undefined;
  private client: Client | undefined;
  private readonly executions = new Map<string, WorkflowExecution>();

  async onModuleInit(): Promise<void> {
    try {
      this.connection = await Connection.connect({ address: TEMPORAL_ADDRESS });
      this.client = new Client({ connection: this.connection });
      console.log(`Connected to Temporal at ${TEMPORAL_ADDRESS}`);
    } catch (err) {
      console.warn(
        `Failed to connect to Temporal at ${TEMPORAL_ADDRESS}. Falling back to mock mode.`,
        err,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection?.close();
  }

  async trigger(request: WorkflowTriggerRequestInput): Promise<WorkflowExecution> {
    const workflowId = `task-${request.taskId}`;

    if (this.client) {
      const handle = await this.client.workflow.start('aiSdlcWorkflow', {
        taskQueue: TASK_QUEUE,
        workflowId,
        args: [{ taskId: request.taskId }],
      });

      const execution: WorkflowExecution = {
        id: uuidv4(),
        taskId: request.taskId,
        temporalWorkflowId: handle.workflowId,
        temporalRunId: handle.firstExecutionRunId,
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

    // Fallback mock mode when Temporal is unavailable
    const execution: WorkflowExecution = {
      id: uuidv4(),
      taskId: request.taskId,
      temporalWorkflowId: workflowId,
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

  async getStatus(id: string): Promise<WorkflowExecution> {
    const execution = this.executions.get(id);
    if (!execution) {
      throw new NotFoundException(`Workflow execution ${id} not found`);
    }

    // If Temporal is connected, query the actual workflow status
    if (this.client) {
      try {
        const handle = this.client.workflow.getHandle(execution.temporalWorkflowId);
        const description = await handle.describe();
        execution.status = description.status.name === 'RUNNING' ? 'running' : 'completed';
      } catch {
        // If query fails, return cached status
      }
    }

    return execution;
  }

  async sendApproval(
    workflowId: string,
    payload: { approvedBy: string; comments?: string },
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Temporal client not connected');
    }
    const handle = this.client.workflow.getHandle(workflowId);
    await handle.signal('approve', payload);
  }

  async sendRejection(
    workflowId: string,
    payload: { rejectedBy: string; reason: string },
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Temporal client not connected');
    }
    const handle = this.client.workflow.getHandle(workflowId);
    await handle.signal('reject', payload);
  }
}
