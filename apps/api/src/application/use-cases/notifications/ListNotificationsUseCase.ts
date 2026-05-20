import type { INotificationRepository } from '../../../domain/repositories/INotificationRepository.js';

export class ListNotificationsUseCase {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(userId: string, unreadOnly = false) {
    const notifs = await this.notifications.listForUser(userId, unreadOnly);
    return notifs.map((n) => n.toJSON());
  }
}
