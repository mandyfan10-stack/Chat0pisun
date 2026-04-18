import { create } from 'zustand';
import { Chat, Message } from '../types';
import { ChatService } from '../services/api';

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>; // Keyed by chatId
  isLoadingChats: boolean;
  isLoadingMessages: Record<string, boolean>;

  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  receiveMessage: (message: Message) => void;
  markChatAsRead: (chatId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  messages: {},
  isLoadingChats: false,
  isLoadingMessages: {},

  fetchChats: async () => {
    set({ isLoadingChats: true });
    try {
      const chats = await ChatService.fetchChats();
      set({ chats, isLoadingChats: false });
    } catch (error) {
      console.error('Failed to fetch chats', error);
      set({ isLoadingChats: false });
    }
  },

  fetchMessages: async (chatId: string) => {
    set((state) => ({
      isLoadingMessages: { ...state.isLoadingMessages, [chatId]: true },
    }));
    try {
      const msgs = await ChatService.fetchMessages(chatId);
      set((state) => ({
        messages: { ...state.messages, [chatId]: msgs },
        isLoadingMessages: { ...state.isLoadingMessages, [chatId]: false },
      }));
    } catch (error) {
      console.error('Failed to fetch messages', error);
      set((state) => ({
        isLoadingMessages: { ...state.isLoadingMessages, [chatId]: false },
      }));
    }
  },

  sendMessage: async (chatId: string, text: string) => {
    const tempId = `temp_${Date.now()}`;
    const currentUserId = ChatService.getCurrentUserId();
    const tempMessage: Message = {
      id: tempId,
      chatId,
      senderId: currentUserId,
      text,
      createdAt: Date.now(),
      status: 'sending',
    };

    // Optimistic Update
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      const updatedChats = state.chats.map((c) =>
        c.id === chatId ? { ...c, lastMessage: tempMessage, updatedAt: tempMessage.createdAt } : c
      ).sort((a, b) => b.updatedAt - a.updatedAt);

      return {
        messages: { ...state.messages, [chatId]: [tempMessage, ...chatMessages] },
        chats: updatedChats,
      };
    });

    try {
      // Real API Call
      const sentMessage = await ChatService.sendMessage(tempMessage);

      // Update state with confirmed message
      set((state) => {
        const chatMessages = state.messages[chatId] || [];
        const updatedMessages = chatMessages.map((msg) =>
          msg.id === tempId ? sentMessage : msg
        );

        // Find other participant to simulate a reply
        const chat = state.chats.find(c => c.id === chatId);
        const otherParticipant = chat?.participants.find(p => p.id !== currentUserId);

        if (otherParticipant) {
           ChatService.simulateReceiveMessage(chatId, otherParticipant.id, (replyMsg) => {
               get().receiveMessage(replyMsg);
           });
        }

        return {
          messages: { ...state.messages, [chatId]: updatedMessages },
        };
      });
    } catch (error) {
      // Handle Failure: Update status to error
      set((state) => {
        const chatMessages = state.messages[chatId] || [];
        const updatedMessages = chatMessages.map((msg) =>
          msg.id === tempId ? { ...msg, status: 'error' } as Message : msg
        );
        return {
          messages: { ...state.messages, [chatId]: updatedMessages },
        };
      });
    }
  },

  receiveMessage: (message: Message) => {
    set((state) => {
      const chatMessages = state.messages[message.chatId] || [];
      const updatedChats = state.chats.map((c) =>
        c.id === message.chatId
          ? {
              ...c,
              lastMessage: message,
              updatedAt: message.createdAt,
              unreadCount: c.unreadCount + 1,
            }
          : c
      ).sort((a, b) => b.updatedAt - a.updatedAt);

      return {
        messages: { ...state.messages, [message.chatId]: [message, ...chatMessages] },
        chats: updatedChats,
      };
    });
  },

  markChatAsRead: (chatId: string) => {
      set((state) => ({
          chats: state.chats.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c)
      }));
  }
}));
