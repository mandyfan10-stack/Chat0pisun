import { useEffect, type RefObject } from 'react';
import { Socket } from 'socket.io-client';
import { useAuthStore, useChatStore } from '../store/useStore';

export function useSocketSync(
  socketRef: RefObject<Socket | null>,
  activeChatId: string | null,
) {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !user) return;

    const { addMessage, upsertChat, markMessagesAsRead, markAsRead } = useChatStore.getState();
    const { updateUserPresence } = useAuthStore.getState();

    const handleMessage = (payload: {
      message: { chatId: string; senderId: string; id: string };
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
    socket.on('presence:update', (payload: { userId: string; status: string }) => {
      updateUserPresence(payload.userId, payload.status);
    });

    return () => {
      socket.off('message:created', handleMessage);
      socket.off('chat:updated');
      socket.off('chat:read');
      socket.off('presence:update');
    };
  }, [socketRef, user, activeChatId]);
}
