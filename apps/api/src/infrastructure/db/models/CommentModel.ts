import { Schema, model, Types } from 'mongoose';

const commentSchema = new Schema(
  {
    taskId: { type: Types.ObjectId, ref: 'Task', required: true, index: true },
    authorId: { type: Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
  },
  { timestamps: true },
);

export const CommentModel = model('Comment', commentSchema);
