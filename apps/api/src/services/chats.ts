import type { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { HttpError } from '../middleware/errorHandler';
import { toChatDto, toMessageDto } from '../utils/dto';

const chatInclude = {
  participants: {
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
  messages: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
  },
} satisfies Prisma.ChatInclude;

export const listChatsForUser = async (userId: string) => {
  const chats = await prisma.chat.findMany({
    where: {
      participants: {
        some: { userId },
      },
    },
    include: chatInclude,
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return chats.map(toChatDto);
};

export const createOrGetDirectChat = async (currentUserId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) {
    throw new HttpError(400, 'Cannot create a chat with yourself', 'INVALID_TARGET_USER');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });

  if (!targetUser) {
    throw new HttpError(404, 'Target user not found', 'USER_NOT_FOUND');
  }

  const existingChats = await prisma.chat.findMany({
    where: {
      type: 'DIRECT',
      AND: [
        { participants: { some: { userId: currentUserId } } },
        { participants: { some: { userId: targetUserId } } },
        {
          participants: {
            every: {
              userId: { in: [currentUserId, targetUserId] },
            },
          },
        },
      ],
    },
    include: chatInclude,
  });

  const existingDirectChat = existingChats.find((chat) => chat.participants.length === 2);

  if (existingDirectChat) {
    return toChatDto(existingDirectChat);
  }

  const chat = await prisma.chat.create({
    data: {
      type: 'DIRECT',
      participants: {
        create: [{ userId: currentUserId }, { userId: targetUserId }],
      },
    },
    include: chatInclude,
  });

  return toChatDto(chat);
};

export const createGroupChat = async (ownerId: string, name: string, participantUserIds: string[]) => {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new HttpError(400, 'Group name is required', 'INVALID_INPUT');
  }

  // Ensure owner is included in participants
  const uniqueParticipantIds = Array.from(new Set([ownerId, ...participantUserIds]));

  const chat = await prisma.chat.create({
    data: {
      type: 'GROUP',
      name: normalizedName,
      ownerId,
      participants: {
        create: uniqueParticipantIds.map((userId) => ({ userId })),
      },
    },
    include: chatInclude,
  });

  return toChatDto(chat);
};

export const getParticipantUserIds = async (chatId: string): Promise<string[]> => {
  const participants = await prisma.chatParticipant.findMany({
    where: { chatId },
    select: { userId: true },
  });

  if (participants.length === 0) {
    throw new HttpError(404, 'Chat not found', 'CHAT_NOT_FOUND');
  }

  return participants.map((participant) => participant.userId);
};

export const assertChatParticipant = async (chatId: string, userId: string) => {
  const participant = await prisma.chatParticipant.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
  });

  if (!participant) {
    const chatExists = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true },
    });

    if (!chatExists) {
      throw new HttpError(404, 'Chat not found', 'CHAT_NOT_FOUND');
    }

    throw new HttpError(403, 'You are not a participant in this chat', 'CHAT_FORBIDDEN');
  }

  return participant;
};

export const listMessagesForChat = async (
  chatId: string,
  userId: string,
  options: { cursor?: string; limit?: number } = {},
) => {
  await assertChatParticipant(chatId, userId);

  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(options.cursor
      ? {
          cursor: { id: options.cursor },
          skip: 1,
        }
      : {}),
  });

  return messages.map(toMessageDto);
};

export const createMessageInChat = async (chatId: string, senderId: string, text: string) => {
  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new HttpError(400, 'Message text is required', 'INVALID_MESSAGE');
  }

  if (normalizedText.length > 2000) {
    throw new HttpError(400, 'Message text is too long', 'INVALID_MESSAGE');
  }

  await assertChatParticipant(chatId, senderId);

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        chatId,
        senderId,
        text: normalizedText,
      },
    }),
    prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    }),
  ]);

  const [participantUserIds, chat] = await Promise.all([
    getParticipantUserIds(chatId),
    prisma.chat.findUniqueOrThrow({
      where: { id: chatId },
      include: chatInclude,
    }),
  ]);

  return {
    message: toMessageDto(message),
    chat: toChatDto(chat),
    participantUserIds,
  };
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
  await assertChatParticipant(chatId, userId);

  const now = new Date();

  await prisma.message.updateMany({
    where: {
      chatId,
      senderId: { not: userId },
      readAt: null,
    },
    data: {
      readAt: now,
    },
  });

  const [participantUserIds, chat] = await Promise.all([
    getParticipantUserIds(chatId),
    prisma.chat.findUniqueOrThrow({
      where: { id: chatId },
      include: chatInclude,
    }),
  ]);

  return {
    chat: toChatDto(chat),
    participantUserIds,
    readAt: now,
  };
};
