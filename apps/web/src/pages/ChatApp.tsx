import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL } from '../services/api';
import { type Chat, type Message, useAuthStore, useChatStore } from '../store/useStore';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { ChatWindow } from '../components/Chat/ChatWindow';

interface MessageCreatedPayload {
  tempId?: string;
  message: Message;
}

const readJsonStorage = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)) as T;
  } catch {
    return fallback;
  }
};

export default function ChatApp() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const fetchChats = useChatStore((state) => state.fetchChats);
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const upsertChat = useChatStore((state) => state.upsertChat);
  const addMessage = useChatStore((state) => state.addMessage);
  const markAsRead = useChatStore((state) => state.markAsRead);
  const markMessagesAsRead = useChatStore((state) => state.markMessagesAsRead);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user) {
      void fetchChats();
    }
  }, [fetchChats, user]);

  useEffect(() => {
    if (!user || !accessToken) {
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
    });
    socketRef.current = socket;

    socket.on('message:created', (payload: MessageCreatedPayload) => {
      addMessage(payload.message, payload.tempId);
      if (payload.message.senderId === user.id || payload.message.chatId === activeChatId) {
        // Update local read versions
        const current = readJsonStorage<Record<string, string>>('nextgram.readChats', {});
        localStorage.setItem('nextgram.readChats', JSON.stringify({ ...current, [payload.message.chatId]: payload.message.id }));
      }
      if (payload.message.chatId === activeChatId && payload.message.senderId !== user.id) {
        void markAsRead(activeChatId);
      }
    });
    socket.on('chat:updated', (chat: Chat) => {
      upsertChat(chat);
    });
    socket.on('chat:read', (payload: { chatId: string; userId: string; readAt: string }) => {
      markMessagesAsRead(payload.chatId, payload.userId, payload.readAt);
    });
    socket.on('message:error', (payload: { error?: string }) => {
      console.error(payload.error ?? 'Message socket error');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, activeChatId, addMessage, upsertChat, user, markAsRead, markMessagesAsRead]);

  useEffect(() => {
    if (!activeChatId) {
      return;
    }

    void fetchMessages(activeChatId);
    void markAsRead(activeChatId);
    socketRef.current?.emit('chat:join', { chatId: activeChatId });
  }, [activeChatId, fetchMessages, markAsRead]);

  if (!user) {
    return null;
  }

  return (
    <div className="nextgram-bg flex h-screen overflow-hidden text-slate-100">
      <Sidebar />
      <ChatWindow />
    </div>
  );
}
