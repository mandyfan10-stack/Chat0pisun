import { X, Bell, BellOff, Search, Pin, LogOut } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore, useChatStore } from '../../store/useStore';
import { Avatar } from '../Sidebar/Avatar';
import { getOtherParticipant } from '../Sidebar/utils';

interface ChatDetailsProps {
  onClose: () => void;
  onSetFolder: (chatId: string, folder: 'personal' | 'work') => void;
  getChatFolder: (chat: { id: string }) => 'personal' | 'work';
  onSearchInChat?: () => void;
}

export const ChatDetails = ({ onClose, onSetFolder, getChatFolder, onSearchInChat }: ChatDetailsProps) => {
  const user = useAuthStore((state) => state.user);
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const mutedChats = useChatStore((state) => state.mutedChats);
  const pinnedChats = useChatStore((state) => state.pinnedChats);
  const toggleMute = useChatStore((state) => state.toggleMute);
  const togglePin = useChatStore((state) => state.togglePin);
  const removeChat = useChatStore((state) => state.removeChat);

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;
  const activeParticipant = activeChat && user ? getOtherParticipant(activeChat, user.id) : undefined;

  if (!activeChat) return null;

  const isGroup = activeChat.type === 'GROUP';
  const isMuted = mutedChats.includes(activeChat.id);
  const isPinned = pinnedChats.includes(activeChat.id);
  const displayName = isGroup
    ? activeChat.name
    : activeParticipant?.user.displayName ?? 'Chat';

  const handleLeave = () => {
    if (confirm('Покинуть группу?')) {
      void api.delete(`/chats/${activeChat.id}/leave`).catch(() => {});
      removeChat(activeChat.id);
      onClose();
    }
  };

  return (
    <aside className="details">
      <header className="det-head">
        <span>детали эфира</span>
        <button className="iconbtn" onClick={onClose}>
          <X size={18} strokeWidth={1.6} />
        </button>
      </header>

      <div className="det-hero">
        <div className="det-ava">
          <Avatar
            user={!isGroup ? activeParticipant?.user : undefined}
            chat={activeChat}
            size="lg"
          />
        </div>
        <div className="det-name">{displayName}</div>
        <div className="det-meta">
          {isGroup ? `${activeChat.participants.length} участников` : 'в сети недавно'}
        </div>
        <div className="det-acts">
          <button onClick={() => toggleMute(activeChat.id)}>
            <i>
              {isMuted
                ? <BellOff size={16} strokeWidth={1.6} />
                : <Bell size={16} strokeWidth={1.6} />
              }
            </i>
            <span>{isMuted ? 'звук' : 'тише'}</span>
          </button>
          <button onClick={onSearchInChat}>
            <i><Search size={16} strokeWidth={1.6} /></i>
            <span>искать</span>
          </button>
          <button onClick={() => togglePin(activeChat.id)}>
            <i><Pin size={16} strokeWidth={1.6} style={isPinned ? { fill: 'currentColor' } : {}} /></i>
            <span>{isPinned ? 'закреплён' : 'закрепить'}</span>
          </button>
          {isGroup && (
            <button className="danger" onClick={handleLeave}>
              <i><LogOut size={16} strokeWidth={1.6} /></i>
              <span>покинуть</span>
            </button>
          )}
        </div>
      </div>

      {isGroup && (
        <section className="det-section">
          <header>участники · {activeChat.participants.length}</header>
          <div className="det-members">
            {activeChat.participants.map((p, i) => (
              <div key={p.userId} className="det-member">
                <Avatar user={p.user} size="sm" />
                <div className="det-member-meta">
                  <span>{p.user.displayName || p.user.username}</span>
                  <span>{i < 2 ? 'в сети' : 'недавно'}</span>
                </div>
                {i === 0 && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '3px 7px',
                      background: 'var(--accent)',
                      color: 'var(--canvas)',
                      borderRadius: 4,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    admin
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="det-section">
        <header>папка</header>
        <div className="det-folder-row">
          {(['personal', 'work'] as const).map((folder) => (
            <button
              key={folder}
              type="button"
              className={`det-folder-btn${getChatFolder(activeChat) === folder ? ' active' : ''}`}
              onClick={() => onSetFolder(activeChat.id, folder)}
              aria-pressed={getChatFolder(activeChat) === folder}
            >
              {folder === 'personal' ? 'Личное' : 'Работа'}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
};
