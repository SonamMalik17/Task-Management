import { Schema, model, Types } from 'mongoose';
import { TASK_PRIORITIES, TASK_STATUSES } from '@ai-task/shared';

const checklistItemSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false },
);

const taskSchema = new Schema(
  {
    boardId: { type: Types.ObjectId, ref: 'Board', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: TASK_STATUSES, default: 'todo', index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium' },
    position: { type: Number, required: true },
    assigneeIds: [{ type: Types.ObjectId, ref: 'User', index: true }],
    creatorId: { type: Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date, default: null },
    tags: [{ type: String }],
    checklist: { type: [checklistItemSchema], default: [] },
    aiSummary: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Compound index — the Kanban query is always (boardId, status) ordered by position.
taskSchema.index({ boardId: 1, status: 1, position: 1 });

export const TaskModel = model('Task', taskSchema);
