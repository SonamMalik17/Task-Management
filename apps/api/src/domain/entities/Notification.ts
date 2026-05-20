import type { NotificationType } from '@ai-task/shared';

export interface NotificationProps {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Notification {
  constructor(public readonly props: NotificationProps) {}
  markRead(at: Date = new Date()): Notification {
    return new Notification({ ...this.props, readAt: at });
  }
  toJSON() {
    return { ...this.props };
  }
}
