import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { chatsRouter } from './routes/chats';
import { usersRouter } from './routes/users';

export const app = express();

app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: env.allowedOrigins }));
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/chats', chatsRouter);

app.use(errorHandler);
