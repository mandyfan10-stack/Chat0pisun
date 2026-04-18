export type MessageStatus = 'sending' | 'sent' | 'read' | 'error';

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: number;
  status: MessageStatus;
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: number;
}
