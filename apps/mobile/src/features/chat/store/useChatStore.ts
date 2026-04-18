import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { API_URL } from '../../../config/env';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  status: 'sending' | 'sent' | 'read' | 'error';
  createdAt: string;
}

interface Chat {
  id: string;
  participants: any[];
  messages: Message[];
  updatedAt: string;
}

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  socket: Socket | null;
  initSocket: () => void;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  messages: {},
  socket: null,

  initSocket: () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token }
    });

    socket.on('connect', () => console.log('Socket connected'));

    socket.on('receive_message', (message: Message) => {
      set((state) => {
        const chatMessages = state.messages[message.chatId] || [];
        return {
          messages: { ...state.messages, [message.chatId]: [message, ...chatMessages] }
        };
      });
    });

    socket.on('message_sent', ({ tempId, message }) => {
      set((state) => {
        const chatMessages = state.messages[message.chatId] || [];
        const updated = chatMessages.map(m => m.id === tempId ? { ...message, status: 'sent' } : m);
        return { messages: { ...state.messages, [message.chatId]: updated } };
      });
    });

    socket.on('message_error', ({ tempId, error }) => {
       console.error("Message send failed:", error);
    });

    set({ socket });
  },

  fetchChats: async () => {
    const token = useAuthStore.getState().token;
    const res = await fetch(`${API_URL}/api/chats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const chats = await res.json();
    set({ chats });
  },

  fetchMessages: async (chatId: string) => {
    const token = useAuthStore.getState().token;
    const res = await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const msgs = await res.json();
    set((state) => ({ messages: { ...state.messages, [chatId]: msgs } }));
  },

  sendMessage: (chatId: string, text: string) => {
    const { socket } = get();
    if (!socket) return;

    const tempId = `temp_${Date.now()}`;
    const user = useAuthStore.getState().user;

    const tempMsg: Message = {
      id: tempId,
      chatId,
      text,
      senderId: user?.id || '',
      status: 'sending',
      createdAt: new Date().toISOString()
    };

    set((state) => ({
      messages: { ...state.messages, [chatId]: [tempMsg, ...(state.messages[chatId] || [])] }
    }));

    socket.emit('send_message', { chatId, text, tempId });
  }
}));
