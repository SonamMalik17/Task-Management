import { Schema, model, Types } from 'mongoose';
import { ACTIVITY_ACTIONS } from '@ai-task/shared';

const activitySchema = new Schema(
  {
    boardId: { type: Types.ObjectId, ref: 'Board', required: true, index: true },
    actorId: { type: Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ACTIVITY_ACTIONS, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

// Newest activities first — the feed query is sorted by createdAt descending.
activitySchema.index({ boardId: 1, createdAt: -1 });

export const ActivityModel = model('Activity', activitySchema);
