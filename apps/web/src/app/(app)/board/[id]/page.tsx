'use client';
import { useParams } from 'next/navigation';
import { useGetBoardQuery } from '@/features/board/services/boardApi';
import { useBoardRealtime } from '@/features/board/hooks/useBoardRealtime';
import { KanbanBoard } from '@/features/board/components/KanbanBoard';
import { NLTaskInput } from '@/features/ai/components/NLTaskInput';
import { AIAssistPanel } from '@/features/ai/components/AIAssistPanel';
import { TaskDetailDrawer } from '@/features/tasks/components/TaskDetailDrawer';
import { ActivityFeed } from '@/features/activity/components/ActivityFeed';
import { InviteMemberForm } from '@/features/team/components/InviteMemberForm';

export default function BoardPage() {
  const params = useParams<{ id: string }>();
  const boardId = params.id;
  const { data, isLoading } = useGetBoardQuery(boardId);
  useBoardRealtime(boardId);

  if (isLoading || !data) return <p className="p-6 text-slate-400">Loading board…</p>;
  const { board, tasks } = data;

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <div>
          <h1 className="text-xl font-semibold">{board.name}</h1>
          <p className="text-xs text-slate-400">{tasks.length} tasks</p>
        </div>
        <div className="w-[400px]">
          <InviteMemberForm boardId={boardId} />
        </div>
      </div>

      <div className="grid flex-1 grid-cols-[1fr_320px] gap-4 overflow-hidden p-4">
        <div className="flex flex-col gap-4 overflow-hidden">
          <NLTaskInput boardId={boardId} />
          <div className="flex-1 overflow-hidden">
            <KanbanBoard boardId={boardId} tasks={tasks} />
          </div>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto">
          <AIAssistPanel boardId={boardId} />
          <ActivityFeed boardId={boardId} />
        </div>
      </div>

      <TaskDetailDrawer tasks={tasks} boardId={boardId} />
    </div>
  );
}
