import { z } from 'zod';
import { ACTIVITY_ACTIONS, NOTIFICATION_TYPES } from '../constants';
import { ObjectIdSchema, TimestampsSchema } from './common.schema';

export const ActivityLogSchema = z
  .object({
    id: ObjectIdSchema,
    boardId: ObjectIdSchema,
    actorId: ObjectIdSchema,
    action: z.enum(ACTIVITY_ACTIONS),
    // `metadata` is intentionally an open record — activity payloads vary by action.
    // Consumers should narrow based on `action`.
    metadata: z.record(z.unknown()).default({}),
  })
  .merge(TimestampsSchema);

export const NotificationSchema = z
  .object({
    id: ObjectIdSchema,
    userId: ObjectIdSchema,
    type: z.enum(NOTIFICATION_TYPES),
    title: z.string(),
    body: z.string(),
    link: z.string().nullable().optional(),
    readAt: z.coerce.date().nullable().optional(),
  })
  .merge(TimestampsSchema);

export type ActivityLog = z.infer<typeof ActivityLogSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
