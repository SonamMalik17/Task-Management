import type { TaskPriority, TaskStatus, ChecklistItem } from '@ai-task/shared';

export interface TaskProps {
  id: string;
  boardId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  assigneeIds: string[];
  creatorId: string;
  dueDate?: Date | null;
  tags: string[];
  checklist: ChecklistItem[];
  aiSummary?: string | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Task {
  constructor(public readonly props: TaskProps) {}

  get id(): string {
    return this.props.id;
  }

  // Domain behavior lives on the entity. Setting status to 'done' is the only
  // way to set completedAt — the field can't be tampered with from outside.
  markComplete(at: Date = new Date()): Task {
    return new Task({
      ...this.props,
      status: 'done',
      completedAt: at,
      updatedAt: at,
    });
  }

  isOverdue(now: Date = new Date()): boolean {
    return Boolean(this.props.dueDate && this.props.dueDate < now && this.props.status !== 'done');
  }

  toJSON() {
    return { ...this.props };
  }
}
