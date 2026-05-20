import { Comment, type CommentProps } from '../../domain/entities/Comment.js';
import { NotFoundError } from '../../domain/errors/DomainError.js';
import type { ICommentRepository } from '../../domain/repositories/ICommentRepository.js';
import { CommentModel } from '../db/models/CommentModel.js';

function toEntity(doc: any): Comment {
  return new Comment({
    id: doc._id.toString(),
    taskId: doc.taskId.toString(),
    authorId: doc.authorId.toString(),
    body: doc.body,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}

export class MongoCommentRepository implements ICommentRepository {
  async findByTask(taskId: string): Promise<Comment[]> {
    const docs = await CommentModel.find({ taskId }).sort({ createdAt: 1 }).lean();
    return docs.map(toEntity);
  }

  async create(input: Omit<CommentProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    const doc = await CommentModel.create(input);
    return toEntity(doc.toObject());
  }

  async delete(id: string): Promise<void> {
    const res = await CommentModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundError('Comment', id);
  }
}
