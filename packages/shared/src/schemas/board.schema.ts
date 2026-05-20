import { z } from 'zod';
import { USER_ROLES } from '../constants';
import { ObjectIdSchema, TimestampsSchema } from './common.schema';

export const BoardMemberSchema = z.object({
  userId: ObjectIdSchema,
  role: z.enum(USER_ROLES),
  joinedAt: z.coerce.date(),
});

export const BoardSchema = z
  .object({
    id: ObjectIdSchema,
    name: z.string().min(1).max(120),
    description: z.string().max(2000).default(''),
    ownerId: ObjectIdSchema,
    members: z.array(BoardMemberSchema).default([]),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1'),
  })
  .merge(TimestampsSchema);

export type Board = z.infer<typeof BoardSchema>;
export type BoardMember = z.infer<typeof BoardMemberSchema>;

export const CreateBoardInputSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const InviteMemberInputSchema = z.object({
  email: z.string().email(),
  role: z.enum(USER_ROLES).default('member'),
});

export type CreateBoardInput = z.infer<typeof CreateBoardInputSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberInputSchema>;
