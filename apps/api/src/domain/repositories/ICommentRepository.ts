import type { Comment, CommentProps } from '../entities/Comment.js';

export interface ICommentRepository {
  findByTask(taskId: string): Promise<Comment[]>;
  create(input: Omit<CommentProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment>;
  delete(id: string): Promise<void>;
}
