import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MessageSquare,
  Users,
  Phone,
  Settings,
  User as UserIcon,
  Plus,
  CheckCheck,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { type Chat, type User, useAuthStore, useChatStore } from '../../store/useStore';
import { Avatar } from './Avatar';
import { ChatTabs } from './ChatTabs';
import { type ChatFilter } from './chatTabsTypes';
import { ChatList } from './ChatList';
import { formatTime } from './utils';

type ChatFolder = 'personal' | 'work';

const readJsonStorage = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)) as T;
  } catch {
    return fallback;
  }
};

const getChatVersion = (chat: Chat) => chat.lastMessage?.id ?? chat.updatedAt;

interface SidebarProps {
  onSelectChat?: () => void;
  onBack?: () => void;
}

export const Sidebar = ({ onSelectChat }: SidebarProps) => {
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
  const [chatFolders] = useState<Record<string, ChatFolder>>(() =>
    readJsonStorage<Record<string, ChatFolder>>('nextgram.chatFolders', {}),
  );
  const [readChatVersions, setReadChatVersions] = useState<Record<string, string>>(() =>
    readJsonStorage<Record<string, string>>('nextgram.readChats', {}),
  );
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName ?? '');
  const [editBio, setEditBio] = useState(user?.bio ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [railActive, setRailActive] = useState('chats');

  useEffect(() => {
    localStorage.setItem('nextgram.readChats', JSON.stringify(readChatVersions));
  }, [readChatVersions]);

  const getChatFolder = useCallback((chat: Chat) => chatFolders[chat.id] ?? 'personal', [chatFolders]);
  const isChatUnread = useCallback(
    (chat: Chat) =>
      Boolean(
        user &&
          chat.lastMessage &&
          chat.lastMessage.senderId !== user.id &&
          readChatVersions[chat.id] !== getChatVersion(chat),
      ),
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
      const response = await api.get<User[]>('/users/search', { params: { q: normalizedQuery } });
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
    onSelectChat?.();
  };

  const handleSelectChat = (chat: Chat) => {
    setActiveChatId(chat.id);
    markChatAsRead(chat);
    onSelectChat?.();
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

  const handleAvatarClick = () => fileInputRef.current?.click();

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
      if (activeFilter === 'new') return isChatUnread(chat);
      if (activeFilter === 'personal') return getChatFolder(chat) === 'personal';
      if (activeFilter === 'work') return getChatFolder(chat) === 'work';
      return true;
    });
  }, [activeFilter, chats, getChatFolder, isChatUnread]);

  const totalUnread = chats.filter(isChatUnread).length;

  if (!user) return null;

  return (
    <>
      {/* Rail — 72px left nav bar */}
      <nav className="rail">
        <button className="rail-mark" onClick={handleLogout} title="выйти">
          <span>◐</span>
        </button>

        <div className="rail-stack">
          <button
            className={`rail-btn${railActive === 'chats' ? ' on' : ''}`}
            onClick={() => setRailActive('chats')}
          >
            <span className="rail-ico">
              <MessageSquare size={20} strokeWidth={1.6} />
            </span>
            <span className="rail-lbl">чаты</span>
            {totalUnread > 0 && <span className="rail-badge">{totalUnread}</span>}
          </button>
          <button
            className={`rail-btn${railActive === 'contacts' ? ' on' : ''}`}
            onClick={() => setRailActive('contacts')}
          >
            <span className="rail-ico">
              <UserIcon size={20} strokeWidth={1.5} />
            </span>
            <span className="rail-lbl">контакты</span>
          </button>
          <button
            className={`rail-btn${railActive === 'groups' ? ' on' : ''}`}
            onClick={() => setRailActive('groups')}
          >
            <span className="rail-ico">
              <Users size={20} strokeWidth={1.5} />
            </span>
            <span className="rail-lbl">группы</span>
          </button>
          <button
            className={`rail-btn${railActive === 'calls' ? ' on' : ''}`}
            onClick={() => setRailActive('calls')}
          >
            <span className="rail-ico">
              <Phone size={20} strokeWidth={1.5} />
            </span>
            <span className="rail-lbl">звонки</span>
          </button>
          <button
            className={`rail-btn${railActive === 'settings' ? ' on' : ''}`}
            onClick={() => setRailActive('settings')}
          >
            <span className="rail-ico">
              <Settings size={20} strokeWidth={1.5} />
            </span>
            <span className="rail-lbl">настройки</span>
          </button>
        </div>

        <div className="rail-me" onClick={handleAvatarClick} title="сменить аватар">
          <Avatar user={user} size="sm" />
          <span className="odot on" style={{ width: 9, height: 9, position: 'absolute', bottom: -2, right: -2 }} />
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </div>
      </nav>

      {/* Sidebar panel */}
      <aside className="sidebar">
        <header className="sb-head">
          <div className="sb-title">
            <span className="sb-title-h">Эфир</span>
            <span className="sb-title-meta mono">
              {chats.length} активных · {chats.length} эфиров
            </span>
          </div>
          <button
            className="iconbtn"
            onClick={() => setIsCreatingGroup((c) => !c)}
            title="Новая группа"
          >
            <Plus size={18} strokeWidth={1.6} />
          </button>
        </header>

        {/* Profile editing */}
        {isEditingProfile && (
          <form onSubmit={handleUpdateProfile} style={{ padding: '0 14px 14px', display: 'grid', gap: 10 }}>
            <div className="fld">
              <span className="fld-lbl">Display Name</span>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
              />
            </div>
            <div className="fld">
              <span className="fld-lbl">Bio</span>
              <input
                type="text"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="auth-cta"
                style={{ flex: 1, marginTop: 0, padding: '10px 14px', fontSize: 13 }}
              >
                <span>Сохранить</span>
              </button>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setIsEditingProfile(false)}
              >
                <X size={18} />
              </button>
            </div>
            {authError && <div className="auth-error">{authError}</div>}
          </form>
        )}

        {/* Group creation */}
        {isCreatingGroup && (
          <form onSubmit={handleCreateGroup} style={{ padding: '0 14px 14px', display: 'grid', gap: 10 }}>
            <div className="fld">
              <span className="fld-lbl">Название группы</span>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Проект-0"
              />
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Участников: {selectedUserIds.length}
            </div>
            <button
              type="submit"
              disabled={!groupName.trim() || selectedUserIds.length === 0}
              className="auth-cta"
              style={{ marginTop: 0, padding: '10px 14px', fontSize: 13 }}
            >
              <span>Создать группу</span>
            </button>
          </form>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="sb-search">
          <i><Search size={16} strokeWidth={1.6} /></i>
          <input
            type="text"
            placeholder={isCreatingGroup ? 'поиск участников…' : 'искать людей и группы…'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd>⌘K</kbd>
        </form>

        {searchError ? (
          <div style={{ padding: '0 14px 10px', fontSize: 12, color: '#ff9090' }}>{searchError}</div>
        ) : null}

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div
            style={{
              margin: '0 14px 14px',
              background: 'var(--panel)',
              border: '1px solid var(--rule)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {searchResults.map((result) => {
              const isSelected = selectedUserIds.includes(result.id);
              return (
                <button
                  key={result.id}
                  type="button"
                  className="row"
                  style={{ borderRadius: 0 }}
                  onClick={() =>
                    isCreatingGroup ? toggleUserSelection(result.id) : void handleStartChat(result.id)
                  }
                >
                  <Avatar user={result} size="sm" />
                  <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <span className="row-name" style={{ fontSize: 14 }}>
                      {result.displayName}
                    </span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-3)', fontFamily: '"JetBrains Mono", monospace' }}>
                      @{result.username}
                    </span>
                  </span>
                  {isCreatingGroup && isSelected && (
                    <CheckCheck size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <ChatTabs
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          getChatFolder={getChatFolder}
          isChatUnread={isChatUnread}
        />

        {/* Chat list */}
        <ChatList
          filteredChats={filteredChats}
          isChatUnread={isChatUnread}
          getChatFolder={getChatFolder}
          activeFilter={activeFilter}
          handleSelectChat={handleSelectChat}
        />

        {/* Footer */}
        <div className="sb-foot">
          <div className="sb-foot-status">
            <span className="odot on" style={{ width: 8, height: 8 }} />
            <span className="mono">online · {user.email || 'you@chat0pisun.app'}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
