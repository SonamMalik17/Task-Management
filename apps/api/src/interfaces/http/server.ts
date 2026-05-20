import http from 'http';
import { env } from '../../config/env.js';
import { buildContainer } from '../../config/container.js';
import { connectMongo } from '../../infrastructure/db/mongoose.js';
import { logger } from '../../infrastructure/logger/logger.js';
import { buildApp } from './app.js';

export async function startServer(): Promise<http.Server> {
  await connectMongo();
  const container = buildContainer();
  const app = buildApp(container);

  const httpServer = http.createServer(app);
  container.realtime.attach(httpServer);

  return new Promise((resolve) => {
    httpServer.listen(env.API_PORT, () => {
      logger.info({ port: env.API_PORT }, 'API listening');
      resolve(httpServer);
    });
  });
}
