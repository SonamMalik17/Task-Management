'use client';
import { useMemo } from 'react';
import type { Task, TaskStatus } from '@ai-task/shared';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Column } from './Column';
import { useMoveTaskMutation } from '@/features/tasks/services/taskApi';

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

// Drag-drop strategy:
// - Dropping on a column header → append to end of that column.
// - Dropping between cards → insert with position = midpoint of neighbors.
// - Position math lives here (UI concern); the API stores whatever we send.
function computeNewPosition(
  tasksInTargetColumn: Task[],
  overTaskId: string | null,
): number {
  if (tasksInTargetColumn.length === 0) return 1024;
  if (!overTaskId) {
    const last = tasksInTargetColumn[tasksInTargetColumn.length - 1]!;
    return last.position + 1024;
  }
  const idx = tasksInTargetColumn.findIndex((t) => t.id === overTaskId);
  if (idx === -1) return tasksInTargetColumn[tasksInTargetColumn.length - 1]!.position + 1024;
  if (idx === 0) return tasksInTargetColumn[0]!.position / 2;
  return (tasksInTargetColumn[idx - 1]!.position + tasksInTargetColumn[idx]!.position) / 2;
}

export function KanbanBoard({ boardId, tasks }: { boardId: string; tasks: Task[] }) {
  const [moveTask] = useMoveTaskMutation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>(COLUMNS.map((c) => [c, []] as const));
    tasks
      .slice()
      .sort((a, b) => a.position - b.position)
      .forEach((t) => map.get(t.status)?.push(t));
    return map;
  }, [tasks]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    // `over.id` is either a column id (status) or another task id.
    const overIsColumn = COLUMNS.includes(over.id as TaskStatus);
    const targetStatus = overIsColumn
      ? (over.id as TaskStatus)
      : tasks.find((t) => t.id === over.id)?.status;
    if (!targetStatus) return;

    const targetList = (grouped.get(targetStatus) ?? []).filter((t) => t.id !== draggedTask.id);
    const position = computeNewPosition(targetList, overIsColumn ? null : (over.id as string));

    if (draggedTask.status === targetStatus && draggedTask.position === position) return;
    moveTask({
      id: draggedTask.id,
      boardId,
      input: { status: targetStatus, position },
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="flex h-full gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((status) => (
          <Column key={status} status={status} tasks={grouped.get(status) ?? []} />
        ))}
      </div>
    </DndContext>
  );
}
