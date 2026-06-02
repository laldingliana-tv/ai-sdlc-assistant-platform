import { PrismaService } from '@ai-sdlc/infra/database';
import type { TaskListQueryInput } from '@ai-sdlc/shared/schemas';
import { Injectable, NotFoundException } from '@nestjs/common';

import { WorkflowsService } from '../workflows/workflows.service.js';

import type { CreateTaskDto } from './dto/create-task.dto.js';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowsService: WorkflowsService,
  ) {}

  async create(dto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: 'PENDING',
        priority:
          (dto.priority?.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') ?? 'MEDIUM',
        labels: dto.labels ?? [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: (dto.metadata ?? {}) as any,
        createdById: 'system', // TODO: Replace with authenticated user ID
      },
    });
    return this.mapTask(task);
  }

  async findAll(query: TaskListQueryInput) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (query.status) {
      where.status = query.status.toUpperCase();
    }
    if (query.priority) {
      where.priority = query.priority.toUpperCase();
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: data.map((t) => this.mapTask(t)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return this.mapTask(task);
  }

  async submit(id: string) {
    await this.prisma.task.update({
      where: { id },
      data: { status: 'PLANNING' },
    });

    const execution = await this.workflowsService.trigger({ taskId: id });
    const updated = await this.prisma.task.update({
      where: { id },
      data: { workflowExecutionId: execution.id },
    });

    return this.mapTask(updated);
  }

  private mapTask(task: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    labels: string[];
    metadata: unknown;
    workflowExecutionId: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status.toLowerCase(),
      priority: task.priority.toLowerCase(),
      labels: task.labels,
      metadata: task.metadata as Record<string, unknown>,
      workflowExecutionId: task.workflowExecutionId ?? undefined,
      createdBy: task.createdById,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }
}
