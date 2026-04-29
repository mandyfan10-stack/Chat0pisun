import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import {
  CheckCheck,
  LogOut,
  Menu,
  MessageCircle,
  MoreVertical,
  Search,
  Send,
  User as UserIcon,
  X,
} from 'lucide-react';
import { api, SOCKET_URL } from '../services/api';
import { type Chat, type Message, type Participant, type User, useAuthStore, useChatStore } from '../store/useStore';

interface MessageCreatedPayload {
  tempId?: string;
  message: Message;
}

const getOtherParticipant = (chat: Chat, currentUserId: string): Participant | undefined => {
  return chat.participants.find((participant) => participant.userId !== currentUserId) ?? chat.participants[0];
};

const formatTime = (value?: string) => {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const getInitials = (name?: string) => {
  const safeName = name?.trim() || 'User';

  return safeName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

const Avatar = ({ user, size = 'md' }: { user?: User; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClass = size === 'lg' ? 'h-14 w-14 text-lg' : size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm';
  const name = user?.displayName || user?.username || 'User';

  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt="" className={`${sizeClass} rounded-full object-cover`} />;
  }

  return (
    <div
      className={`${sizeClass} grid shrink-0 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-[#7dd3fc] to-[#5288c1] font-semibold text-white shadow-lg shadow-black/20`}
    >
      {getInitials(name)}
    </div>
  );
};

type ChatFilter = 'all' | 'new' | 'personal' | 'work';
type ChatFolder = 'personal' | 'work';

const chatFilterLabels: Record<ChatFilter, string> = {
  all: 'All',
  new: 'New',
  personal: 'Personal',
  work: 'Work',
};

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
  const logout = useAuthStore((state) => state.logout);
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const messages = useChatStore((state) => state.messages);
  const isLoadingChats = useChatStore((state) => state.isLoadingChats);
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);
  const chatError = useChatStore((state) => state.chatError);
  const setActiveChatId = useChatStore((state) => state.setActiveChatId);
  const fetchChats = useChatStore((state) => state.fetchChats);
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const startChat = useChatStore((state) => state.startChat);
  const sendChatMessage = useChatStore((state) => state.sendMessage);
  const upsertChat = useChatStore((state) => state.upsertChat);
  const addMessage = useChatStore((state) => state.addMessage);
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [chatFolders, setChatFolders] = useState<Record<string, ChatFolder>>(() =>
    readJsonStorage<Record<string, ChatFolder>>('nextgram.chatFolders', {}),
  );
  const [readChatVersions, setReadChatVersions] = useState<Record<string, string>>(() =>
    readJsonStorage<Record<string, string>>('nextgram.readChats', {}),
  );
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;
  const activeParticipant = activeChat && user ? getOtherParticipant(activeChat, user.id) : undefined;
  const getChatFolder = useCallback((chat: Chat) => chatFolders[chat.id] ?? 'personal', [chatFolders]);
  const isChatUnread = useCallback(
    (chat: Chat) => Boolean(user && chat.lastMessage && chat.lastMessage.senderId !== user.id && readChatVersions[chat.id] !== getChatVersion(chat)),
    [readChatVersions, user],
  );
  const markChatAsRead = useCallback((chat: Chat) => {
    setReadChatVersions((current) => ({ ...current, [chat.id]: getChatVersion(chat) }));
  }, []);
  const visibleMessages = useMemo(
    () => (activeChatId ? [...(messages[activeChatId] ?? [])].reverse() : []),
    [activeChatId, messages],
  );
  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      if (activeFilter === 'new') {
        return isChatUnread(chat);
      }

      if (activeFilter === 'personal') {
        return getChatFolder(chat) === 'personal';
      }

      if (activeFilter === 'work') {
        return getChatFolder(chat) === 'work';
      }

      return true;
    });
  }, [activeFilter, chats, getChatFolder, isChatUnread]);
  const chatTabs = useMemo(
    () =>
      (Object.keys(chatFilterLabels) as ChatFilter[]).map((filter) => ({
        filter,
        label: chatFilterLabels[filter],
        count:
          filter === 'all'
            ? chats.length
            : chats.filter((chat) => {
                if (filter === 'new') {
                  return isChatUnread(chat);
                }

                return getChatFolder(chat) === filter;
              }).length,
      })),
    [chats, getChatFolder, isChatUnread],
  );

  useEffect(() => {
    if (user) {
      void fetchChats();
    }
  }, [fetchChats, user]);

  useEffect(() => {
    localStorage.setItem('nextgram.chatFolders', JSON.stringify(chatFolders));
  }, [chatFolders]);

  useEffect(() => {
    localStorage.setItem('nextgram.readChats', JSON.stringify(readChatVersions));
  }, [readChatVersions]);

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
        setReadChatVersions((current) => ({ ...current, [payload.message.chatId]: payload.message.id }));
      }
    });
    socket.on('chat:updated', (chat: Chat) => {
      upsertChat(chat);
    });
    socket.on('message:error', (payload: { error?: string }) => {
      console.error(payload.error ?? 'Message socket error');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, activeChatId, addMessage, upsertChat, user]);

  useEffect(() => {
    if (!activeChatId) {
      return;
    }

    void fetchMessages(activeChatId);
    socketRef.current?.emit('chat:join', { chatId: activeChatId });
  }, [activeChatId, fetchMessages]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedQuery = searchQuery.trim();

    if (normalizedQuery.length < 2) {
      setSearchResults([]);
      setSearchError('Enter at least 2 characters');
      return;
    }

    try {
      const response = await api.get<User[]>('/users/search', {
        params: { q: normalizedQuery },
      });
      setSearchResults(response.data);
      setSearchError(null);
    } catch {
      setSearchError('Search failed');
    }
  };

  const handleStartChat = async (targetUserId: string) => {
    const chat = await startChat(targetUserId);
    setSearchQuery('');
    setSearchResults([]);
    setActiveChatId(chat.id);
    markChatAsRead(chat);
  };

  const handleSelectChat = (chat: Chat) => {
    setActiveChatId(chat.id);
    markChatAsRead(chat);
  };

  const handleSetChatFolder = (chatId: string, folder: ChatFolder) => {
    setChatFolders((current) => ({ ...current, [chatId]: folder }));
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="nextgram-bg flex h-screen overflow-hidden text-slate-100">
      <aside
        className={`${
          activeChat ? 'hidden lg:flex' : 'flex'
        } w-full shrink-0 flex-col border-r border-white/10 bg-[#101a25]/95 lg:w-[380px]`}
      >
        <div className="relative border-b border-white/10 px-5 pb-4 pt-5">
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((current) => !current)}
              className="grid h-10 w-10 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-expanded={isProfileMenuOpen}
              aria-label="Open profile menu"
            >
              <Menu size={21} />
            </button>
            <div className="flex items-center gap-2">
              <MessageCircle size={20} className="text-[#7dd3fc]" />
              <span className="text-sm font-semibold tracking-[0.12em] text-white">NEXTGRAM</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-red-500/10 hover:text-red-200"
              aria-label="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <Avatar user={user} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{user.displayName || user.username}</div>
              <div className="truncate text-xs text-slate-400">@{user.username}</div>
            </div>
          </div>

          {isProfileMenuOpen ? (
            <div className="mb-4 rounded-2xl border border-white/10 bg-[#121b28] p-3 shadow-xl shadow-black/20">
              <div className="mb-3 text-xs text-slate-400">{user.email}</div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-200 transition hover:bg-red-500/10"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : null}

          <form onSubmit={handleSearch} className="relative">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search users"
              className="h-11 w-full rounded-2xl border border-white/10 bg-[#0e141b] pl-10 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#5b9be7] focus:ring-4 focus:ring-[#5b9be7]/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search users"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-[#5288c1] text-white transition hover:bg-[#6aa8ef]"
              aria-label="Search"
            >
              <Search size={15} />
            </button>
          </form>

          {searchError ? <div className="mt-2 text-xs text-red-300">{searchError}</div> : null}
          {searchResults.length > 0 ? (
            <div className="absolute z-20 mt-2 max-h-64 w-[calc(100%-2.5rem)] overflow-y-auto rounded-2xl border border-white/10 bg-[#121b28] p-2 shadow-2xl shadow-black/40">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-white/5"
                  onClick={() => void handleStartChat(result.id)}
                >
                  <Avatar user={result} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">{result.displayName}</span>
                    <span className="block truncate text-xs text-slate-400">@{result.username}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3 text-xs">
          {chatTabs.map(({ filter, label, count }) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-3 py-1.5 transition ${
                activeFilter === filter ? 'bg-[#5288c1] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              aria-pressed={activeFilter === filter}
            >
              {label}
              {count > 0 ? <span className="ml-1 opacity-75">{count}</span> : null}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {isLoadingChats ? (
            <div className="grid h-40 place-items-center text-sm text-slate-500">Loading chats...</div>
          ) : chats.length === 0 ? (
            <div className="m-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#5288c1]/20 text-[#7dd3fc]">
                <UserIcon size={26} />
              </div>
              <div className="text-sm font-medium text-white">No chats yet</div>
              <div className="mt-1 text-xs leading-5 text-slate-400">Search for a user to start a conversation.</div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="m-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
              <div className="text-sm font-medium text-white">No {chatFilterLabels[activeFilter].toLowerCase()} chats</div>
              <div className="mt-1 text-xs leading-5 text-slate-400">
                {activeFilter === 'work'
                  ? 'Open a chat and move it to Work from the chat details panel.'
                  : activeFilter === 'new'
                    ? 'Unread incoming messages will appear here.'
                    : 'Try another folder or start a new chat.'}
              </div>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const otherParticipant = getOtherParticipant(chat, user.id);
              const isActive = activeChatId === chat.id;
              const isUnread = isChatUnread(chat);

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => handleSelectChat(chat)}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                    isActive ? 'bg-[#182331]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <Avatar user={otherParticipant?.user} size="lg" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-white">
                        {otherParticipant?.user.displayName ?? 'Unknown chat'}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-500">{formatTime(chat.updatedAt)}</span>
                    </span>
                    <span className="mt-1 block truncate text-sm text-slate-400">
                      {chat.lastMessage?.text ?? 'No messages yet'}
                    </span>
                    <span className="mt-2 inline-flex rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {getChatFolder(chat)}
                    </span>
                  </span>
                  {isUnread ? (
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#5288c1] text-[11px] font-semibold text-white">
                      1
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </aside>

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
                  <Menu size={21} />
                </button>
                <Avatar user={activeParticipant?.user} />
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-white">
                    {activeParticipant?.user.displayName ?? 'Chat'}
                  </h2>
                  <p className="truncate text-xs text-slate-400">online recently</p>
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
                          <div className="whitespace-pre-wrap break-words text-sm leading-6">{chatMessage.text}</div>
                          <div className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${isMine ? 'text-blue-100' : 'text-slate-500'}`}>
                            <span>{formatTime(chatMessage.createdAt)}</span>
                            {isMine ? <CheckCheck size={13} /> : null}
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

            <aside className="hidden w-[300px] shrink-0 border-l border-white/10 bg-[#101a25]/95 p-5 xl:block">
              <div className="mb-6 flex items-center gap-3">
                <Avatar user={user} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{user.displayName || user.username}</div>
                  <div className="truncate text-xs text-slate-400">{user.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {chatTabs.map((tab) => (
                  <div key={tab.filter} className="rounded-2xl border border-white/10 bg-[#121b28] p-3">
                    <div className="text-2xl font-semibold text-white">{tab.count}</div>
                    <div className="mt-1 text-xs text-slate-400">{tab.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
                >
                  <LogOut size={18} className="text-red-300" />
                  Logout
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
