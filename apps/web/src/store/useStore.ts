import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  displayName?: string;
  email: string;
}

interface Chat {
  id: string;
  participants: any[];
  messages: any[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null, token?: string | null) => void;
  logout: () => void;
}

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  setChats: (chats: Chat[]) => void;
  setActiveChatId: (id: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user, token) => set({ user, token: token !== undefined ? token : null }),
  logout: () => set({ user: null, token: null }),
}));

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChatId: null,
  setChats: (chats) => set({ chats }),
  setActiveChatId: (id) => set({ activeChatId: id }),
}));
