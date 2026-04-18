import { Chat, Message, User } from '../types';

const CURRENT_USER_ID = 'u1';

const mockUsers: Record<string, User> = {
  u1: { id: 'u1', name: 'John Doe' }, // Current User
  u2: { id: 'u2', name: 'Alice Smith', isOnline: true },
  u3: { id: 'u3', name: 'Bob Johnson', isOnline: false },
};

let mockChats: Chat[] = [
  {
    id: 'c1',
    participants: [mockUsers.u1, mockUsers.u2],
    unreadCount: 2,
    updatedAt: Date.now() - 1000 * 60 * 5,
    lastMessage: {
      id: 'm1',
      chatId: 'c1',
      senderId: 'u2',
      text: 'Hey! How are you doing today?',
      createdAt: Date.now() - 1000 * 60 * 5,
      status: 'read',
    },
  },
  {
    id: 'c2',
    participants: [mockUsers.u1, mockUsers.u3],
    unreadCount: 0,
    updatedAt: Date.now() - 1000 * 60 * 60 * 2,
    lastMessage: {
      id: 'm2',
      chatId: 'c2',
      senderId: 'u1',
      text: 'Sounds like a plan. See you tomorrow!',
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      status: 'read',
    },
  },
];

let mockMessages: Record<string, Message[]> = {
  c1: [
    {
      id: 'm1',
      chatId: 'c1',
      senderId: 'u2',
      text: 'Hey! How are you doing today?',
      createdAt: Date.now() - 1000 * 60 * 5,
      status: 'read',
    },
  ],
  c2: [
    {
      id: 'm2',
      chatId: 'c2',
      senderId: 'u1',
      text: 'Sounds like a plan. See you tomorrow!',
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      status: 'read',
    },
  ],
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const ChatService = {
  getCurrentUserId: () => CURRENT_USER_ID,

  fetchChats: async (): Promise<Chat[]> => {
    await delay(500); // Simulate network latency
    return [...mockChats].sort((a, b) => b.updatedAt - a.updatedAt);
  },

  fetchMessages: async (chatId: string): Promise<Message[]> => {
    await delay(300); // Simulate network latency
    return mockMessages[chatId] || [];
  },

  sendMessage: async (message: Omit<Message, 'status'>): Promise<Message> => {
    await delay(800); // Simulate network latency for sending
    const sentMessage: Message = { ...message, status: 'sent' };

    if (!mockMessages[message.chatId]) {
      mockMessages[message.chatId] = [];
    }

    // In a real app, backend would prepend/append. We just push to array
    mockMessages[message.chatId].unshift(sentMessage);

    // Update chat last message
    const chatIndex = mockChats.findIndex(c => c.id === message.chatId);
    if (chatIndex >= 0) {
      mockChats[chatIndex].lastMessage = sentMessage;
      mockChats[chatIndex].updatedAt = sentMessage.createdAt;
    }

    return sentMessage;
  },

  // Simulate receiving a message from someone else
  simulateReceiveMessage: (chatId: string, senderId: string, callback: (msg: Message) => void) => {
    setTimeout(() => {
      const newMsg: Message = {
        id: `m_${Date.now()}`,
        chatId,
        senderId,
        text: 'This is an auto-reply simulating a real-time socket message!',
        createdAt: Date.now(),
        status: 'sent',
      };

      if (!mockMessages[chatId]) {
        mockMessages[chatId] = [];
      }
      mockMessages[chatId].unshift(newMsg);
      callback(newMsg);
    }, 2000); // Receive reply 2 seconds after sending
  },
};
