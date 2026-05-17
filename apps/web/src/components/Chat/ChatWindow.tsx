import { useCallback, useEffect, useState } from 'react';
import { useChatStore } from '../../store/useStore';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatDetails } from './ChatDetails';

type ChatFolder = 'personal' | 'work';

const readJsonStorage = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)) as T;
  } catch {
    return fallback;
  }
};

interface ChatWindowProps {
  detailsOpen: boolean;
  setDetailsOpen: (open: boolean) => void;
  onBack?: () => void;
}

export const ChatWindow = ({ detailsOpen, setDetailsOpen, onBack }: ChatWindowProps) => {
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const chatError = useChatStore((state) => state.chatError);

  const [chatFolders, setChatFolders] = useState<Record<string, ChatFolder>>(() =>
    readJsonStorage<Record<string, ChatFolder>>('nextgram.chatFolders', {}),
  );

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;

  useEffect(() => {
    const handleStorageChange = () => {
      setChatFolders(readJsonStorage<Record<string, ChatFolder>>('nextgram.chatFolders', {}));
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const getChatFolder = useCallback(
    (chat: { id: string }) => chatFolders[chat.id] ?? 'personal',
    [chatFolders],
  );

  const handleSetChatFolder = (chatId: string, folder: ChatFolder) => {
    const current = readJsonStorage<Record<string, ChatFolder>>('nextgram.chatFolders', {});
    const next = { ...current, [chatId]: folder };
    localStorage.setItem('nextgram.chatFolders', JSON.stringify(next));
    setChatFolders(next);
  };

  return (
    <section className="chat">
      {activeChat ? (
        <>
          <ChatHeader
            isDetailsOpen={detailsOpen}
            onToggleDetails={() => setDetailsOpen(!detailsOpen)}
            onBack={onBack}
          />

          <MessageList />

          {chatError ? (
            <div
              style={{
                borderTop: '1px solid rgba(255,68,68,0.2)',
                background: 'rgba(255,68,68,0.08)',
                padding: '8px 20px',
                fontSize: 13,
                color: '#ff9090',
              }}
            >
              {chatError}
            </div>
          ) : null}

          <MessageInput />

          {detailsOpen && (
            <ChatDetails
              onClose={() => setDetailsOpen(false)}
              onSetFolder={handleSetChatFolder}
              getChatFolder={getChatFolder}
            />
          )}
        </>
      ) : (
        <div className="empty">
          <div className="empty-mark">◐</div>
          <div className="empty-h">Выберите эфир слева</div>
          <div className="empty-sub">или начните новый ⌘N</div>
        </div>
      )}
    </section>
  );
};
