import { useCallback, useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
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

export const ChatWindow = () => {
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const chatError = useChatStore((state) => state.chatError);

  const [chatFolders, setChatFolders] = useState<Record<string, ChatFolder>>(() =>
    readJsonStorage<Record<string, ChatFolder>>('nextgram.chatFolders', {}),
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  const getChatFolder = useCallback((chat: any) => chatFolders[chat.id] ?? 'personal', [chatFolders]);

  const handleSetChatFolder = (chatId: string, folder: ChatFolder) => {
    const current = readJsonStorage<Record<string, ChatFolder>>('nextgram.chatFolders', {});
    const next = { ...current, [chatId]: folder };
    localStorage.setItem('nextgram.chatFolders', JSON.stringify(next));
    setChatFolders(next);
  };

  return (
    <main className={`${activeChat ? 'flex' : 'hidden lg:flex'} relative min-w-0 flex-1 flex-col bg-[#0b121a]`}>
      {activeChat ? (
        <>
          <ChatHeader 
            isDetailsOpen={isDetailsOpen} 
            onToggleDetails={() => setIsDetailsOpen((curr) => !curr)} 
          />
          
          <MessageList />

          {chatError ? (
            <div className="border-t border-red-400/20 bg-red-500/10 px-5 py-2 text-sm text-red-200">{chatError}</div>
          ) : null}

          <MessageInput />

          {isDetailsOpen && (
            <ChatDetails 
              onClose={() => setIsDetailsOpen(false)}
              onSetFolder={handleSetChatFolder}
              getChatFolder={getChatFolder}
            />
          )}
        </>
      ) : (
        <div className="flex flex-1">
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div>
              <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full bg-[#5288c1]/20 text-[#7dd3fc]">
                <MessageCircle size={44} />
              </div>
              <h2 className="text-2xl font-semibold text-white">Welcome to Nextgram</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">
                Select a chat or find a user to begin a private conversation.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
