import type { TaskStatus } from '@ai-task/shared';
import { Task, type TaskProps } from '../../domain/entities/Task.js';
import { NotFoundError } from '../../domain/errors/DomainError.js';
import type {
  ITaskRepository,
  ListTasksFilter,
} from '../../domain/repositories/ITaskRepository.js';
import { TaskModel } from '../db/models/TaskModel.js';

function toEntity(doc: any): Task {
  return new Task({
    id: doc._id.toString(),
    boardId: doc.boardId.toString(),
    title: doc.title,
    description: doc.description ?? '',
    status: doc.status,
    priority: doc.priority,
    position: doc.position,
    assigneeIds: (doc.assigneeIds ?? []).map((a: any) => a.toString()),
    creatorId: doc.creatorId.toString(),
    dueDate: doc.dueDate ?? null,
    tags: doc.tags ?? [],
    checklist: doc.checklist ?? [],
    aiSummary: doc.aiSummary ?? null,
    completedAt: doc.completedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}

export class MongoTaskRepository implements ITaskRepository {
  async findById(id: string): Promise<Task | null> {
    const doc = await TaskModel.findById(id).lean();
    return doc ? toEntity(doc) : null;
  }

  async findByBoard(boardId: string): Promise<Task[]> {
    const docs = await TaskModel.find({ boardId }).sort({ status: 1, position: 1 }).lean();
    return docs.map(toEntity);
  }

  async list(filter: ListTasksFilter): Promise<Task[]> {
    const query: Record<string, unknown> = { boardId: filter.boardId };
    if (filter.status) query.status = filter.status;
    if (filter.assigneeId) query.assigneeIds = filter.assigneeId;
    if (filter.tag) query.tags = filter.tag;
    if (filter.search) {
      // Anchored regex on title would be more selective, but description is
      // worth scanning too. For production scale, swap this for an Atlas
      // Search index — keep the interface stable to avoid downstream changes.
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } },
      ];
    }
    const docs = await TaskModel.find(query).sort({ position: 1 }).lean();
    return docs.map(toEntity);
  }

  async create(input: Omit<TaskProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const doc = await TaskModel.create(input);
    return toEntity(doc.toObject());
  }

  async update(id: string, patch: Partial<TaskProps>): Promise<Task> {
    const doc = await TaskModel.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!doc) throw new NotFoundError('Task', id);
    return toEntity(doc);
  }

  async delete(id: string): Promise<void> {
    const res = await TaskModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundError('Task', id);
  }

  async nextPositionInStatus(boardId: string, status: TaskStatus): Promise<number> {
    const last = await TaskModel.findOne({ boardId, status }).sort({ position: -1 }).lean();
    // Step by 1024 so we can split between siblings ~10 times before needing
    // to re-pack positions.
    return last ? last.position + 1024 : 1024;
  }
}
