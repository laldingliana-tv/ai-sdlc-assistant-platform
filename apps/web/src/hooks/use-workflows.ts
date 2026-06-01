'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface WorkflowStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_approval';
  startedAt?: string;
  completedAt?: string;
  output?: unknown;
}

export interface WorkflowExecution {
  id: string;
  taskId: string;
  status: string;
  steps: WorkflowStep[];
  startedAt: string;
  completedAt?: string;
}

export interface TriggerWorkflowInput {
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
}

export function useWorkflow(id: string) {
  return useQuery<WorkflowExecution>({
    queryKey: ['workflows', id],
    queryFn: () => apiClient.get<WorkflowExecution>(`/workflows/${id}`),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useTriggerWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TriggerWorkflowInput) =>
      apiClient.post<{ workflowId: string }>('/workflows/trigger', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useApproveWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId: string) => apiClient.get<void>(`/workflows/${workflowId}/approve`),
    onSuccess: (_, workflowId) => {
      queryClient.invalidateQueries({ queryKey: ['workflows', workflowId] });
    },
  });
}

export function useWorkflowList() {
  return useQuery<WorkflowExecution[]>({
    queryKey: ['workflows'],
    queryFn: () => apiClient.get<WorkflowExecution[]>('/workflows'),
  });
}
