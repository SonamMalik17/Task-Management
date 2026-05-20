import type { TaskPriority } from '@ai-task/shared';
import { cn } from '@/shared/lib/cn';

const styles: Record<TaskPriority, string> = {
  low: 'bg-slate-700/50 text-slate-300 border-slate-600',
  medium: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  high: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  urgent: 'bg-red-500/15 text-red-300 border-red-500/30',
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn('rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide', styles[priority])}>
      {priority}
    </span>
  );
}
