import type { ActivityAction } from '@ai-task/shared';

export interface ActivityLogProps {
  id: string;
  boardId: string;
  actorId: string;
  action: ActivityAction;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class ActivityLog {
  constructor(public readonly props: ActivityLogProps) {}
  toJSON() {
    return { ...this.props };
  }
}
