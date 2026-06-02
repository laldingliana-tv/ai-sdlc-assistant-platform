import { GitBranch } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workflows</h1>
        <p className="text-muted-foreground">View and manage AI SDLC workflow executions</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <GitBranch className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Workflow History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Workflow executions will appear here once tasks are submitted and workflows are
            triggered. Each workflow orchestrates the full SDLC pipeline: Planning → Retrieval →
            Architecture → Approval → Implementation → Review.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
