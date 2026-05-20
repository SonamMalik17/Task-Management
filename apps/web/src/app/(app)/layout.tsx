'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { signOut } from '@/features/auth/store/authSlice';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { Button } from '@/shared/components/ui/Button';

// Authenticated shell. If no token, bounce to /login. Server-side auth would
// be cleaner; we stick to client checks because tokens live in localStorage.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, accessToken } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!accessToken) router.replace('/login');
  }, [accessToken, router]);

  if (!accessToken) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <Link href="/dashboard" className="text-base font-semibold">
          AI Task Manager
        </Link>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <span className="text-sm text-slate-400">{user?.name}</span>
          <Button size="sm" variant="ghost" onClick={() => dispatch(signOut())}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
