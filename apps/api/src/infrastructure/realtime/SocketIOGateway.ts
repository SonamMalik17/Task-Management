import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { env } from '../../config/env.js';
import type { IRealtimeGateway } from '../../domain/services/IRealtimeGateway.js';
import { JwtTokenService } from '../auth/JwtTokenService.js';
import { logger } from '../logger/logger.js';

// Socket.IO gateway. Rooms keyed by `board:{id}` for board-scoped events and
// `user:{id}` for direct notifications. Authentication piggybacks on the JWT
// access token sent in `auth.token` during the handshake.
export class SocketIOGateway implements IRealtimeGateway {
  private io: Server | null = null;
  private tokens = new JwtTokenService();

  attach(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: { origin: env.CORS_ORIGIN, credentials: true },
    });

    this.io.use((socket, next) => {
      const token = (socket.handshake.auth as { token?: string }).token;
      if (!token) return next(new Error('Missing auth token'));
      try {
        const payload = this.tokens.verifyAccess(token);
        (socket as Socket & { userId: string }).userId = payload.sub;
        socket.join(`user:${payload.sub}`);
        next();
      } catch (err) {
        next(err as Error);
      }
    });

    this.io.on('connection', (socket) => {
      const userId = (socket as Socket & { userId: string }).userId;
      logger.debug({ userId, socketId: socket.id }, 'socket connected');

      socket.on('board:join', (boardId: string) => {
        socket.join(`board:${boardId}`);
      });
      socket.on('board:leave', (boardId: string) => {
        socket.leave(`board:${boardId}`);
      });
    });
  }

  emitToBoard(boardId: string, event: string, payload: unknown): void {
    this.io?.to(`board:${boardId}`).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.io?.to(`user:${userId}`).emit(event, payload);
  }
}
