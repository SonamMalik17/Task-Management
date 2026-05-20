'use client';
import { useState } from 'react';
import type { TaskSuggestion } from '@ai-task/shared';
import { Sparkles } from 'lucide-react';
import { useSuggestTasksMutation } from '@/features/ai/services/aiApi';
import { useCreateTaskMutation } from '@/features/tasks/services/taskApi';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

export function AIAssistPanel({ boardId }: { boardId: string }) {
  const [intent, setIntent] = useState('');
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [suggest, { isLoading: suggesting }] = useSuggestTasksMutation();
  const [createTask] = useCreateTaskMutation();

  const onSuggest = async () => {
    const result = await suggest({ boardId, intent: intent || undefined, count: 5 }).unwrap();
    setSuggestions(result);
  };

  const onAdd = async (s: TaskSuggestion) => {
    await createTask({
      boardId,
      title: s.title,
      description: s.description,
      priority: s.priority,
    });
    setSuggestions((prev) => prev.filter((x) => x.title !== s.title));
  };

  return (
    <div className="flex h-full w-80 shrink-0 flex-col rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-300">
        <Sparkles size={16} />
        AI assist
      </div>
      <Input
        id="intent"
        label="What are you trying to accomplish?"
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        placeholder="e.g. launch checklist"
      />
      <Button className="mt-3" onClick={onSuggest} isLoading={suggesting}>
        Suggest tasks
      </Button>
      <div className="mt-4 flex flex-1 flex-col gap-2 overflow-y-auto">
        {suggestions.map((s) => (
          <div key={s.title} className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
            <p className="text-sm font-medium text-slate-100">{s.title}</p>
            <p className="mt-1 text-xs text-slate-400">{s.reason}</p>
            <Button size="sm" variant="secondary" className="mt-2" onClick={() => onAdd(s)}>
              Add to board
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
