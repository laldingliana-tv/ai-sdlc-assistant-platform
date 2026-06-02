import { Plus } from 'lucide-react';
import Link from 'next/link';

import { TaskList } from '@/components/tasks/task-list';
import { Button } from '@/components/ui/button';

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage your development tasks</p>
        </div>
        <Link href="/tasks/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </Link>
      </div>
      <TaskList />
    </div>
  );
}
