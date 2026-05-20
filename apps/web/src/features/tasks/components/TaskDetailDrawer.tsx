'use client';
import { useEffect, useState } from 'react';
import type { Task, TaskSummary } from '@ai-task/shared';
import { Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { selectTask } from '@/features/ui/uiSlice';
import { useSummarizeTaskMutation } from '@/features/ai/services/aiApi';
import {
  useAddCommentMutation,
  useDeleteTaskMutation,
  useUpdateTaskMutation,
} from '@/features/tasks/services/taskApi';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { PriorityBadge } from '@/shared/components/ui/PriorityBadge';

export function TaskDetailDrawer({ tasks, boardId }: { tasks: Task[]; boardId: string }) {
  const selectedId = useAppSelector((s) => s.ui.selectedTaskId);
  const dispatch = useAppDispatch();
  const task = tasks.find((t) => t.id === selectedId) ?? null;

  const [comment, setComment] = useState('');
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [summarize, { isLoading: summarizing }] = useSummarizeTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [addComment] = useAddCommentMutation();

  // Reset local state when selection changes.
  useEffect(() => {
    setSummary(null);
    setComment('');
  }, [selectedId]);

  if (!task) return null;

  const onSummarize = async () => {
    const result = await summarize({ taskId: task.id }).unwrap();
    setSummary(result);
  };

  return (
    <Modal open onClose={() => dispatch(selectTask(null))} title={task.title}>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <PriorityBadge priority={task.priority} />
        <span>•</span>
        <span>Status: {task.status}</span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">
        {task.description || <span className="text-slate-500">No description.</span>}
      </p>

      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="secondary" onClick={onSummarize} isLoading={summarizing}>
          <Sparkles size={14} /> AI summarize
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            updateTask({
              id: task.id,
              boardId,
              patch: { status: task.status === 'done' ? 'todo' : 'done' },
            })
          }
        >
          {task.status === 'done' ? 'Reopen' : 'Mark done'}
        </Button>
        <Button
          size="sm"
          variant="danger"
          className="ml-auto"
          onClick={async () => {
            await deleteTask({ id: task.id, boardId });
            dispatch(selectTask(null));
          }}
        >
          Delete
        </Button>
      </div>

      {summary ? (
        <div className="mt-4 rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3 text-sm">
          <p className="font-medium text-indigo-200">Summary</p>
          <p className="mt-1 text-slate-200">{summary.summary}</p>
          {summary.nextSteps.length > 0 ? (
            <>
              <p className="mt-3 font-medium text-indigo-200">Next steps</p>
              <ul className="mt-1 list-disc pl-5 text-slate-200">
                {summary.nextSteps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 border-t border-slate-700 pt-4">
        <p className="mb-2 text-sm font-medium">Add comment</p>
        <div className="flex gap-2">
          <Input
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={async () => {
              if (!comment.trim()) return;
              await addComment({ id: task.id, boardId, body: comment });
              setComment('');
            }}
          >
            Send
          </Button>
        </div>
      </div>
    </Modal>
  );
}
