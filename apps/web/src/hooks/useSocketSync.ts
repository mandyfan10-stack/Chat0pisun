import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { type Message, useAuthStore, useChatStore } from '../store/useStore';

export function useSocketSync(
  socket: Socket | null,
  activeChatId: string | null,
) {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!socket || !user) return;

    const { addMessage, upsertChat, markMessagesAsRead, markAsRead } = useChatStore.getState();
    const { updateUserPresence } = useAuthStore.getState();

    const handleMessage = (payload: {
      message: Message;
      tempId?: string;
    }) => {
      addMessage(payload.message, payload.tempId);
      if (
        payload.message.chatId === activeChatId &&
        payload.message.senderId !== user.id
      ) {
        void markAsRead(activeChatId as string);
      }
    };

    socket.on('message:created', handleMessage);
    socket.on('chat:updated', (chat) => upsertChat(chat));
    socket.on('chat:read', (payload: { chatId: string; userId: string; readAt: string }) => {
      markMessagesAsRead(payload.chatId, payload.userId, payload.readAt);
    });
    socket.on('presence:update', (payload: { userId: string; status: 'online' | 'offline' }) => {
      updateUserPresence(payload.userId, payload.status);
    });

    return () => {
      socket.off('message:created', handleMessage);
      socket.off('chat:updated');
      socket.off('chat:read');
      socket.off('presence:update');
    };
  }, [socket, user, activeChatId]);
}
