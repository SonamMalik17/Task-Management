import type { INotificationRepository } from '../../../domain/repositories/INotificationRepository.js';

export class MarkNotificationReadUseCase {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(userId: string, id: string) {
    const notif = await this.notifications.markRead(id, userId);
    return notif.toJSON();
  }

  async executeAll(userId: string) {
    await this.notifications.markAllRead(userId);
  }
}
