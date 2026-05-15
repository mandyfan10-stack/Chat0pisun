import { useEffect } from 'react';
import { useAuthStore, useChatStore } from '../store/useStore';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { ChatWindow } from '../components/Chat/ChatWindow';
import { useSocket } from '../hooks/useSocket';
import { useSocketSync } from '../hooks/useSocketSync';

export default function ChatApp() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const fetchChats = useChatStore((state) => state.fetchChats);
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const markAsRead = useChatStore((state) => state.markAsRead);

  const socketRef = useSocket(accessToken);
  useSocketSync(socketRef);

  useEffect(() => {
    if (user) {
      void fetchChats();
    }
  }, [fetchChats, user]);

  useEffect(() => {
    if (!activeChatId) {
      return;
    }

    void fetchMessages(activeChatId);
    void markAsRead(activeChatId);
    socketRef.current?.emit('chat:join', { chatId: activeChatId });
  }, [activeChatId, fetchMessages, markAsRead, socketRef]);

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
