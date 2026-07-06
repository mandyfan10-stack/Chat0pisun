import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '../config/env';
import { prisma } from '../config/db';
import { redis } from '../config/redis';
import { markUserOnline, markUserOffline } from '../services/presence';
import { assertChatParticipant, createMessageInChat, markMessagesAsRead } from '../services/chats';
import type { ChatDto, MessageDto } from '../utils/dto';
import { verifyAccessToken } from '../utils/tokens';
import { logger } from '../utils/logger';
import { activeSocketsGauge } from '../utils/metrics';

type AuthenticatedSocket = Socket & {
  data: {
    user?: {
      id: string;
      username: string;
    };
  };
};

let io: Server | null = null;

const USER_CACHE_TTL = 300;

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Unexpected socket error';
};

const requireSocketUser = (socket: AuthenticatedSocket) => {
  if (!socket.data.user) {
    throw new Error('Socket is not authenticated');
  }
  return socket.data.user;
};

// Redis-backed sliding-window rate limiter for socket events.
// Returns true when the limit is exceeded.
const isSocketRateLimited = async (userId: string, event: string, limit: number, windowSec: number): Promise<boolean> => {
  const key = `rl:socket:${userId}:${event}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSec);
  }
  return count > limit;
};

export const configureSocketServer = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.allowedOrigins,
      methods: ['GET', 'POST'],
    },
  });

  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (typeof token !== 'string') {
        return next(new Error('Authentication required'));
      }

      const tokenUser = verifyAccessToken(token);
      const cacheKey = `user:${tokenUser.userId}`;

      const cachedUser = await redis.get(cacheKey);
      if (cachedUser) {
        socket.data.user = JSON.parse(cachedUser);
        return next();
      }

      const user = await prisma.user.findUnique({
        where: { id: tokenUser.userId },
        select: { id: true, username: true },
      });

      if (!user) {
        return next(new Error('Invalid token'));
      }

      await redis.set(cacheKey, JSON.stringify(user), 'EX', USER_CACHE_TTL);

      socket.data.user = user;
      return next();
    } catch (error) {
      return next(error instanceof Error ? error : new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    activeSocketsGauge.inc();
    const user = requireSocketUser(socket);
    socket.join(`user:${user.id}`);

    markUserOnline(user.id).catch((err) => logger.error(err, 'Failed to mark user online'));

    io?.emit('presence:update', { userId: user.id, status: 'online' });

    socket.on('disconnect', async () => {
      activeSocketsGauge.dec();
      const sockets = await io?.in(`user:${user.id}`).fetchSockets();
      if (!sockets || sockets.length === 0) {
        await markUserOffline(user.id);
        io?.emit('presence:update', { userId: user.id, status: 'offline' });

        prisma.user.update({
          where: { id: user.id },
          data: { lastSeen: new Date() },
        }).catch((err) => logger.error(err, 'Failed to update lastSeen in background'));
      }
    });

    socket.on('heartbeat', () => {
      markUserOnline(user.id).catch((err) => logger.error(err, 'Heartbeat failed'));
    });

    socket.on('chat:join', async (payload: { chatId?: string }, ack?: (response: unknown) => void) => {
      try {
        // 20 join attempts per 60 seconds per user
        if (await isSocketRateLimited(user.id, 'chat:join', 20, 60)) {
          socket.emit('message:error', { error: 'Too many join requests. Slow down.' });
          ack?.({ ok: false, error: 'Too many join requests.' });
          return;
        }
      } catch { /* rate limit check non-fatal */ }
      try {
        if (!payload.chatId) {
          throw new Error('chatId is required');
        }
        await assertChatParticipant(payload.chatId, user.id);
        socket.join(`chat:${payload.chatId}`);
        ack?.({ ok: true });
      } catch (error) {
        const message = getErrorMessage(error);
        socket.emit('message:error', { error: message });
        ack?.({ ok: false, error: message });
      }
    });

    socket.on(
      'message:send',
      async (payload: { chatId?: string; text?: string; tempId?: string }) => {
        try {
          if (!payload.chatId || typeof payload.text !== 'string') {
            throw new Error('chatId and text are required');
          }

          // 60 messages per 60 seconds per user — matches REST messageLimiter
          if (await isSocketRateLimited(user.id, 'message:send', 60, 60)) {
            socket.emit('message:error', {
              tempId: payload.tempId,
              error: 'Too many messages. Slow down.',
            });
            return;
          }

          const result = await createMessageInChat(payload.chatId, user.id, payload.text);
          emitMessageCreated(payload.chatId, result.message, payload.tempId);
          emitChatUpdated(result.participantUserIds, result.chat);
        } catch (error) {
          socket.emit('message:error', {
            tempId: payload.tempId,
            error: getErrorMessage(error),
          });
        }
      },
    );

    socket.on('chat:read', async (payload: { chatId?: string }) => {
      try {
        if (!payload.chatId) {
          throw new Error('chatId is required');
        }
        const result = await markMessagesAsRead(payload.chatId, user.id);
        emitChatRead(payload.chatId, user.id, result.participantUserIds, result.readAt);
        emitChatUpdated(result.participantUserIds, result.chat);
      } catch (error) {
        socket.emit('message:error', { error: getErrorMessage(error) });
      }
    });
  });

  return io;
};

export const emitMessageCreated = (chatId: string, message: MessageDto, tempId?: string) => {
  io?.to(`chat:${chatId}`).emit('message:created', { tempId, message });
};

export const emitChatUpdated = (participantUserIds: string[], chat: ChatDto) => {
  if (participantUserIds.length > 0) {
    const rooms = participantUserIds.map((userId) => `user:${userId}`);
    io?.to(rooms).emit('chat:updated', chat);
  }
};

export const emitChatRead = (
  chatId: string,
  userId: string,
  participantUserIds: string[],
  readAt: Date,
) => {
  for (const pUserId of participantUserIds) {
    io?.to(`user:${pUserId}`).emit('chat:read', { chatId, userId, readAt });
  }
};
