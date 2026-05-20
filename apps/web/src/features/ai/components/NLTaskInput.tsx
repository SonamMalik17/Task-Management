'use client';
import { useState } from 'react';
import type { ParsedTaskDraft } from '@ai-task/shared';
import { Sparkles } from 'lucide-react';
import { useParseTaskMutation } from '@/features/ai/services/aiApi';
import { useCreateTaskMutation } from '@/features/tasks/services/taskApi';
import { useAppDispatch } from '@/store/store';
import { showToast } from '@/features/ui/uiSlice';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

// Natural-language task creation. Two-step UX:
// 1. User types prose → AI returns a draft + confidence.
// 2. We show the draft for confirmation BEFORE creating the task. Low
//    confidence (<0.5) gets a clearer warning. Never auto-commit blind.
export function NLTaskInput({ boardId }: { boardId: string }) {
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<ParsedTaskDraft | null>(null);
  const [parseTask, { isLoading: parsing }] = useParseTaskMutation();
  const [createTask, { isLoading: creating }] = useCreateTaskMutation();
  const dispatch = useAppDispatch();

  const onParse = async () => {
    if (!text.trim()) return;
    try {
      const result = await parseTask({ boardId, text }).unwrap();
      setDraft(result);
    } catch (err: any) {
      dispatch(showToast({ tone: 'error', message: err?.data?.error?.message ?? 'AI parse failed' }));
    }
  };

  const onConfirm = async () => {
    if (!draft) return;
    await createTask({
      boardId,
      title: draft.title,
      description: draft.description,
      priority: draft.priority,
      dueDate: draft.dueDate ?? null,
      tags: draft.tags,
    });
    setDraft(null);
    setText('');
    dispatch(showToast({ tone: 'success', message: 'Task created from AI draft' }));
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-300">
        <Sparkles size={16} />
        Describe a task in plain English
      </div>
      <div className="flex gap-2">
        <Input
          id="nl-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='e.g. "Urgent: ship release notes by Friday"'
          className="flex-1"
        />
        <Button onClick={onParse} isLoading={parsing}>
          Parse
        </Button>
      </div>

      {draft ? (
        <div className="mt-3 rounded-lg border border-slate-700 bg-slate-800/70 p-3 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium">Suggested task</span>
            <span
              className={
                draft.confidence < 0.5
                  ? 'rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300'
                  : 'rounded bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300'
              }
            >
              {(draft.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
          <p className="text-slate-200">{draft.title}</p>
          <p className="mt-1 text-xs text-slate-400">
            Priority: {draft.priority}
            {draft.dueDate ? ` • Due ${new Date(draft.dueDate).toLocaleDateString()}` : ''}
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={onConfirm} isLoading={creating}>
              Create task
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
