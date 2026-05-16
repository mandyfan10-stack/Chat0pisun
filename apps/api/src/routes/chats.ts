import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env';
import { getAuthUser, requireAuth } from '../middleware/auth';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import {
  createMessageInChat,
  createOrGetDirectChat,
  createGroupChat,
  listChatsForUser,
  listMessagesForChat,
  markMessagesAsRead,
} from '../services/chats';
import { emitChatRead, emitChatUpdated, emitMessageCreated } from '../socket';

export const chatsRouter = Router();

chatsRouter.use(requireAuth);

const chatCreationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many chats created. Slow down.' } },
  skip: () => env.isTest,
});

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many messages sent. Slow down.' } },
  skip: () => env.isTest,
});

const directChatSchema = z.object({
  targetUserId: z.string().uuid(),
});

const groupChatSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  participantUserIds: z.array(z.string().uuid()).min(1).max(99),
});

const getChatId = (value: string | string[] | undefined): string => {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Chat id is required', 'INVALID_CHAT_ID');
  }
  return value;
};

chatsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const authUser = getAuthUser(req);
    const chats = await listChatsForUser(authUser.id);
    res.json(chats);
  }),
);

chatsRouter.post(
  '/',
  chatCreationLimiter,
  asyncHandler(async (req, res) => {
    const authUser = getAuthUser(req);

    const validated = directChatSchema.safeParse(req.body);
    if (!validated.success) {
      throw new HttpError(400, 'targetUserId must be a valid UUID', 'INVALID_INPUT', validated.error.flatten().fieldErrors);
    }

    const chat = await createOrGetDirectChat(authUser.id, validated.data.targetUserId);
    emitChatUpdated(chat.participants.map((p) => p.userId), chat);

    res.status(201).json(chat);
  }),
);

chatsRouter.post(
  '/group',
  chatCreationLimiter,
  asyncHandler(async (req, res) => {
    const authUser = getAuthUser(req);

    const validated = groupChatSchema.safeParse(req.body);
    if (!validated.success) {
      throw new HttpError(400, 'Invalid group chat data', 'INVALID_INPUT', validated.error.flatten().fieldErrors);
    }

    const { name, participantUserIds } = validated.data;
    const chat = await createGroupChat(authUser.id, name, participantUserIds);
    emitChatUpdated(chat.participants.map((p) => p.userId), chat);

    res.status(201).json(chat);
  }),
);

chatsRouter.get(
  '/:chatId/messages',
  asyncHandler(async (req, res) => {
    const authUser = getAuthUser(req);
    const chatId = getChatId(req.params.chatId);
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const messages = await listMessagesForChat(chatId, authUser.id, {
      cursor,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    res.json(messages);
  }),
);

chatsRouter.post(
  '/:chatId/messages',
  messageLimiter,
  asyncHandler(async (req, res) => {
    const authUser = getAuthUser(req);
    const chatId = getChatId(req.params.chatId);

    if (typeof req.body.text !== 'string') {
      throw new HttpError(400, 'Message text is required', 'INVALID_INPUT');
    }

    const result = await createMessageInChat(chatId, authUser.id, req.body.text);
    emitMessageCreated(chatId, result.message);
    emitChatUpdated(result.participantUserIds, result.chat);

    res.status(201).json(result.message);
  }),
);

chatsRouter.post(
  '/:chatId/read',
  asyncHandler(async (req, res) => {
    const authUser = getAuthUser(req);
    const chatId = getChatId(req.params.chatId);

    const result = await markMessagesAsRead(chatId, authUser.id);
    emitChatRead(chatId, authUser.id, result.participantUserIds, result.readAt);

    res.status(204).send();
  }),
);
