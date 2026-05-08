import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { chatsRouter } from './routes/chats';
import { usersRouter } from './routes/users';

export const app = express();

app.set('trust proxy', 1);

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(mongoSanitize());
app.use(cors({ 
  origin: env.allowedOrigins,
  credentials: true 
}));
app.use(express.json({ limit: '10kb' })); // Reduced limit for JSON payloads

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests' } },
  skip: () => env.isTest,
});

app.use('/api', globalLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d',
  immutable: true,
}));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/chats', chatsRouter);

app.use(errorHandler);
