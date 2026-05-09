import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useAuthStore, useChatStore } from '../store/useStore';

export function useSocketSync(socket: Socket | null) {
  const user = useAuthStore((s) => s.user);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const { addMessage, upsertChat, markMessagesAsRead, markAsRead } = useChatStore.getState();
  const { updateUserPresence } = useAuthStore.getState();

  useEffect(() => {
    if (!socket || !user) return;

    socket.on('message:created', (payload) => {
      addMessage(payload.message, payload.tempId);
      if (payload.message.chatId === activeChatId && payload.message.senderId !== user.id) {
        void markAsRead(activeChatId as string);
      }
    });

    socket.on('chat:updated', (chat) => upsertChat(chat));
    
    socket.on('chat:read', (payload) => {
      markMessagesAsRead(payload.chatId, payload.userId, payload.readAt);
    });

    socket.on('presence:update', (payload) => {
      updateUserPresence(payload.userId, payload.status);
    });

    return () => {
      socket.off('message:created');
      socket.off('chat:updated');
      socket.off('chat:read');
      socket.off('presence:update');
    };
  }, [socket, user, activeChatId]);
}
