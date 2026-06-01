import { z } from 'zod';

export const TaskStatus = z.enum([
  'pending',
  'planning',
  'retrieving',
  'reviewing_architecture',
  'awaiting_approval',
  'implementing',
  'reviewing',
  'completed',
  'failed',
  'cancelled',
]);

export const TaskPriority = z.enum(['low', 'medium', 'high', 'critical']);

export const TaskCreateRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  priority: TaskPriority.optional().default('medium'),
  labels: z.array(z.string().max(50)).max(10).optional().default([]),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const TaskListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  search: z.string().max(200).optional(),
});

export const TaskResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  status: TaskStatus,
  priority: TaskPriority,
  labels: z.array(z.string()),
  metadata: z.record(z.unknown()),
  workflowExecutionId: z.string().uuid().optional(),
  createdBy: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TaskCreateRequestInput = z.input<typeof TaskCreateRequestSchema>;
export type TaskCreateRequestOutput = z.output<typeof TaskCreateRequestSchema>;
export type TaskListQueryInput = z.input<typeof TaskListQuerySchema>;
