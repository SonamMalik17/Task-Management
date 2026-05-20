import type { TaskStatus } from '@ai-task/shared';
import type { Task, TaskProps } from '../entities/Task.js';

export interface ListTasksFilter {
  boardId: string;
  status?: TaskStatus;
  assigneeId?: string;
  tag?: string;
  search?: string;
}

export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findByBoard(boardId: string): Promise<Task[]>;
  list(filter: ListTasksFilter): Promise<Task[]>;
  create(input: Omit<TaskProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  update(id: string, patch: Partial<TaskProps>): Promise<Task>;
  delete(id: string): Promise<void>;
  // Compute the next position at the end of a column. Float-based positions
  // allow inserts between any two without rewriting siblings.
  nextPositionInStatus(boardId: string, status: TaskStatus): Promise<number>;
}
