import { Search, Bell, MoreHorizontal, ChevronLeft } from 'lucide-react';
import { useAuthStore, useChatStore } from '../../store/useStore';
import { Avatar } from '../Sidebar/Avatar';
import { getOtherParticipant } from '../Sidebar/utils';

interface ChatHeaderProps {
  isDetailsOpen: boolean;
  onToggleDetails: () => void;
  onBack?: () => void;
}

export const ChatHeader = ({ isDetailsOpen, onToggleDetails, onBack }: ChatHeaderProps) => {
  const user = useAuthStore((state) => state.user);
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;
  const activeParticipant = activeChat && user ? getOtherParticipant(activeChat, user.id) : undefined;

  if (!activeChat) return null;

  const isGroup = activeChat.type === 'GROUP';
  const displayName = isGroup
    ? activeChat.name
    : activeParticipant?.user.displayName ?? 'Chat';
  const subtitle = isGroup
    ? `${activeChat.participants.length} участников`
    : 'в сети недавно';

  return (
    <header className="chat-head">
      <button className="iconbtn mob-only" onClick={onBack} aria-label="Назад">
        <ChevronLeft size={20} strokeWidth={1.6} />
      </button>

      <div className="chat-head-id">
        <div className="chat-head-ava">
          <Avatar
            user={!isGroup ? activeParticipant?.user : undefined}
            chat={activeChat}
            size="md"
          />
        </div>
        <div className="chat-head-meta">
          <div className="chat-head-name">{displayName}</div>
          <div className="chat-head-sub">{subtitle}</div>
        </div>
      </div>

      <div className="chat-head-act">
        <button className="iconbtn" aria-label="Поиск">
          <Search size={18} strokeWidth={1.6} />
        </button>
        <button className="iconbtn" aria-label="Уведомления">
          <Bell size={18} strokeWidth={1.6} />
        </button>
        <button
          className={`iconbtn${isDetailsOpen ? ' on' : ''}`}
          onClick={onToggleDetails}
          aria-label="Детали"
        >
          <MoreHorizontal size={18} strokeWidth={1.6} />
        </button>
      </div>
    </header>
  );
};
