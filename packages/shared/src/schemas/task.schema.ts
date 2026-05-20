import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants';
import { ObjectIdSchema, TimestampsSchema } from './common.schema';

export const ChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(280),
  done: z.boolean().default(false),
});

export const CommentSchema = z
  .object({
    id: ObjectIdSchema,
    taskId: ObjectIdSchema,
    authorId: ObjectIdSchema,
    body: z.string().min(1).max(4000),
  })
  .merge(TimestampsSchema);

export const TaskSchema = z
  .object({
    id: ObjectIdSchema,
    boardId: ObjectIdSchema,
    title: z.string().min(1).max(200),
    description: z.string().max(10_000).default(''),
    status: z.enum(TASK_STATUSES).default('todo'),
    priority: z.enum(TASK_PRIORITIES).default('medium'),
    // position is a float to allow cheap reordering without rewriting siblings.
    // We insert between two items as (a.position + b.position) / 2.
    position: z.number(),
    assigneeIds: z.array(ObjectIdSchema).default([]),
    creatorId: ObjectIdSchema,
    dueDate: z.coerce.date().nullable().optional(),
    tags: z.array(z.string().max(40)).default([]),
    checklist: z.array(ChecklistItemSchema).default([]),
    aiSummary: z.string().nullable().optional(),
    completedAt: z.coerce.date().nullable().optional(),
  })
  .merge(TimestampsSchema);

export type Task = z.infer<typeof TaskSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

// Input shapes — explicitly defined rather than `.partial()` so the API contract
// is greppable and we can document each field in api-contracts.md.
export const CreateTaskInputSchema = z.object({
  boardId: ObjectIdSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(10_000).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assigneeIds: z.array(ObjectIdSchema).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  tags: z.array(z.string().max(40)).optional(),
});

export const UpdateTaskInputSchema = CreateTaskInputSchema.partial().extend({
  checklist: z.array(ChecklistItemSchema).optional(),
});

export const MoveTaskInputSchema = z.object({
  status: z.enum(TASK_STATUSES),
  position: z.number(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>;
export type MoveTaskInput = z.infer<typeof MoveTaskInputSchema>;
