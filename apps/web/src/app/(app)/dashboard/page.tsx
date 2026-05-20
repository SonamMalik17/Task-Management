'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import {
  useCreateBoardMutation,
  useListBoardsQuery,
} from '@/features/board/services/boardApi';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

export default function DashboardPage() {
  const { data: boards = [], isLoading } = useListBoardsQuery();
  const [createBoard, { isLoading: creating }] = useCreateBoardMutation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const onCreate = async () => {
    if (!name.trim()) return;
    await createBoard({ name }).unwrap();
    setName('');
    setOpen(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your boards</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> New board
        </Button>
      </div>

      {isLoading ? (
        <p className="text-slate-400">Loading…</p>
      ) : boards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
          You don&apos;t have any boards yet. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => (
            <Link
              key={b.id}
              href={`/board/${b.id}`}
              className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 transition hover:border-indigo-500/50"
            >
              <div className="mb-3 h-2 w-12 rounded" style={{ background: b.color }} />
              <p className="text-lg font-semibold">{b.name}</p>
              <p className="mt-1 text-sm text-slate-400">
                {b.members.length + 1} member{b.members.length === 0 ? '' : 's'}
              </p>
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create a new board">
        <div className="flex flex-col gap-4">
          <Input
            id="board-name"
            label="Board name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Q2 launch"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate} isLoading={creating}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
