import { Schema, model, type InferSchemaType } from 'mongoose';
import { USER_ROLES } from '@ai-task/shared';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    role: { type: String, enum: USER_ROLES, default: 'member' },
  },
  { timestamps: true },
);

// Don't return passwordHash when serializing to JSON — defense-in-depth in
// case a query result leaks into a response by mistake.
userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export type UserDoc = InferSchemaType<typeof userSchema>;
export const UserModel = model('User', userSchema);
