'use client';

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useTaskList, type Task } from '@/hooks/use-tasks';

function statusVariant(status: string) {
  switch (status) {
    case 'completed':
      return 'success' as const;
    case 'in_progress':
    case 'running':
      return 'default' as const;
    case 'failed':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
}

function TaskRow({ task }: { task: Task }) {
  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{task.title}</p>
            {task.description && (
              <p className="mt-1 truncate text-xs text-muted-foreground">{task.description}</p>
            )}
          </div>
          <div className="ml-4 flex items-center gap-2">
            {task.priority && (
              <Badge variant="outline" className="text-xs capitalize">
                {task.priority}
              </Badge>
            )}
            <Badge variant={statusVariant(task.status)} className="capitalize">
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function TaskList() {
  const { data: tasks, isLoading, error } = useTaskList();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 p-4 text-sm text-destructive">
        Failed to load tasks. Please try again.
      </div>
    );
  }

  if (!tasks?.length) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No tasks yet. Create your first task to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </div>
  );
}
