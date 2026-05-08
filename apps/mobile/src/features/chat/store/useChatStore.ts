import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import { API_URL } from '../../../config/env';
import { apiRequest } from '../../../shared/api/client';
import { useAuthStore } from '../../auth/store/useAuthStore';
import type { Chat, Message } from '../types';

interface MessageCreatedPayload {
  tempId?: string;
  message: Message;
}

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  socket: Socket | null;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  initSocket: () => void;
  disconnectSocket: () => void;
  joinChat: (chatId: string) => void;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  startChat: (targetUserId: string) => Promise<Chat>;
  createGroupChat: (name: string, participantUserIds: string[]) => Promise<Chat>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  upsertChat: (chat: Chat) => void;
  addMessage: (message: Message, tempId?: string) => void;
  markMessagesAsRead: (chatId: string, userId: string, readAt: string) => void;
  reset: () => void;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  messages: {},
  socket: null,
  isLoadingChats: false,
  isLoadingMessages: false,
  error: null,

  initSocket: () => {
    const token = useAuthStore.getState().accessToken;

    if (!token || get().socket?.connected) {
      return;
    }

    get().disconnectSocket();

    const socket = io(API_URL, {
      auth: { token },
    });

    socket.on('message:created', (payload: MessageCreatedPayload) => {
      get().addMessage(payload.message, payload.tempId);
    });

    socket.on('chat:updated', (chat: Chat) => {
      get().upsertChat(chat);
    });

    socket.on('chat:read', (payload: { chatId: string; userId: string; readAt: string }) => {
      get().markMessagesAsRead(payload.chatId, payload.userId, payload.readAt);
    });

    socket.on('message:error', (payload: { error?: string }) => {
      set({ error: payload.error ?? 'Message failed' });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    socket?.disconnect();
    set({ socket: null });
  },

  joinChat: (chatId) => {
    get().socket?.emit('chat:join', { chatId });
  },

  fetchChats: async () => {
    set({ isLoadingChats: true, error: null });

    try {
      const chats = await apiRequest<Chat[]>('/api/chats');
      set({ chats });
    } catch (error) {
      set({ error: getErrorMessage(error, 'Failed to load chats') });
    } finally {
      set({ isLoadingChats: false });
    }
  },

  fetchMessages: async (chatId) => {
    set({ isLoadingMessages: true, error: null });

    try {
      const messages = await apiRequest<Message[]>(`/api/chats/${chatId}/messages`);
      set((state) => ({ messages: { ...state.messages, [chatId]: messages } }));
    } catch (error) {
      set({ error: getErrorMessage(error, 'Failed to load messages') });
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  startChat: async (targetUserId) => {
    const chat = await apiRequest<Chat>('/api/chats', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
    get().upsertChat(chat);
    return chat;
  },

  createGroupChat: async (name, participantUserIds) => {
    const chat = await apiRequest<Chat>('/api/chats/group', {
      method: 'POST',
      body: JSON.stringify({ name, participantUserIds }),
    });
    get().upsertChat(chat);
    return chat;
  },

  sendMessage: async (chatId, text) => {
    const normalizedText = text.trim();

    if (!normalizedText) {
      return;
    }

    const message = await apiRequest<Message>(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text: normalizedText }),
    });
    get().addMessage(message);
    await get().fetchChats();
  },

  markAsRead: async (chatId) => {
    try {
      await apiRequest(`/api/chats/${chatId}/read`, { method: 'POST' });
      const user = useAuthStore.getState().user;
      if (user) {
        get().markMessagesAsRead(chatId, user.id, new Date().toISOString());
      }
    } catch (error) {
      console.error('Failed to mark chat as read:', error);
    }
  },

  upsertChat: (chat) =>
    set((state) => ({
      chats: [chat, ...state.chats.filter((existing) => existing.id !== chat.id)].sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      ),
    })),

  addMessage: (message, tempId) =>
    set((state) => {
      const chatMessages = state.messages[message.chatId] ?? [];
      const withoutDuplicates = chatMessages.filter(
        (existing) => existing.id !== message.id && existing.id !== tempId,
      );

      return {
        messages: {
          ...state.messages,
          [message.chatId]: [message, ...withoutDuplicates],
        },
      };
    }),

  markMessagesAsRead: (chatId, userId, readAt) =>
    set((state) => {
      const currentMessages = state.messages[chatId];
      if (!currentMessages) {
        return state;
      }

      const updatedMessages = currentMessages.map((msg) => {
        if (msg.senderId !== userId && !msg.readAt) {
          return { ...msg, readAt };
        }
        return msg;
      });

      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages,
        },
      };
    }),

  reset: () => {
    get().disconnectSocket();
    set({ chats: [], messages: {}, error: null, isLoadingChats: false, isLoadingMessages: false });
  },
}));
