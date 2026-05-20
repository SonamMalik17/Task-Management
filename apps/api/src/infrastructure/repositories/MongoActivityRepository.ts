import { ActivityLog, type ActivityLogProps } from '../../domain/entities/ActivityLog.js';
import type { IActivityRepository } from '../../domain/repositories/IActivityRepository.js';
import { ActivityModel } from '../db/models/ActivityModel.js';

function toEntity(doc: any): ActivityLog {
  return new ActivityLog({
    id: doc._id.toString(),
    boardId: doc.boardId.toString(),
    actorId: doc.actorId.toString(),
    action: doc.action,
    metadata: doc.metadata ?? {},
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}

export class MongoActivityRepository implements IActivityRepository {
  async create(
    input: Omit<ActivityLogProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ActivityLog> {
    const doc = await ActivityModel.create(input);
    return toEntity(doc.toObject());
  }

  async listByBoard(boardId: string, limit = 50): Promise<ActivityLog[]> {
    const docs = await ActivityModel.find({ boardId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return docs.map(toEntity);
  }
}
