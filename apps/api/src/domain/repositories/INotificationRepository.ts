import type { Notification, NotificationProps } from '../entities/Notification.js';

export interface INotificationRepository {
  create(input: Omit<NotificationProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification>;
  listForUser(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  markRead(id: string, userId: string): Promise<Notification>;
  markAllRead(userId: string): Promise<void>;
}
