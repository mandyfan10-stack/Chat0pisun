import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  CheckCheck,
  MessageCircle,
  MoreVertical,
  Send,
  X,
} from 'lucide-react';
import { api, SOCKET_URL } from '../services/api';
import { type Chat, type Message, useAuthStore, useChatStore } from '../store/useStore';
import { LinkifiedText } from '../components/LinkifiedText';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { Avatar } from '../components/Sidebar/Avatar';
import { formatTime, getOtherParticipant } from '../components/Sidebar/utils';

interface MessageCreatedPayload {
  tempId?: string;
  message: Message;
}

type ChatFolder = 'personal' | 'work';

const getChatVersion = (chat: Chat) => chat.lastMessage?.id ?? chat.updatedAt;

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
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const messages = useChatStore((state) => state.messages);
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);
  const chatError = useChatStore((state) => state.chatError);
  const setActiveChatId = useChatStore((state) => state.setActiveChatId);
  const fetchChats = useChatStore((state) => state.fetchChats);
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const sendChatMessage = useChatStore((state) => state.sendMessage);
  const upsertChat = useChatStore((state) => state.upsertChat);
  const addMessage = useChatStore((state) => state.addMessage);
  const markAsRead = useChatStore((state) => state.markAsRead);
  const markMessagesAsRead = useChatStore((state) => state.markMessagesAsRead);

  const [message, setMessage] = useState('');
  const [chatFolders, setChatFolders] = useState<Record<string, ChatFolder>>(() =>
    readJsonStorage<Record<string, ChatFolder>>('nextgram.chatFolders', {}),
  );
  const [readChatVersions, setReadChatVersions] = useState<Record<string, string>>(() =>
    readJsonStorage<Record<string, string>>('nextgram.readChats', {}),
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;
  const activeParticipant = activeChat && user ? getOtherParticipant(activeChat, user.id) : undefined;
  const getChatFolder = useCallback((chat: Chat) => chatFolders[chat.id] ?? 'personal', [chatFolders]);

  const visibleMessages = useMemo(
    () => (activeChatId ? [...(messages[activeChatId] ?? [])].reverse() : []),
    [activeChatId, messages],
  );

  useEffect(() => {
    if (user) {
      void fetchChats();
    }
  }, [fetchChats, user]);

  useEffect(() => {
    const handleStorageChange = () => {
      setChatFolders(readJsonStorage<Record<string, ChatFolder>>('nextgram.chatFolders', {}));
      setReadChatVersions(readJsonStorage<Record<string, string>>('nextgram.readChats', {}));
    };

    window.addEventListener('storage', handleStorageChange);
    // Also poll for changes because same-tab localStorage changes don't fire 'storage' event
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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

  const handleSetChatFolder = (chatId: string, folder: ChatFolder) => {
    const current = readJsonStorage<Record<string, ChatFolder>>('nextgram.chatFolders', {});
    const next = { ...current, [chatId]: folder };
    localStorage.setItem('nextgram.chatFolders', JSON.stringify(next));
    setChatFolders(next);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !activeChatId) {
      return;
    }

    const text = message;
    setMessage('');
    await sendChatMessage(activeChatId, text);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="nextgram-bg flex h-screen overflow-hidden text-slate-100">
      <Sidebar />

      <main className={`${activeChat ? 'flex' : 'hidden lg:flex'} relative min-w-0 flex-1 flex-col bg-[#0b121a]`}>
        {activeChat ? (
          <>
            <header className="flex h-[76px] items-center justify-between border-b border-white/10 bg-[#101a25]/95 px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 lg:hidden"
                  onClick={() => setActiveChatId(null)}
                  aria-label="Back to chats"
                >
                  <X size={21} />
                </button>
                <Avatar user={activeChat.type === 'DIRECT' ? activeParticipant?.user : undefined} chat={activeChat} />
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-white">
                    {activeChat.type === 'GROUP' ? activeChat.name : (activeParticipant?.user.displayName ?? 'Chat')}
                  </h2>
                  <p className="truncate text-xs text-slate-400">
                    {activeChat.type === 'GROUP' 
                      ? `${activeChat.participants.length} members` 
                      : 'online recently'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsDetailsOpen((current) => !current)}
                  className="grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-expanded={isDetailsOpen}
                  aria-label="Chat options"
                >
                  <MoreVertical size={20} />
                </button>
              </div>
            </header>

            <section className="nextgram-pattern flex-1 overflow-y-auto px-4 py-6 sm:px-8">
              {isLoadingMessages ? (
                <div className="grid h-full place-items-center text-sm text-slate-500">Loading messages...</div>
              ) : visibleMessages.length > 0 ? (
                <div className="mx-auto flex max-w-4xl flex-col gap-3">
                  <div className="mx-auto mb-3 rounded-full bg-[#182331]/90 px-3 py-1 text-xs text-slate-400">Today</div>
                  {visibleMessages.map((chatMessage) => {
                    const isMine = chatMessage.senderId === user.id;

                    return (
                      <div key={chatMessage.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[78%] rounded-[22px] px-4 py-2.5 shadow-lg shadow-black/10 ${
                            isMine
                              ? 'rounded-br-md bg-[#5288c1] text-white'
                              : 'rounded-bl-md border border-white/5 bg-[#182331] text-slate-100'
                          }`}
                        >
                          <LinkifiedText text={chatMessage.text} isMine={isMine} />
                          <div className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${isMine ? 'text-blue-100' : 'text-slate-500'}`}>
                            <span>{formatTime(chatMessage.createdAt)}</span>
                            {isMine ? (
                              <CheckCheck size={13} className={chatMessage.readAt ? 'text-blue-300' : ''} />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid h-full place-items-center">
                  <div className="max-w-xs text-center">
                    <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-[#5288c1]/20 text-[#7dd3fc]">
                      <MessageCircle size={38} />
                    </div>
                    <p className="text-lg font-semibold text-white">Start the conversation</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Send a message and it will be saved to the database.</p>
                  </div>
                </div>
              )}
            </section>

            {chatError ? (
              <div className="border-t border-red-400/20 bg-red-500/10 px-5 py-2 text-sm text-red-200">{chatError}</div>
            ) : null}

            <footer className="border-t border-white/10 bg-[#101a25]/95 px-4 py-3 sm:px-6">
              <form onSubmit={handleSendMessage} className="mx-auto flex max-w-4xl items-end gap-2">
                <input
                  type="text"
                  placeholder="Message"
                  className="min-h-11 flex-1 rounded-2xl border border-white/10 bg-[#0e141b] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#5b9be7] focus:ring-4 focus:ring-[#5b9be7]/10"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  aria-label="Message"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#5288c1] text-white shadow-lg shadow-[#5288c1]/20 transition hover:bg-[#6aa8ef] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send message"
                >
                  <Send size={19} />
                </button>
              </form>
            </footer>

            {isDetailsOpen ? (
              <aside className="absolute right-0 top-0 z-30 flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-[#101a25] p-5 shadow-2xl shadow-black/40 sm:w-[340px]">
                <div className="mb-6 flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">Chat details</div>
                  <button
                    type="button"
                    onClick={() => setIsDetailsOpen(false)}
                    className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label="Close chat details"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mb-6 flex flex-col items-center text-center">
                  <Avatar user={activeParticipant?.user} size="lg" />
                  <div className="mt-3 text-lg font-semibold text-white">
                    {activeParticipant?.user.displayName ?? 'Chat'}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">@{activeParticipant?.user.username ?? 'user'}</div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#121b28] p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Folder</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['personal', 'work'] as ChatFolder[]).map((folder) => (
                      <button
                        key={folder}
                        type="button"
                        onClick={() => handleSetChatFolder(activeChat.id, folder)}
                        className={`rounded-2xl px-3 py-2 text-sm font-semibold capitalize transition ${
                          getChatFolder(activeChat) === folder
                            ? 'bg-[#5288c1] text-white'
                            : 'border border-white/10 text-slate-300 hover:bg-white/5'
                        }`}
                        aria-pressed={getChatFolder(activeChat) === folder}
                      >
                        {folder}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            ) : null}
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
    </div>
  );
}
