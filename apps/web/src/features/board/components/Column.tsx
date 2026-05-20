'use client';
import type { Task, TaskStatus } from '@ai-task/shared';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './TaskCard';
import { cn } from '@/shared/lib/cn';

const COLUMN_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  review: 'Review',
  done: 'Done',
};

export function Column({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full w-72 shrink-0 flex-col rounded-xl border border-slate-700 bg-slate-900/50 p-3 transition',
        isOver && 'border-indigo-500/60 bg-indigo-500/5',
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          {COLUMN_LABELS[status]}
        </h3>
        <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
