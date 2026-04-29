import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import {
  Bell,
  CheckCheck,
  Database,
  HelpCircle,
  Info,
  LogOut,
  Menu,
  MessageCircle,
  MoreVertical,
  Moon,
  Paperclip,
  Phone,
  Search,
  Send,
  Settings,
  Shield,
  User as UserIcon,
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

const sidebarItems = [
  { label: 'Notifications', icon: Bell },
  { label: 'Privacy', icon: Shield },
  { label: 'Data and storage', icon: Database },
  { label: 'Appearance', icon: Settings },
  { label: 'Help', icon: HelpCircle },
  { label: 'About', icon: Info },
];

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
  const socketRef = useRef<Socket | null>(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;
  const activeParticipant = activeChat && user ? getOtherParticipant(activeChat, user.id) : undefined;
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
    if (!user || !accessToken) {
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
    });
    socketRef.current = socket;

    socket.on('message:created', (payload: MessageCreatedPayload) => {
      addMessage(payload.message, payload.tempId);
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
  }, [accessToken, addMessage, upsertChat, user]);

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
              className="grid h-10 w-10 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Open menu"
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
          {[
            ['All', chats.length],
            ['New', 0],
            ['Personal', 0],
            ['Work', 0],
          ].map(([label, count], index) => (
            <button
              key={label}
              type="button"
              className={`rounded-full px-3 py-1.5 transition ${
                index === 0 ? 'bg-[#5288c1] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {label}
              {Number(count) > 0 ? <span className="ml-1 opacity-75">{count}</span> : null}
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
          ) : (
            chats.map((chat) => {
              const otherParticipant = getOtherParticipant(chat, user.id);
              const isActive = activeChatId === chat.id;

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => setActiveChatId(chat.id)}
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
                  </span>
                  {chat.lastMessage ? (
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

      <main className={`${activeChat ? 'flex' : 'hidden lg:flex'} min-w-0 flex-1 flex-col bg-[#0b121a]`}>
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
                  className="grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Call"
                >
                  <Phone size={19} />
                </button>
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
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
                <button
                  type="button"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-[#7dd3fc]"
                  aria-label="Attach file"
                >
                  <Paperclip size={20} />
                </button>
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
              <div className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
                    >
                      <Icon size={18} className="text-slate-500" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 border-t border-white/10 pt-4">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
                >
                  <Moon size={18} className="text-slate-500" />
                  Dark mode
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
