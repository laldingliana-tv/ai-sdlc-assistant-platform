import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { CreateTaskDto } from './dto/create-task.dto.js';
import type { TaskListQueryInput } from '@ai-sdlc/shared/schemas';
import { WorkflowsService } from '../workflows/workflows.service.js';

interface StoredTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  labels: string[];
  metadata: Record<string, unknown>;
  workflowExecutionId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class TasksService {
  private readonly tasks = new Map<string, StoredTask>();

  constructor(private readonly workflowsService: WorkflowsService) {}

  create(dto: CreateTaskDto): StoredTask {
    const now = new Date().toISOString();
    const task: StoredTask = {
      id: uuidv4(),
      title: dto.title,
      description: dto.description,
      status: 'pending',
      priority: dto.priority ?? 'medium',
      labels: dto.labels ?? [],
      metadata: dto.metadata ?? {},
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  findAll(query: TaskListQueryInput) {
    let results = [...this.tasks.values()];

    if (query.status) {
      results = results.filter((t) => t.status === query.status);
    }
    if (query.priority) {
      results = results.filter((t) => t.priority === query.priority);
    }
    if (query.search) {
      const search = query.search.toLowerCase();
      results = results.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search),
      );
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const paged = results.slice(start, start + pageSize);

    return {
      data: paged,
      total: results.length,
      page,
      pageSize,
    };
  }

  findOne(id: string): StoredTask {
    const task = this.tasks.get(id);
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  async submit(id: string): Promise<StoredTask> {
    const task = this.findOne(id);
    task.status = 'planning';
    task.updatedAt = new Date().toISOString();

    const execution = await this.workflowsService.trigger({ taskId: id });
    task.workflowExecutionId = execution.id;

    return task;
  }
}
