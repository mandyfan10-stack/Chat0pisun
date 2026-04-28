import { createServer } from 'http';
import { app } from './app';
import { env } from './config/env';
import { configureSocketServer } from './socket';

const httpServer = createServer(app);

configureSocketServer(httpServer);

httpServer.listen(env.port, () => {
  console.log(`Server is running on port ${env.port}`);
});
