"use client";

import AppShell from "@/components/layouts/app-shell";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Task = {
  id: string;
  content: string;
  is_completed: boolean;
  workspace_id?: string;
  created_at?: string;
};

export default function MyTasksPage() {
  return (
    <AppShell>
      <MyTasksContent />
    </AppShell>
  );
}

function MyTasksContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchTasks() {
    try {
      // Fetching without workspaceId should return all tasks
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        console.error("Failed to fetch tasks");
        toast.error("Failed to load tasks");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  async function toggleTask(task: Task) {
    // Optimistic update
    const newStatus = !task.is_completed;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_completed: newStatus } : t)));

    try {
      const res = await fetch("/api/tasks", {
        method: "POST", // Using POST as upsert/sync per existing API logic
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: task.workspace_id,
          // We need to send array of tasks to sync, ideally just this one for update
          // existing API expects { tasks: [], workspaceId }
          // This is a bit tricky with current API design which is bulk sync.
          // Let's see if we can just send this one task.
          tasks: [{ id: task.id, content: task.content, checked: newStatus }],
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }
    } catch (err) {
      toast.error("Failed to update task");
      // Revert
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_completed: !newStatus } : t)));
    }
  }

  const activeTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks.filter((t) => t.is_completed);

  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col gap-8 mb-8">
        <h1 className="font-black uppercase leading-none border-l-8 border-foreground pl-6 text-4xl">MY TASKS</h1>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-lg font-bold uppercase animate-pulse">
          <Loader2 className="h-5 w-5 animate-spin" />
          LOADING TASKS...
        </div>
      ) : (
        <div className="space-y-12">
          {tasks.length === 0 && (
            <div className="border-brutal p-8 bg-muted text-center">
              <p className="font-bold uppercase opacity-60">NO TASKS FOUND</p>
            </div>
          )}

          {activeTasks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black uppercase border-b-4 border-foreground pb-2">TO DO</h2>
              <div className="grid gap-4">
                {activeTasks.map((task) => (
                  <TaskItem key={task.id || Math.random()} task={task} onToggle={() => toggleTask(task)} />
                ))}
              </div>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black uppercase border-b-4 border-foreground pb-2 opacity-50">COMPLETED</h2>
              <div className="grid gap-4 opacity-60">
                {completedTasks.map((task) => (
                  <TaskItem key={task.id || Math.random()} task={task} onToggle={() => toggleTask(task)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskItem({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <div className="group flex items-start gap-4 p-4 border-brutal bg-card hover:translate-x-1 transition-transform">
      <button onClick={onToggle} className="mt-1 text-foreground hover:text-accent transition-colors">
        {task.is_completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
      </button>
      <div className="flex-1">
        <p className={`font-bold text-lg leading-snug ${task.is_completed ? "line-through opacity-50" : ""}`}>
          {task.content}
        </p>
        {task.workspace_id && (
          <p className="text-xs font-mono uppercase opacity-40 mt-2">WS: {task.workspace_id.slice(0, 8)}...</p>
        )}
      </div>
    </div>
  );
}
