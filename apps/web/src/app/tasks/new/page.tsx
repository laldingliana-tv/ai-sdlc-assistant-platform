import { TaskForm } from '@/components/tasks/task-form';

export default function NewTaskPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Task</h1>
        <p className="text-muted-foreground">
          Define a new development task to trigger the AI SDLC workflow
        </p>
      </div>
      <TaskForm />
    </div>
  );
}
