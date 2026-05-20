import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from '../../config/env.js';
import type { AppContainer } from '../../config/container.js';
import { logger } from '../../infrastructure/logger/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { defaultLimiter } from './middleware/rateLimit.js';
import { activityRouter } from './routes/activity.routes.js';
import { aiRouter } from './routes/ai.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { boardRouter } from './routes/board.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { taskRouter } from './routes/task.routes.js';

// Build the Express app from a container. Exported as a function so tests
// can instantiate a fresh app with mocked dependencies.
export function buildApp(container: AppContainer): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));
  app.use(defaultLimiter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/auth', authRouter(container));
  app.use('/api/boards', boardRouter(container));
  app.use('/api/tasks', taskRouter(container));
  app.use('/api/ai', aiRouter(container));
  app.use('/api/activity', activityRouter(container));
  app.use('/api/notifications', notificationRouter(container));

  // Catch-all 404. Must come AFTER routes; otherwise it would shadow them.
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  app.use(errorHandler);
  return app;
}
