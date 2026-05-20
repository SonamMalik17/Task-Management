import type { UserRole } from '@ai-task/shared';
import { Board, type BoardProps } from '../../domain/entities/Board.js';
import { NotFoundError } from '../../domain/errors/DomainError.js';
import type { IBoardRepository } from '../../domain/repositories/IBoardRepository.js';
import { BoardModel } from '../db/models/BoardModel.js';

function toEntity(doc: any): Board {
  return new Board({
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? '',
    ownerId: doc.ownerId.toString(),
    members: (doc.members ?? []).map((m: any) => ({
      userId: m.userId.toString(),
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    color: doc.color,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}

export class MongoBoardRepository implements IBoardRepository {
  async findById(id: string): Promise<Board | null> {
    const doc = await BoardModel.findById(id).lean();
    return doc ? toEntity(doc) : null;
  }

  async findByUser(userId: string): Promise<Board[]> {
    // A user sees boards they own OR are members of.
    const docs = await BoardModel.find({
      $or: [{ ownerId: userId }, { 'members.userId': userId }],
    })
      .sort({ updatedAt: -1 })
      .lean();
    return docs.map(toEntity);
  }

  async create(input: Omit<BoardProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<Board> {
    const doc = await BoardModel.create(input);
    return toEntity(doc.toObject());
  }

  async update(id: string, patch: Partial<BoardProps>): Promise<Board> {
    const doc = await BoardModel.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!doc) throw new NotFoundError('Board', id);
    return toEntity(doc);
  }

  async delete(id: string): Promise<void> {
    const res = await BoardModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundError('Board', id);
  }

  async addMember(boardId: string, userId: string, role: UserRole): Promise<Board> {
    const doc = await BoardModel.findByIdAndUpdate(
      boardId,
      // $addToSet would be wrong here — same userId with a different role
      // should overwrite, not duplicate. Pull first, then push.
      { $pull: { members: { userId } } },
      { new: false },
    );
    if (!doc) throw new NotFoundError('Board', boardId);
    const updated = await BoardModel.findByIdAndUpdate(
      boardId,
      { $push: { members: { userId, role, joinedAt: new Date() } } },
      { new: true },
    ).lean();
    if (!updated) throw new NotFoundError('Board', boardId);
    return toEntity(updated);
  }

  async removeMember(boardId: string, userId: string): Promise<Board> {
    const doc = await BoardModel.findByIdAndUpdate(
      boardId,
      { $pull: { members: { userId } } },
      { new: true },
    ).lean();
    if (!doc) throw new NotFoundError('Board', boardId);
    return toEntity(doc);
  }
}
