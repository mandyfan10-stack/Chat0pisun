import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { LogOut, Search, Send, User as UserIcon } from 'lucide-react';
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

  const activeOtherParticipant = activeChat ? getOtherParticipant(activeChat, user.id) : null;

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <div className="flex w-80 flex-col border-r bg-white">
        <div className="flex items-center justify-between border-b bg-gray-50 p-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 font-bold text-white">
              {user.username[0]?.toUpperCase()}
            </div>
            <span className="truncate font-semibold text-gray-800">{user.displayName || user.username}</span>
          </div>
          <button onClick={handleLogout} className="text-gray-500 transition hover:text-red-500" aria-label="Logout">
            <LogOut size={20} />
          </button>
        </div>

        <div className="relative border-b p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full rounded bg-gray-100 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="rounded bg-blue-500 p-2 text-white hover:bg-blue-600" aria-label="Search users">
              <Search size={16} />
            </button>
          </form>
          {searchError ? <div className="mt-2 text-xs text-red-600">{searchError}</div> : null}
          {searchResults.length > 0 ? (
            <div className="absolute z-10 mt-2 max-h-56 w-72 overflow-y-auto rounded border bg-white shadow-sm">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  className="flex w-full items-center gap-2 p-2 text-left hover:bg-gray-50"
                  onClick={() => void handleStartChat(result.id)}
                >
                  <UserIcon size={16} className="text-gray-400" />
                  <span className="min-w-0 truncate text-sm">
                    {result.displayName} @{result.username}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingChats ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading chats...</div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No chats yet. Search for a user to start.</div>
          ) : (
            chats.map((chat) => {
              const otherParticipant = getOtherParticipant(chat, user.id);

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full cursor-pointer border-b p-4 text-left transition hover:bg-gray-50 ${
                    activeChatId === chat.id ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="truncate font-medium text-gray-800">
                      {otherParticipant?.user.displayName ?? 'Unknown chat'}
                    </div>
                    <div className="shrink-0 text-xs text-gray-400">{formatTime(chat.updatedAt)}</div>
                  </div>
                  <div className="mt-1 truncate text-xs text-gray-500">{chat.lastMessage?.text ?? 'No messages yet'}</div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-gray-50">
        {activeChat ? (
          <>
            <div className="flex items-center gap-3 border-b bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-600">
                {activeOtherParticipant?.user.username[0]?.toUpperCase() ?? '?'}
              </div>
              <h2 className="text-lg font-semibold">
                {activeOtherParticipant?.user.displayName ?? 'Chat'}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center text-gray-400">Loading messages...</div>
              ) : visibleMessages.length > 0 ? (
                visibleMessages.map((chatMessage) => (
                  <div
                    key={chatMessage.id}
                    className={`mb-4 flex ${chatMessage.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md rounded-lg p-3 ${
                        chatMessage.senderId === user.id ? 'bg-blue-500 text-white' : 'border bg-white text-gray-800'
                      }`}
                    >
                      <div>{chatMessage.text}</div>
                      <div className="mt-1 text-right text-[11px] opacity-70">{formatTime(chatMessage.createdAt)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No messages yet. Send a message to start the conversation.
                </div>
              )}
            </div>

            {chatError ? <div className="border-t bg-red-50 px-4 py-2 text-sm text-red-600">{chatError}</div> : null}

            <div className="border-t bg-white p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 rounded-full bg-gray-100 p-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="flex items-center justify-center rounded-full bg-blue-500 p-3 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-gray-400">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
              <UserIcon size={40} className="text-gray-400" />
            </div>
            <p className="text-lg">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
