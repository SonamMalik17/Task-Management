import { Notification, type NotificationProps } from '../../domain/entities/Notification.js';
import { NotFoundError } from '../../domain/errors/DomainError.js';
import type { INotificationRepository } from '../../domain/repositories/INotificationRepository.js';
import { NotificationModel } from '../db/models/NotificationModel.js';

function toEntity(doc: any): Notification {
  return new Notification({
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    title: doc.title,
    body: doc.body,
    link: doc.link ?? null,
    readAt: doc.readAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}

export class MongoNotificationRepository implements INotificationRepository {
  async create(
    input: Omit<NotificationProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Notification> {
    const doc = await NotificationModel.create(input);
    return toEntity(doc.toObject());
  }

  async listForUser(userId: string, unreadOnly = false): Promise<Notification[]> {
    const query: Record<string, unknown> = { userId };
    if (unreadOnly) query.readAt = null;
    const docs = await NotificationModel.find(query).sort({ createdAt: -1 }).limit(100).lean();
    return docs.map(toEntity);
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    // userId scope prevents one user marking another user's notifications read.
    const doc = await NotificationModel.findOneAndUpdate(
      { _id: id, userId },
      { readAt: new Date() },
      { new: true },
    ).lean();
    if (!doc) throw new NotFoundError('Notification', id);
    return toEntity(doc);
  }

  async markAllRead(userId: string): Promise<void> {
    await NotificationModel.updateMany({ userId, readAt: null }, { readAt: new Date() });
  }
}
