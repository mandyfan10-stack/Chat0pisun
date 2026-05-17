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
} from 'lucide-react';
import { api } from '../../services/api';
import { type Chat, type User, useAuthStore, useChatStore } from '../../store/useStore';
import { Avatar } from './Avatar';
import { ChatTabs } from './ChatTabs';
import { type ChatFilter } from './chatTabsTypes';
import { ChatList } from './ChatList';
import { ContactsPanel } from '../Rail/ContactsPanel';
import { GroupsPanel } from '../Rail/GroupsPanel';
import { CallsPanel } from '../Rail/CallsPanel';
import { SettingsPanel } from '../Rail/SettingsPanel';

type ChatFolder = 'personal' | 'work';
type RailView = 'chats' | 'contacts' | 'groups' | 'calls' | 'settings';

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
  railView: RailView;
  onRailChange: (v: RailView) => void;
}

export const Sidebar = ({ onSelectChat, railView, onRailChange }: SidebarProps) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const usersPresence = useAuthStore((state) => state.usersPresence);
  const chats = useChatStore((state) => state.chats);
  const setActiveChatId = useChatStore((state) => state.setActiveChatId);
  const startChat = useChatStore((state) => state.startChat);
  const createGroupChat = useChatStore((state) => state.createGroupChat);
  const uploadAvatar = useAuthStore((state) => state.uploadAvatar);

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  // railView and onRailChange are now props

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
    onRailChange('chats');
    onSelectChat?.();
  };

  const handleSelectChat = (chat: Chat) => {
    setActiveChatId(chat.id);
    markChatAsRead(chat);
    onRailChange('chats');
    onSelectChat?.();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
            className={`rail-btn${railView === 'chats' ? ' on' : ''}`}
            onClick={() => onRailChange('chats')}
          >
            <span className="rail-ico">
              <MessageSquare size={20} strokeWidth={1.6} />
            </span>
            <span className="rail-lbl">чаты</span>
            {totalUnread > 0 && <span className="rail-badge">{totalUnread}</span>}
          </button>
          <button
            className={`rail-btn${railView === 'contacts' ? ' on' : ''}`}
            onClick={() => onRailChange('contacts')}
          >
            <span className="rail-ico">
              <UserIcon size={20} strokeWidth={1.5} />
            </span>
            <span className="rail-lbl">контакты</span>
          </button>
          <button
            className={`rail-btn${railView === 'groups' ? ' on' : ''}`}
            onClick={() => onRailChange('groups')}
          >
            <span className="rail-ico">
              <Users size={20} strokeWidth={1.5} />
            </span>
            <span className="rail-lbl">группы</span>
          </button>
          <button
            className={`rail-btn${railView === 'calls' ? ' on' : ''}`}
            onClick={() => onRailChange('calls')}
          >
            <span className="rail-ico">
              <Phone size={20} strokeWidth={1.5} />
            </span>
            <span className="rail-lbl">звонки</span>
          </button>
          <button
            className={`rail-btn${railView === 'settings' ? ' on' : ''}`}
            onClick={() => onRailChange('settings')}
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
        <div className="sidebar-panel" key={railView}>
          {(() => {
            switch (railView) {
              case 'contacts': return (
                <ContactsPanel chats={chats} user={user} usersPresence={usersPresence} onStartChat={(userId) => void handleStartChat(userId)} />
              );
              case 'groups': return (
                <GroupsPanel chats={chats} onSelectChat={handleSelectChat} onCreateGroup={() => { setIsCreatingGroup(true); onRailChange('chats'); }} />
              );
              case 'calls': return <CallsPanel />;
              case 'settings': return <SettingsPanel user={user} onLogout={() => void handleLogout()} />;
              case 'chats':
              default: return (
                <>
                  <header className="sb-head">
                    <div className="sb-title">
                      <span className="sb-title-h">Эфир</span>
                      <span className="sb-title-meta mono">{chats.length} активных · {chats.length} эфиров</span>
                    </div>
                    <button className="iconbtn" onClick={() => setIsCreatingGroup((c) => !c)} title="Новая группа">
                      <Plus size={18} strokeWidth={1.6} />
                    </button>
                  </header>

                  {isCreatingGroup && (
                    <form onSubmit={(e) => void handleCreateGroup(e)} style={{ padding: '0 14px 14px', display: 'grid', gap: 10 }}>
                      <div className="fld">
                        <span className="fld-lbl">Название группы</span>
                        <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Проект-0" />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>Участников: {selectedUserIds.length}</div>
                      <button type="submit" disabled={!groupName.trim() || selectedUserIds.length === 0} className="auth-cta" style={{ marginTop: 0, padding: '10px 14px', fontSize: 13 }}><span>Создать группу</span></button>
                    </form>
                  )}

                  <form onSubmit={(e) => void handleSearch(e)} className="sb-search">
                    <i><Search size={16} strokeWidth={1.6} /></i>
                    <input type="text" placeholder={isCreatingGroup ? 'поиск участников…' : 'искать людей и группы…'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <kbd>⌘K</kbd>
                  </form>

                  {searchError ? (<div style={{ padding: '0 14px 10px', fontSize: 12, color: '#ff9090' }}>{searchError}</div>) : null}

                  {searchResults.length > 0 && (
                    <div style={{ margin: '0 14px 14px', background: 'var(--panel)', border: '1px solid var(--rule)', borderRadius: 12, overflow: 'hidden' }}>
                      {searchResults.map((result) => {
                        const isSelected = selectedUserIds.includes(result.id);
                        return (
                          <button key={result.id} type="button" className="row" style={{ borderRadius: 0 }} onClick={() => isCreatingGroup ? toggleUserSelection(result.id) : void handleStartChat(result.id)}>
                            <Avatar user={result} size="sm" />
                            <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                              <span className="row-name" style={{ fontSize: 14 }}>{result.displayName}</span>
                              <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-3)', fontFamily: '"JetBrains Mono", monospace' }}>@{result.username}</span>
                            </span>
                            {isCreatingGroup && isSelected && <CheckCheck size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <ChatTabs activeFilter={activeFilter} setActiveFilter={setActiveFilter} getChatFolder={getChatFolder} isChatUnread={isChatUnread} />
                  <ChatList filteredChats={filteredChats} isChatUnread={isChatUnread} getChatFolder={getChatFolder} activeFilter={activeFilter} handleSelectChat={handleSelectChat} />

                  <div className="sb-foot">
                    <div className="sb-foot-status">
                      <span className="odot on" style={{ width: 8, height: 8 }} />
                      <span className="mono">онлайн · {user.email || 'you@chat0pisun.app'}</span>
                    </div>
                  </div>
                </>
              );
            }
          })()} 
        </div>
      </aside>
    </>
  );
};
