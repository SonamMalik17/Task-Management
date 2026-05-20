// Lightweight in-memory fakes that implement the domain interfaces. These
// are NOT mocks — they're real implementations, just backed by a Map instead
// of Mongo. Tests use them for fast, deterministic use-case unit tests.

import type {
  ActivityAction,
  ChecklistItem,
  NotificationType,
  TaskPriority,
  TaskStatus,
  UserRole,
} from '@ai-task/shared';
import { ActivityLog } from '../domain/entities/ActivityLog.js';
import { Board } from '../domain/entities/Board.js';
import { Comment } from '../domain/entities/Comment.js';
import { Notification } from '../domain/entities/Notification.js';
import { Task } from '../domain/entities/Task.js';
import { User } from '../domain/entities/User.js';
import { NotFoundError } from '../domain/errors/DomainError.js';
import type { IActivityRepository } from '../domain/repositories/IActivityRepository.js';
import type { IBoardRepository } from '../domain/repositories/IBoardRepository.js';
import type { ICommentRepository } from '../domain/repositories/ICommentRepository.js';
import type { INotificationRepository } from '../domain/repositories/INotificationRepository.js';
import type { ITaskRepository, ListTasksFilter } from '../domain/repositories/ITaskRepository.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { IAIProvider } from '../domain/services/IAIProvider.js';
import type { IPasswordHasher } from '../domain/services/IPasswordHasher.js';
import type { IRealtimeGateway } from '../domain/services/IRealtimeGateway.js';
import type { ITokenService } from '../domain/services/ITokenService.js';
import { MockAIProvider } from '../infrastructure/ai/MockAIProvider.js';

let idSeq = 0;
const fakeId = () => (++idSeq).toString().padStart(24, '0');

export class FakeUserRepository implements IUserRepository {
  private byId = new Map<string, User>();
  async findById(id: string) {
    return this.byId.get(id) ?? null;
  }
  async findByEmail(email: string) {
    for (const u of this.byId.values()) if (u.email === email.toLowerCase()) return u;
    return null;
  }
  async create(input: { email: string; name: string; passwordHash: string }) {
    const id = fakeId();
    const now = new Date();
    const user = new User({
      id,
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash: input.passwordHash,
      avatarUrl: null,
      role: 'member',
      createdAt: now,
      updatedAt: now,
    });
    this.byId.set(id, user);
    return user;
  }
  async update(id: string, patch: Partial<{ name: string; avatarUrl: string | null }>) {
    const u = this.byId.get(id);
    if (!u) throw new NotFoundError('User', id);
    const updated = new User({ ...u.props, ...patch, updatedAt: new Date() });
    this.byId.set(id, updated);
    return updated;
  }
}

export class FakeTaskRepository implements ITaskRepository {
  private byId = new Map<string, Task>();
  async findById(id: string) {
    return this.byId.get(id) ?? null;
  }
  async findByBoard(boardId: string) {
    return [...this.byId.values()].filter((t) => t.props.boardId === boardId);
  }
  async list(filter: ListTasksFilter) {
    return [...this.byId.values()].filter((t) => {
      if (t.props.boardId !== filter.boardId) return false;
      if (filter.status && t.props.status !== filter.status) return false;
      if (filter.assigneeId && !t.props.assigneeIds.includes(filter.assigneeId)) return false;
      if (filter.tag && !t.props.tags.includes(filter.tag)) return false;
      return true;
    });
  }
  async create(input: any) {
    const id = fakeId();
    const now = new Date();
    const task = new Task({ ...input, id, createdAt: now, updatedAt: now });
    this.byId.set(id, task);
    return task;
  }
  async update(id: string, patch: any) {
    const t = this.byId.get(id);
    if (!t) throw new NotFoundError('Task', id);
    const updated = new Task({ ...t.props, ...patch, updatedAt: new Date() });
    this.byId.set(id, updated);
    return updated;
  }
  async delete(id: string) {
    if (!this.byId.delete(id)) throw new NotFoundError('Task', id);
  }
  async nextPositionInStatus(boardId: string, status: TaskStatus) {
    const positions = [...this.byId.values()]
      .filter((t) => t.props.boardId === boardId && t.props.status === status)
      .map((t) => t.props.position);
    return positions.length ? Math.max(...positions) + 1024 : 1024;
  }
}

export class FakeBoardRepository implements IBoardRepository {
  byId = new Map<string, Board>();
  async findById(id: string) {
    return this.byId.get(id) ?? null;
  }
  async findByUser(userId: string) {
    return [...this.byId.values()].filter(
      (b) => b.props.ownerId === userId || b.props.members.some((m) => m.userId === userId),
    );
  }
  async create(input: any) {
    const id = fakeId();
    const now = new Date();
    const board = new Board({ ...input, id, createdAt: now, updatedAt: now });
    this.byId.set(id, board);
    return board;
  }
  async update(id: string, patch: any) {
    const b = this.byId.get(id);
    if (!b) throw new NotFoundError('Board', id);
    const updated = new Board({ ...b.props, ...patch, updatedAt: new Date() });
    this.byId.set(id, updated);
    return updated;
  }
  async delete(id: string) {
    if (!this.byId.delete(id)) throw new NotFoundError('Board', id);
  }
  async addMember(id: string, userId: string, role: UserRole) {
    const b = this.byId.get(id);
    if (!b) throw new NotFoundError('Board', id);
    const filtered = b.props.members.filter((m) => m.userId !== userId);
    const updated = new Board({
      ...b.props,
      members: [...filtered, { userId, role, joinedAt: new Date() }],
      updatedAt: new Date(),
    });
    this.byId.set(id, updated);
    return updated;
  }
  async removeMember(id: string, userId: string) {
    const b = this.byId.get(id);
    if (!b) throw new NotFoundError('Board', id);
    const updated = new Board({
      ...b.props,
      members: b.props.members.filter((m) => m.userId !== userId),
      updatedAt: new Date(),
    });
    this.byId.set(id, updated);
    return updated;
  }
}

export class FakeCommentRepository implements ICommentRepository {
  private byId = new Map<string, Comment>();
  async findByTask(taskId: string) {
    return [...this.byId.values()].filter((c) => c.props.taskId === taskId);
  }
  async create(input: any) {
    const id = fakeId();
    const now = new Date();
    const c = new Comment({ ...input, id, createdAt: now, updatedAt: now });
    this.byId.set(id, c);
    return c;
  }
  async delete(id: string) {
    if (!this.byId.delete(id)) throw new NotFoundError('Comment', id);
  }
}

export class FakeActivityRepository implements IActivityRepository {
  byId = new Map<string, ActivityLog>();
  async create(input: any) {
    const id = fakeId();
    const now = new Date();
    const a = new ActivityLog({ ...input, id, createdAt: now, updatedAt: now });
    this.byId.set(id, a);
    return a;
  }
  async listByBoard(boardId: string, limit = 50) {
    return [...this.byId.values()]
      .filter((a) => a.props.boardId === boardId)
      .sort((a, b) => +b.props.createdAt - +a.props.createdAt)
      .slice(0, limit);
  }
}

export class FakeNotificationRepository implements INotificationRepository {
  byId = new Map<string, Notification>();
  async create(input: any) {
    const id = fakeId();
    const now = new Date();
    const n = new Notification({ ...input, id, createdAt: now, updatedAt: now, readAt: null });
    this.byId.set(id, n);
    return n;
  }
  async listForUser(userId: string, unreadOnly = false) {
    return [...this.byId.values()]
      .filter((n) => n.props.userId === userId)
      .filter((n) => (unreadOnly ? !n.props.readAt : true));
  }
  async markRead(id: string, userId: string) {
    const n = this.byId.get(id);
    if (!n || n.props.userId !== userId) throw new NotFoundError('Notification', id);
    const updated = n.markRead();
    this.byId.set(id, updated);
    return updated;
  }
  async markAllRead(userId: string) {
    for (const [id, n] of this.byId.entries()) {
      if (n.props.userId === userId && !n.props.readAt) {
        this.byId.set(id, n.markRead());
      }
    }
  }
}

export class FakePasswordHasher implements IPasswordHasher {
  async hash(plaintext: string) {
    return `hashed:${plaintext}`;
  }
  async verify(plaintext: string, hash: string) {
    return hash === `hashed:${plaintext}`;
  }
}

export class FakeTokenService implements ITokenService {
  issuePair(payload: { sub: string; email: string }) {
    return {
      accessToken: `access:${payload.sub}:${payload.email}`,
      refreshToken: `refresh:${payload.sub}:${payload.email}`,
    };
  }
  verifyAccess(token: string) {
    const [, sub, email] = token.split(':');
    if (!sub || !email) throw new Error('invalid');
    return { sub, email };
  }
  verifyRefresh(token: string) {
    return this.verifyAccess(token.replace(/^refresh:/, 'access:'));
  }
}

export class FakeRealtime implements IRealtimeGateway {
  emitted: Array<{ scope: string; target: string; event: string; payload: unknown }> = [];
  emitToBoard(boardId: string, event: string, payload: unknown) {
    this.emitted.push({ scope: 'board', target: boardId, event, payload });
  }
  emitToUser(userId: string, event: string, payload: unknown) {
    this.emitted.push({ scope: 'user', target: userId, event, payload });
  }
}

export function makeFakeAI(): IAIProvider {
  return new MockAIProvider();
}

// Helpers exposed for tests
export type { ActivityAction, ChecklistItem, NotificationType, TaskPriority, UserRole };
