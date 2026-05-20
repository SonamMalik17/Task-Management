'use client';
import { useListActivityQuery } from '@/features/activity/services/activityApi';

const VERB: Record<string, string> = {
  'task.created': 'created a task',
  'task.updated': 'updated a task',
  'task.deleted': 'deleted a task',
  'task.moved': 'moved a task',
  'task.assigned': 'assigned a task',
  'task.completed': 'completed a task',
  'comment.added': 'commented on a task',
  'board.created': 'created the board',
  'member.added': 'added a member',
  'member.removed': 'removed a member',
};

export function ActivityFeed({ boardId }: { boardId: string }) {
  const { data: items = [] } = useListActivityQuery({ boardId, limit: 50 });
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <p className="mb-3 text-sm font-semibold text-slate-200">Activity</p>
      <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto text-xs text-slate-300">
        {items.length === 0 ? (
          <li className="text-slate-500">No activity yet.</li>
        ) : (
          items.map((a) => (
            <li key={a.id} className="border-b border-slate-800 pb-1.5 last:border-b-0">
              <span className="text-indigo-300">User</span>{' '}
              <span>{VERB[a.action] ?? a.action}</span>{' '}
              <span className="text-slate-500">
                · {new Date(a.createdAt).toLocaleString()}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
