'use client';

import { useEffect, useState } from 'react';
import { taskApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, Circle, Calendar } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: string;
}

export function TaskList({ vendorId, refreshKey }: { vendorId: string; refreshKey: number }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const response = await taskApi.list(vendorId);
        setTasks(response.tasks || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [vendorId, refreshKey]);

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      setUpdatingId(task.id);
      await taskApi.updateStatus(task.id, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
      toast.success(`Task marked as ${newStatus.toLowerCase()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update task';
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="h-24 animate-pulse rounded-lg bg-slate-200" />;
  }

  if (tasks.length === 0) {
    return <p className="text-sm text-slate-600">No tasks for this vendor.</p>;
  }

  const priorityColor: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`rounded-lg border p-4 ${
            task.status === 'COMPLETED' ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-1 items-start gap-3">
              <button
                onClick={() => toggleTaskStatus(task)}
                disabled={updatingId === task.id}
                className="mt-0.5 shrink-0"
              >
                {task.status === 'COMPLETED' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-400" />
                )}
              </button>
              <div>
                <p
                  className={`font-medium ${
                    task.status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-slate-900'
                  }`}
                >
                  {task.title}
                </p>
                {task.description && <p className="text-sm text-slate-600">{task.description}</p>}
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityColor[task.priority]}`}>
                    {task.priority}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {task.status}
                  </span>
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
