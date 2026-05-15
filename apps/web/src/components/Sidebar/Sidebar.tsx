import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCheck,
  Search,
  User as UserIcon,
  Users,
  X,
  LogOut,
} from 'lucide-react';
import { api } from '../../services/api';
import { type Chat, type User, useAuthStore, useChatStore } from '../../store/useStore';
import { Avatar } from './Avatar';
import { SidebarHeader } from './SidebarHeader';
import { ChatTabs, type ChatFilter } from './ChatTabs';
import { ChatList } from './ChatList';

type ChatFolder = 'personal' | 'work';

const readJsonStorage = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)) as T;
  } catch {
    return fallback;
  }
};

const getChatVersion = (chat: Chat) => chat.lastMessage?.id ?? chat.updatedAt;

export const Sidebar = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const setActiveChatId = useChatStore((state) => state.setActiveChatId);
  const startChat = useChatStore((state) => state.startChat);
  const createGroupChat = useChatStore((state) => state.createGroupChat);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const uploadAvatar = useAuthStore((state) => state.uploadAvatar);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const authError = useAuthStore((state) => state.authError);

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
    const [chatFolders, _setChatFolders] = useState<Record<string, ChatFolder>>(() =>
    readJsonStorage<Record<string, ChatFolder>>('nextgram.chatFolders', {}),
  );
  const [readChatVersions, setReadChatVersions] = useState<Record<string, string>>(() =>
    readJsonStorage<Record<string, string>>('nextgram.readChats', {}),
  );
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName ?? '');
  const [editBio, setEditBio] = useState(user?.bio ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('nextgram.chatFolders', JSON.stringify(chatFolders));
  }, [chatFolders]);

  useEffect(() => {
    localStorage.setItem('nextgram.readChats', JSON.stringify(readChatVersions));
  }, [readChatVersions]);

  const getChatFolder = useCallback((chat: Chat) => chatFolders[chat.id] ?? 'personal', [chatFolders]);
  const isChatUnread = useCallback(
    (chat: Chat) => Boolean(user && chat.lastMessage && chat.lastMessage.senderId !== user.id && readChatVersions[chat.id] !== getChatVersion(chat)),
    [readChatVersions, user],
  );

  const markChatAsRead = useCallback((chat: Chat) => {
    setReadChatVersions((current) => ({ ...current, [chat.id]: getChatVersion(chat) }));
  }, []);

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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ displayName: editDisplayName, bio: editBio });
      setIsEditingProfile(false);
    } catch {
      // Error handled by store
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await uploadAvatar(file);
      } catch {
        // Error handled by store
      }
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUserIds.length === 0) return;

    try {
      await createGroupChat(groupName, selectedUserIds);
      setIsCreatingGroup(false);
      setGroupName('');
      setSelectedUserIds([]);
    } catch {
      // Error handled by store
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  };

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

  if (!user) return null;

  return (
    <aside
      className={`${
        activeChatId ? 'hidden lg:flex' : 'flex'
      } w-full shrink-0 flex-col border-r border-white/10 bg-[#101a25]/95 lg:w-[380px]`}
    >
      <div className="relative border-b border-white/10 px-5 pb-4 pt-5">
        <SidebarHeader
          onMenuClick={() => {
            setIsProfileMenuOpen((current) => !current);
            setIsEditingProfile(false);
          }}
          onLogout={handleLogout}
          isProfileMenuOpen={isProfileMenuOpen}
        />

        {!isEditingProfile ? (
          <div className="mb-4 flex items-center gap-3">
            <button type="button" onClick={handleAvatarClick} className="relative group overflow-hidden rounded-full">
              <Avatar user={user} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <UserIcon size={16} className="text-white" />
              </div>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{user.displayName || user.username}</div>
              <div className="truncate text-xs text-slate-400">@{user.username}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCreatingGroup((curr) => !curr);
                setIsProfileMenuOpen(false);
              }}
              className={`grid h-8 w-8 place-items-center rounded-full transition ${
                isCreatingGroup ? 'bg-[#5288c1] text-white' : 'bg-[#5288c1]/20 text-[#7dd3fc] hover:bg-[#5288c1]/40'
              }`}
              aria-label="Create group"
            >
              <Users size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} className="mb-4 space-y-3">
            <div>
              <label htmlFor="displayName" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Display Name</label>
              <input
                id="displayName"
                type="text"
                className="w-full h-10 rounded-xl border border-white/10 bg-[#0e141b] px-3 text-sm text-white outline-none focus:border-[#5288c1]"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="bio" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Bio</label>
              <textarea
                id="bio"
                className="w-full h-20 rounded-xl border border-white/10 bg-[#0e141b] p-3 text-sm text-white outline-none focus:border-[#5288c1] resize-none"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-10 rounded-xl bg-[#5288c1] text-sm font-semibold text-white hover:bg-[#6aa8ef] transition disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 h-10 rounded-xl border border-white/10 text-sm font-semibold text-white hover:bg-white/5 transition"
              >
                Cancel
              </button>
            </div>
            {authError && <div className="text-xs text-red-400">{authError}</div>}
          </form>
        )}

        {isCreatingGroup && !isEditingProfile && (
          <div className="mb-4 space-y-3 rounded-2xl border border-white/10 bg-[#121b28] p-3 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">New Group</span>
              <button type="button" onClick={() => {
                setIsCreatingGroup(false);
                setSelectedUserIds([]);
                setGroupName('');
              }}>
                <X size={14} className="text-slate-500" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Group Name"
              className="h-10 w-full rounded-xl border border-white/10 bg-[#0e141b] px-3 text-sm text-white outline-none focus:border-[#5288c1]"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Selected Participants: {selectedUserIds.length}
            </div>
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedUserIds.length === 0}
              className="h-10 w-full rounded-xl bg-[#5288c1] text-sm font-semibold text-white hover:bg-[#6aa8ef] transition disabled:opacity-50"
            >
              Create Group
            </button>
          </div>
        )}

        {isProfileMenuOpen && !isEditingProfile ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-[#121b28] p-3 shadow-xl shadow-black/20">
            <div className="mb-3 px-3 text-xs text-slate-400">{user.email}</div>
            <button
              type="button"
              onClick={() => {
                setIsEditingProfile(true);
                setIsProfileMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-200 transition hover:bg-white/5"
            >
              <UserIcon size={16} />
              Edit Profile
            </button>
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
            placeholder={isCreatingGroup ? "Search participants" : "Search users"}
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
            {searchResults.map((result) => {
              const isSelected = selectedUserIds.includes(result.id);
              return (
                <button
                  key={result.id}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                    isSelected ? 'bg-[#5288c1]/20' : 'hover:bg-white/5'
                  }`}
                  onClick={() => isCreatingGroup ? toggleUserSelection(result.id) : void handleStartChat(result.id)}
                >
                  <Avatar user={result} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">{result.displayName}</span>
                    <span className="block truncate text-xs text-slate-400">@{result.username}</span>
                  </span>
                  {isCreatingGroup && (
                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition ${
                      isSelected ? 'bg-[#5288c1] border-[#5288c1]' : 'border-white/20'
                    }`}>
                      {isSelected && <CheckCheck size={12} className="text-white" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <ChatTabs
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        getChatFolder={getChatFolder}
        isChatUnread={isChatUnread}
      />

      <ChatList
        filteredChats={filteredChats}
        isChatUnread={isChatUnread}
        getChatFolder={getChatFolder}
        activeFilter={activeFilter}
        handleSelectChat={handleSelectChat}
      />
    </aside>
  );
};
