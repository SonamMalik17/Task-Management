import { Schema, model, Types } from 'mongoose';
import { USER_ROLES } from '@ai-task/shared';

const memberSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: USER_ROLES, default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const boardSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    ownerId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    members: { type: [memberSchema], default: [] },
    color: { type: String, default: '#6366f1' },
  },
  { timestamps: true },
);

boardSchema.index({ 'members.userId': 1 });

export const BoardModel = model('Board', boardSchema);
