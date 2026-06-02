/**
 * Task request/response types for the AI SDLC platform.
 */

export type TaskStatus =
  | 'pending'
  | 'planning'
  | 'retrieving'
  | 'reviewing_architecture'
  | 'awaiting_approval'
  | 'implementing'
  | 'reviewing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskCreateRequest {
  title: string;
  description: string;
  priority?: TaskPriority;
  labels?: string[];
  metadata?: Record<string, unknown>;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  labels: string[];
  metadata: Record<string, unknown>;
  workflowExecutionId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListResponse {
  tasks: TaskResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TaskListQuery {
  page?: number;
  pageSize?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}
