'use client';
import { useState } from 'react';
import { USER_ROLES, type UserRole } from '@ai-task/shared';
import { useInviteMemberMutation } from '@/features/board/services/boardApi';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useAppDispatch } from '@/store/store';
import { showToast } from '@/features/ui/uiSlice';

export function InviteMemberForm({ boardId }: { boardId: string }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [invite, { isLoading }] = useInviteMemberMutation();
  const dispatch = useAppDispatch();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invite({ boardId, email, role }).unwrap();
      dispatch(showToast({ tone: 'success', message: 'Member added' }));
      setEmail('');
    } catch (err: any) {
      dispatch(showToast({ tone: 'error', message: err?.data?.error?.message ?? 'Invite failed' }));
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <Input
        id="invite-email"
        type="email"
        label="Invite a teammate"
        placeholder="teammate@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1"
      />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-slate-300">Role</span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100"
        >
          {USER_ROLES.filter((r) => r !== 'owner').map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" isLoading={isLoading}>
        Invite
      </Button>
    </form>
  );
}
