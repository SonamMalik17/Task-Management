import type { ActivityLog, ActivityLogProps } from '../entities/ActivityLog.js';

export interface IActivityRepository {
  create(input: Omit<ActivityLogProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivityLog>;
  listByBoard(boardId: string, limit?: number): Promise<ActivityLog[]>;
}
