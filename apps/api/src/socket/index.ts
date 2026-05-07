import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { env } from '../config/env';
import { assertChatParticipant, createMessageInChat } from '../services/chats';
import type { ChatDto, MessageDto } from '../utils/dto';
import { verifyAccessToken } from '../utils/tokens';

type AuthenticatedSocket = Socket & {
  data: {
    user?: {
      id: string;
      username: string;
    };
  };
};

let io: Server | null = null;

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Unexpected socket error';
};

const requireSocketUser = (socket: AuthenticatedSocket) => {
  if (!socket.data.user) {
    throw new Error('Socket is not authenticated');
  }

  return socket.data.user;
};

export const configureSocketServer = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.allowedOrigins,
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (typeof token !== 'string') {
        return next(new Error('Authentication required'));
      }

      const tokenUser = verifyAccessToken(token);

      const user = {
        id: tokenUser.userId,
        username: tokenUser.username,
      };

      socket.data.user = user;
      return next();
    } catch (error) {
      return next(error instanceof Error ? error : new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = requireSocketUser(socket);
    socket.join(`user:${user.id}`);

    socket.on('chat:join', async (payload: { chatId?: string }, ack?: (response: unknown) => void) => {
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
  });

  return io;
};

export const emitMessageCreated = (chatId: string, message: MessageDto, tempId?: string) => {
  io?.to(`chat:${chatId}`).emit('message:created', { tempId, message });
};

export const emitChatUpdated = (participantUserIds: string[], chat: ChatDto) => {
  for (const userId of participantUserIds) {
    io?.to(`user:${userId}`).emit('chat:updated', chat);
  }
};
