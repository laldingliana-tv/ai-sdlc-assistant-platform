'use client';

import { useParams } from 'next/navigation';
import { useTask } from '@/hooks/use-tasks';
import { useTriggerWorkflow } from '@/hooks/use-workflows';
import { TraceViewer } from '@/components/trace/trace-viewer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play } from 'lucide-react';

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: task, isLoading } = useTask(params.id);
  const triggerWorkflow = useTriggerWorkflow();

  const handleTriggerWorkflow = () => {
    if (!task) return;
    triggerWorkflow.mutate({
      taskId: task.id,
      taskTitle: task.title,
      taskDescription: task.description,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!task) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Task not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
          {task.description && <p className="mt-1 text-muted-foreground">{task.description}</p>}
        </div>
        <Badge variant="outline" className="capitalize">
          {task.status.replace('_', ' ')}
        </Badge>
      </div>

      {!task.workflowId && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm text-muted-foreground">
              No workflow started yet. Trigger the AI SDLC pipeline.
            </p>
            <Button onClick={handleTriggerWorkflow} disabled={triggerWorkflow.isPending}>
              <Play className="mr-2 h-4 w-4" />
              {triggerWorkflow.isPending ? 'Starting...' : 'Start Workflow'}
            </Button>
          </CardContent>
        </Card>
      )}

      {(task.workflowId || triggerWorkflow.data?.workflowId) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workflow Execution</CardTitle>
          </CardHeader>
          <CardContent>
            <TraceViewer workflowId={task.workflowId || triggerWorkflow.data!.workflowId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
