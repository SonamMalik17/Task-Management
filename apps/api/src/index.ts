import { logger } from './infrastructure/logger/logger.js';
import { startServer } from './interfaces/http/server.js';

// Catch unhandled promise rejections at the process level — the alternative
// is silent failure deep inside an event handler.
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection — exiting');
  process.exit(1);
});

startServer().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
