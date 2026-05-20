export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const USER_ROLES = ['owner', 'admin', 'member', 'viewer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ACTIVITY_ACTIONS = [
  'task.created',
  'task.updated',
  'task.deleted',
  'task.moved',
  'task.assigned',
  'task.completed',
  'comment.added',
  'board.created',
  'member.added',
  'member.removed',
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const NOTIFICATION_TYPES = [
  'task_assigned',
  'task_due_soon',
  'mention',
  'comment',
  'board_invite',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
