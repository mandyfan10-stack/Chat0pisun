import type { Chat, ChatParticipant, Message, User } from '@prisma/client';

export interface SafeUserDto {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  lastSeen: Date;
  createdAt: Date;
}

export type PublicUserDto = Omit<SafeUserDto, 'email'>;

export interface ParticipantDto {
  id: string;
  chatId: string;
  userId: string;
  createdAt: Date;
  user: SafeUserDto;
}

export interface MessageDto {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date | null;
  readAt: Date | null;
}

export interface ChatDto {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string | null;
  avatarUrl: string | null;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  participants: ParticipantDto[];
  lastMessage: MessageDto | null;
}

export const safeUserSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  lastSeen: true,
  createdAt: true,
} as const;

type SafeUserLike = Pick<
  User,
  'id' | 'email' | 'username' | 'displayName' | 'avatarUrl' | 'bio' | 'lastSeen' | 'createdAt'
>;

type ParticipantWithUser = ChatParticipant & { user: SafeUserLike };
type ChatWithRelations = Chat & {
  participants: ParticipantWithUser[];
  messages?: Message[];
};

export const toSafeUserDto = (user: SafeUserLike): SafeUserDto => ({
  id: user.id,
  email: user.email,
  username: user.username,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  lastSeen: user.lastSeen,
  createdAt: user.createdAt,
});

export const toPublicUserDto = (user: Omit<SafeUserLike, 'email'>): PublicUserDto => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  lastSeen: user.lastSeen,
  createdAt: user.createdAt,
});

export const toParticipantDto = (participant: ParticipantWithUser): ParticipantDto => ({
  id: participant.id,
  chatId: participant.chatId,
  userId: participant.userId,
  createdAt: participant.createdAt,
  user: toSafeUserDto(participant.user),
});

export const toMessageDto = (message: Message): MessageDto => ({
  id: message.id,
  chatId: message.chatId,
  senderId: message.senderId,
  text: message.text,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
  readAt: message.readAt,
});

export const toChatDto = (chat: ChatWithRelations): ChatDto => ({
  id: chat.id,
  type: chat.type,
  name: chat.name,
  avatarUrl: chat.avatarUrl,
  ownerId: chat.ownerId,
  createdAt: chat.createdAt,
  updatedAt: chat.updatedAt,
  participants: chat.participants.map(toParticipantDto),
  lastMessage: chat.messages?.[0] ? toMessageDto(chat.messages[0]) : null,
});
