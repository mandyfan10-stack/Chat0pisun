import { useEffect, useState } from 'react';
import { useAuthStore, useChatStore } from '../store/useStore';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { ChatWindow } from '../components/Chat/ChatWindow';
import { useSocket } from '../hooks/useSocket';
import { useSocketSync } from '../hooks/useSocketSync';

type RailView = 'chats' | 'contacts' | 'groups' | 'calls' | 'settings';

export default function ChatApp() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const fetchChats = useChatStore((state) => state.fetchChats);
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const markAsRead = useChatStore((state) => state.markAsRead);
  const setActiveChatId = useChatStore((state) => state.setActiveChatId);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list');
  const [railView, setRailView] = useState<RailView>('chats');

  const socket = useSocket(accessToken);
  useSocketSync(socket, activeChatId);

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
    socket?.emit('chat:join', { chatId: activeChatId });
    // Go to chat pane on mobile when a chat is selected
    setMobilePane('chat');
  }, [activeChatId, fetchMessages, markAsRead, socket]);

  if (!user) {
    return null;
  }

  const appClass = [
    'app',
    detailsOpen && activeChatId ? 'with-details' : '',
    `mobile-${mobilePane}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={appClass}>
      <Sidebar
        railView={railView}
        onRailChange={setRailView}
        onSelectChat={() => setMobilePane('chat')}
        onBack={() => {
          setActiveChatId(null);
          setMobilePane('list');
        }}
      />
      <ChatWindow
        detailsOpen={detailsOpen}
        setDetailsOpen={setDetailsOpen}
        onBack={() => setMobilePane('list')}
      />
    </div>
  );
}
