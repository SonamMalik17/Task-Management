'use client';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import {
  useListNotificationsQuery,
  useMarkAllReadMutation,
} from '@/features/notifications/services/notificationApi';
import { cn } from '@/shared/lib/cn';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useListNotificationsQuery({ unreadOnly: false });
  const [markAllRead] = useMarkAllReadMutation();
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 hover:bg-white/5"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            <button onClick={() => markAllRead()} className="text-xs text-indigo-300 hover:underline">
              Mark all read
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-500">No notifications</li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    'border-b border-slate-800 px-3 py-2 text-sm last:border-b-0',
                    !n.readAt && 'bg-indigo-500/5',
                  )}
                >
                  <p className="font-medium text-slate-100">{n.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{n.body}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
