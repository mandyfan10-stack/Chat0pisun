import { createServer } from 'http';
import { app } from './app';
import { env } from './config/env';
import { configureSocketServer } from './socket';
import { prisma } from './config/db';
import { logger } from './utils/logger';

const httpServer = createServer(app);

configureSocketServer(httpServer);

const server = httpServer.listen(env.port, () => {
  logger.info(`Server is running on port ${env.port}`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database connection closed.');
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
