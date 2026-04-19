import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore, useChatStore } from '../store/useStore';
import { api, SOCKET_URL } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { LogOut, Send, Search, User as UserIcon } from 'lucide-react';

export default function ChatApp() {
  const { user, logout, token } = useAuthStore();
  const { chats, setChats, activeChatId, setActiveChatId } = useChatStore();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchChats = async () => {
      try {
        const res = await api.get('/chats');
        setChats(res.data);
      } catch (err) {
        console.error('Failed to fetch chats', err);
      }
    };
    fetchChats();

    const socket = io(SOCKET_URL, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('new_message', (_msg) => {
      // Very basic optimistic update for MVP
      fetchChats();
    });

    return () => {
      socket.disconnect();
    };
  }, [user, navigate, token, setChats]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const res = await api.get(`/users/search?q=${searchQuery}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const startChat = async (userId: string) => {
    try {
      const res = await api.post('/chats', { targetUserId: userId });
      setChats([...chats, res.data]);
      setActiveChatId(res.data.id);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !activeChatId) return;
    // For MVP, we might mock sending since the backend API for sending isn't explicitly defined in index.ts
    // Let's just log it or emit if socket was fully set up on backend for receiving
    console.log('Sending message:', message);
    if (socketRef.current) {
        socketRef.current.emit('send_message', { chatId: activeChatId, content: message });
    }
    setMessage('');
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="font-semibold text-gray-800">{user?.displayName || user?.username}</span>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition">
            <LogOut size={20} />
          </button>
        </div>

        <div className="p-4 border-b">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full bg-gray-100 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
              <Search size={16} />
            </button>
          </form>
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white border rounded shadow-sm max-h-40 overflow-y-auto absolute z-10 w-72">
              {searchResults.map(u => (
                <div
                  key={u.id}
                  className="p-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                  onClick={() => startChat(u.id)}
                >
                  <UserIcon size={16} className="text-gray-400" />
                  <span className="text-sm">{u.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No chats yet. Search for a user to start!</div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${activeChatId === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
              >
                <div className="font-medium text-gray-800">
                  {chat.participants.find((p: any) => p.userId !== 'current')?.user?.username || 'Unknown Chat'}
                </div>
                <div className="text-xs text-gray-500 truncate mt-1">
                  Click to view messages
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {activeChat ? (
          <>
            <div className="p-4 bg-white border-b shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                 {activeChat.participants.find((p: any) => p.userId !== 'current')?.user?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <h2 className="font-semibold text-lg">
                {activeChat.participants.find((p: any) => p.userId !== 'current')?.user?.username || 'Chat'}
              </h2>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {activeChat.messages && activeChat.messages.length > 0 ? (
                activeChat.messages.map((m: any, idx: number) => (
                  <div key={idx} className={`mb-4 flex ${m.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-lg max-w-md ${m.senderId === user?.id ? 'bg-blue-500 text-white' : 'bg-white border text-gray-800'}`}>
                      {m.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No messages yet. Send a message to start the conversation!
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-100 p-3 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col text-gray-400">
            <div className="w-20 h-20 mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <UserIcon size={40} className="text-gray-400" />
            </div>
            <p className="text-lg">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
