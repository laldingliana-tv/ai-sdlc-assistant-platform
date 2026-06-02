'use client';

import { useEffect } from 'react';
import { Check, Circle, Loader2, XCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useWorkflow, useApproveWorkflow, type WorkflowStep } from '@/hooks/use-workflows';
import { useEventStream } from '@/hooks/use-event-stream';
import { useQueryClient } from '@tanstack/react-query';

interface TraceViewerProps {
  workflowId: string;
}

function StepIcon({ status }: { status: WorkflowStep['status'] }) {
  switch (status) {
    case 'completed':
      return <Check className="h-4 w-4 text-emerald-500" />;
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'waiting_approval':
      return <ShieldCheck className="h-4 w-4 text-amber-500" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

function StepCard({ step, workflowId }: { step: WorkflowStep; workflowId: string }) {
  const approveWorkflow = useApproveWorkflow();
  const isWaiting = step.status === 'waiting_approval';

  return (
    <div
      className={cn(
        'relative flex items-start gap-4 rounded-lg border p-4 transition-all',
        step.status === 'running' && 'border-primary/50 bg-primary/5',
        step.status === 'completed' && 'border-emerald-500/30 bg-emerald-500/5',
        step.status === 'waiting_approval' && 'border-amber-500/30 bg-amber-500/5',
        step.status === 'failed' && 'border-destructive/30 bg-destructive/5',
        step.status === 'pending' && 'opacity-60',
      )}
    >
      <div className="mt-0.5">
        <StepIcon status={step.status} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium capitalize">{step.name.replace(/_/g, ' ')}</p>
          {step.completedAt && (
            <span className="text-xs text-muted-foreground">
              {new Date(step.completedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
        {isWaiting && (
          <div className="mt-3">
            <Button
              size="sm"
              onClick={() => approveWorkflow.mutate(workflowId)}
              disabled={approveWorkflow.isPending}
            >
              {approveWorkflow.isPending ? 'Approving...' : 'Approve'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function TraceViewer({ workflowId }: TraceViewerProps) {
  const { data: workflow, isLoading } = useWorkflow(workflowId);
  const { events } = useEventStream(workflowId);
  const queryClient = useQueryClient();

  // Invalidate workflow query when SSE events arrive
  useEffect(() => {
    if (events.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['workflows', workflowId] });
    }
  }, [events.length, queryClient, workflowId]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No workflow execution found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Workflow Trace</h3>
        <span className="text-xs capitalize text-muted-foreground">
          {workflow.status.replace('_', ' ')}
        </span>
      </div>
      <div className="relative space-y-2">
        {/* Vertical timeline line */}
        <div className="absolute left-[1.4rem] top-4 bottom-4 w-px bg-border" />
        {workflow.steps.map((step, index) => (
          <StepCard key={index} step={step} workflowId={workflowId} />
        ))}
      </div>
    </div>
  );
}
