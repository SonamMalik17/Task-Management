'use client';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { showToast } from '@/features/ui/uiSlice';
import { cn } from '@/shared/lib/cn';

// Auto-dismiss after 3s. Manual dismiss on click. Tone colors map to severity.
export function Toaster() {
  const toast = useAppSelector((s) => s.ui.toast);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => dispatch(showToast(null)), 3000);
    return () => clearTimeout(t);
  }, [toast, dispatch]);

  if (!toast) return null;

  return (
    <div
      onClick={() => dispatch(showToast(null))}
      className={cn(
        'fixed bottom-6 right-6 z-[60] cursor-pointer rounded-lg border px-4 py-3 text-sm shadow-lg',
        toast.tone === 'success' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
        toast.tone === 'error' && 'border-red-500/30 bg-red-500/10 text-red-200',
        toast.tone === 'info' && 'border-slate-700 bg-slate-800 text-slate-200',
      )}
    >
      {toast.message}
    </div>
  );
}
