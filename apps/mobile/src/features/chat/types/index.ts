export type MessageStatus = 'sending' | 'sent' | 'read' | 'error';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  lastSeen: string;
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
  updatedAt: string | null;
  readAt: string | null;
  status?: MessageStatus;
}

export interface Participant {
  id: string;
  chatId: string;
  userId: string;
  createdAt: string;
  user: User;
}

export interface Chat {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string | null;
  avatarUrl: string | null;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  lastMessage: Message | null;
}
