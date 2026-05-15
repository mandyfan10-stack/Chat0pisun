import { useEffect, useRef } from 'react';
import { type RefObject } from 'react';
import { Socket } from 'socket.io-client';
import { useAuthStore, useChatStore } from '../store/useStore';

export function useSocketSync(socketRef: RefObject<Socket | null>) {
  const user = useAuthStore((s) => s.user);
  const activeChatId = useChatStore((s) => s.activeChatId);

  const activeChatIdRef = useRef(activeChatId);
  activeChatIdRef.current = activeChatId;

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !user) return;

    const { addMessage, upsertChat, markMessagesAsRead, markAsRead } = useChatStore.getState();
    const { updateUserPresence } = useAuthStore.getState();

    socket.on('message:created', (payload) => {
      addMessage(payload.message, payload.tempId);
      if (
        payload.message.chatId === activeChatIdRef.current &&
        payload.message.senderId !== user.id
      ) {
        void markAsRead(activeChatIdRef.current as string);
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
  }, [socketRef, user]);
}
