import type { UserRole } from '@ai-task/shared';
import type { Board, BoardProps } from '../entities/Board.js';

export interface IBoardRepository {
  findById(id: string): Promise<Board | null>;
  findByUser(userId: string): Promise<Board[]>;
  create(input: Omit<BoardProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<Board>;
  update(id: string, patch: Partial<BoardProps>): Promise<Board>;
  delete(id: string): Promise<void>;
  addMember(boardId: string, userId: string, role: UserRole): Promise<Board>;
  removeMember(boardId: string, userId: string): Promise<Board>;
}
