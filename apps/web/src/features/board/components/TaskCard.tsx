'use client';
import type { Task } from '@ai-task/shared';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PriorityBadge } from '@/shared/components/ui/PriorityBadge';
import { useAppDispatch } from '@/store/store';
import { selectTask } from '@/features/ui/uiSlice';
import { cn } from '@/shared/lib/cn';

export function TaskCard({ task }: { task: Task }) {
  const dispatch = useAppDispatch();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => dispatch(selectTask(task.id))}
      className={cn(
        'cursor-grab select-none rounded-lg border border-slate-700 bg-slate-800/80 p-3 hover:border-indigo-500/50',
        isDragging && 'opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate-100">{task.title}</p>
        <PriorityBadge priority={task.priority} />
      </div>
      {task.dueDate ? (
        <p className="mt-2 text-xs text-slate-400">
          Due {new Date(task.dueDate).toLocaleDateString()}
        </p>
      ) : null}
      {task.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((t) => (
            <span key={t} className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] text-slate-300">
              #{t}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
