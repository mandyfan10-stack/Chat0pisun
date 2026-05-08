import { create } from 'zustand';
import { api, clearStoredTokens, getStoredTokens, setAuthFailureHandler, setStoredTokens } from '../services/api';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  lastSeen: string;
  createdAt: string;
}

export interface Participant {
  id: string;
  chatId: string;
  userId: string;
  createdAt: string;
  user: User;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
  updatedAt: string | null;
  readAt: string | null;
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

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrating: boolean;
  isSubmitting: boolean;
  authError: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: { displayName?: string; bio?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  clearSession: () => void;
}

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  messages: Record<string, Message[]>;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  chatError: string | null;
  setActiveChatId: (id: string | null) => void;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  startChat: (targetUserId: string) => Promise<Chat>;
  createGroupChat: (name: string, participantUserIds: string[]) => Promise<Chat>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  upsertChat: (chat: Chat) => void;
  addMessage: (message: Message, tempId?: string) => void;
  markMessagesAsRead: (chatId: string, userId: string, readAt: string) => void;
  resetChats: () => void;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface RegisterInput {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: { message?: string } } } }).response;
    return response?.data?.error?.message ?? fallback;
  }

  return fallback;
};

const setSession = (set: (state: Partial<AuthState>) => void, session: AuthResponse) => {
  setStoredTokens(session.accessToken, session.refreshToken);
  set({
    user: session.user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    authError: null,
  });
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isHydrating: true,
  isSubmitting: false,
  authError: null,

  hydrate: async () => {
    const tokens = getStoredTokens();

    if (!tokens.accessToken || !tokens.refreshToken) {
      set({ isHydrating: false });
      return;
    }

    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isHydrating: true,
    });

    try {
      const response = await api.get<{ user: User }>('/auth/me');
      const nextTokens = getStoredTokens();
      set({
        user: response.data.user,
        accessToken: nextTokens.accessToken,
        refreshToken: nextTokens.refreshToken,
        isHydrating: false,
        authError: null,
      });
    } catch (error) {
      clearStoredTokens();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isHydrating: false,
        authError: getErrorMessage(error, 'Session expired'),
      });
    }
  },

  login: async (email, password) => {
    set({ isSubmitting: true, authError: null });

    try {
      const response = await api.post<AuthResponse>('/auth/login', { email, password });
      setSession(set, response.data);
    } catch (error) {
      set({ authError: getErrorMessage(error, 'Login failed') });
      throw error;
    } finally {
      set({ isSubmitting: false, isHydrating: false });
    }
  },

  register: async (input) => {
    set({ isSubmitting: true, authError: null });

    try {
      const response = await api.post<AuthResponse>('/auth/register', input);
      setSession(set, response.data);
    } catch (error) {
      set({ authError: getErrorMessage(error, 'Registration failed') });
      throw error;
    } finally {
      set({ isSubmitting: false, isHydrating: false });
    }
  },

  logout: async () => {
    const { refreshToken } = getStoredTokens();

    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } finally {
      clearStoredTokens();
      useChatStore.getState().resetChats();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isHydrating: false,
        authError: null,
      });
    }
  },

  updateProfile: async (input) => {
    set({ isSubmitting: true, authError: null });

    try {
      const response = await api.patch<{ user: User }>('/users/me', input);
      set({ user: response.data.user });
    } catch (error) {
      set({ authError: getErrorMessage(error, 'Update failed') });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  uploadAvatar: async (file) => {
    set({ isSubmitting: true, authError: null });

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post<{ user: User }>('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      set({ user: response.data.user });
    } catch (error) {
      set({ authError: getErrorMessage(error, 'Avatar upload failed') });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  clearSession: () => {
    clearStoredTokens();
    useChatStore.getState().resetChats();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isHydrating: false,
    });
  },
}));

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  messages: {},
  isLoadingChats: false,
  isLoadingMessages: false,
  chatError: null,

  setActiveChatId: (id) => set({ activeChatId: id }),

  fetchChats: async () => {
    set({ isLoadingChats: true, chatError: null });

    try {
      const response = await api.get<Chat[]>('/chats');
      set({ chats: response.data });
    } catch (error) {
      set({ chatError: getErrorMessage(error, 'Failed to load chats') });
    } finally {
      set({ isLoadingChats: false });
    }
  },

  fetchMessages: async (chatId) => {
    set({ isLoadingMessages: true, chatError: null });

    try {
      const response = await api.get<Message[]>(`/chats/${chatId}/messages`);
      set((state) => ({ messages: { ...state.messages, [chatId]: response.data } }));
    } catch (error) {
      set({ chatError: getErrorMessage(error, 'Failed to load messages') });
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  startChat: async (targetUserId) => {
    const response = await api.post<Chat>('/chats', { targetUserId });
    get().upsertChat(response.data);
    set({ activeChatId: response.data.id });
    return response.data;
  },

  createGroupChat: async (name, participantUserIds) => {
    const response = await api.post<Chat>('/chats/group', { name, participantUserIds });
    get().upsertChat(response.data);
    set({ activeChatId: response.data.id });
    return response.data;
  },

  sendMessage: async (chatId, text) => {
    const normalizedText = text.trim();

    if (!normalizedText) {
      return;
    }

    const response = await api.post<Message>(`/chats/${chatId}/messages`, { text: normalizedText });
    get().addMessage(response.data);
    await get().fetchChats();
  },

  markAsRead: async (chatId) => {
    try {
      await api.post(`/chats/${chatId}/read`);
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
      const currentMessages = state.messages[message.chatId] ?? [];
      const withoutDuplicates = currentMessages.filter(
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

  resetChats: () => set({ chats: [], activeChatId: null, messages: {}, chatError: null }),
}));

setAuthFailureHandler(() => {
  useAuthStore.getState().clearSession();
});
