// Minimal DI container. We chose plain factory functions over a heavyweight
// container (tsyringe, inversify) because:
// 1. No reflection metadata / decorators required.
// 2. Easy to override individual deps in tests.
// 3. Explicit wiring is more grep-able for a junior engineer reading the code.
//
// The container is built once at boot; use-cases pull dependencies from it.

import type { IAIProvider } from '../domain/services/IAIProvider.js';
import type { IPasswordHasher } from '../domain/services/IPasswordHasher.js';
import type { IRealtimeGateway } from '../domain/services/IRealtimeGateway.js';
import type { ITokenService } from '../domain/services/ITokenService.js';
import type { IActivityRepository } from '../domain/repositories/IActivityRepository.js';
import type { IBoardRepository } from '../domain/repositories/IBoardRepository.js';
import type { ICommentRepository } from '../domain/repositories/ICommentRepository.js';
import type { INotificationRepository } from '../domain/repositories/INotificationRepository.js';
import type { ITaskRepository } from '../domain/repositories/ITaskRepository.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';

import { createAIProvider } from '../infrastructure/ai/index.js';
import { BcryptPasswordHasher } from '../infrastructure/auth/BcryptPasswordHasher.js';
import { JwtTokenService } from '../infrastructure/auth/JwtTokenService.js';
import { SocketIOGateway } from '../infrastructure/realtime/SocketIOGateway.js';
import { MongoActivityRepository } from '../infrastructure/repositories/MongoActivityRepository.js';
import { MongoBoardRepository } from '../infrastructure/repositories/MongoBoardRepository.js';
import { MongoCommentRepository } from '../infrastructure/repositories/MongoCommentRepository.js';
import { MongoNotificationRepository } from '../infrastructure/repositories/MongoNotificationRepository.js';
import { MongoTaskRepository } from '../infrastructure/repositories/MongoTaskRepository.js';
import { MongoUserRepository } from '../infrastructure/repositories/MongoUserRepository.js';

export interface AppContainer {
  // Repositories
  users: IUserRepository;
  tasks: ITaskRepository;
  boards: IBoardRepository;
  comments: ICommentRepository;
  activity: IActivityRepository;
  notifications: INotificationRepository;
  // Services
  ai: IAIProvider;
  hasher: IPasswordHasher;
  tokens: ITokenService;
  realtime: IRealtimeGateway & { attach: (s: import('http').Server) => void };
}

export function buildContainer(): AppContainer {
  return {
    users: new MongoUserRepository(),
    tasks: new MongoTaskRepository(),
    boards: new MongoBoardRepository(),
    comments: new MongoCommentRepository(),
    activity: new MongoActivityRepository(),
    notifications: new MongoNotificationRepository(),
    ai: createAIProvider(),
    hasher: new BcryptPasswordHasher(),
    tokens: new JwtTokenService(),
    realtime: new SocketIOGateway(),
  };
}
