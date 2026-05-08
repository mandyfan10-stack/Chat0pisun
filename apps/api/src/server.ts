import { createServer } from 'http';
import { app } from './app';
import { env } from './config/env';
import { configureSocketServer } from './socket';
import { prisma } from './config/db';

const httpServer = createServer(app);

configureSocketServer(httpServer);

const server = httpServer.listen(env.port, () => {
  console.log(`Server is running on port ${env.port}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
