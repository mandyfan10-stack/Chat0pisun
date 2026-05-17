import { useAuthStore, useChatStore, type Chat } from '../../store/useStore';
import { Avatar } from './Avatar';
import { formatTime, getOtherParticipant } from './utils';
import { type ChatFilter, chatFilterLabels } from './chatTabsTypes';

interface ChatListProps {
  filteredChats: Chat[];
  isChatUnread: (chat: Chat) => boolean;
  getChatFolder: (chat: Chat) => string;
  activeFilter: ChatFilter;
  handleSelectChat: (chat: Chat) => void;
}

export const ChatList = ({
  filteredChats,
  isChatUnread,
  getChatFolder,
  activeFilter,
  handleSelectChat,
}: ChatListProps) => {
  const user = useAuthStore((state) => state.user);
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const isLoadingChats = useChatStore((state) => state.isLoadingChats);

  if (!user) return null;

  if (isLoadingChats) {
    return (
      <div className="sb-list" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span className="mono dim" style={{ fontSize: 12 }}>загрузка…</span>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="sb-list" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px 20px' }}>
        <div className="empty-mark" style={{ fontSize: 40 }}>◐</div>
        <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 18, fontStyle: 'italic', color: 'var(--ink-2)', marginTop: 8 }}>
          пока нет чатов
        </div>
        <div className="mono dim" style={{ fontSize: 11, marginTop: 6 }}>
          найдите пользователя чтобы начать
        </div>
      </div>
    );
  }

  if (filteredChats.length === 0) {
    return (
      <div className="sb-list" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px 20px' }}>
        <div className="mono dim" style={{ fontSize: 11 }}>
          нет {chatFilterLabels[activeFilter].toLowerCase()} чатов
        </div>
      </div>
    );
  }

  return (
    <div className="sb-list">
      {filteredChats.map((chat) => {
        const otherParticipant = getOtherParticipant(chat, user.id);
        const isActive = activeChatId === chat.id;
        const isUnread = isChatUnread(chat);
        const isGroup = chat.type === 'GROUP';
        const displayName = isGroup
          ? chat.name
          : otherParticipant?.user.displayName ?? 'Unknown chat';
        const preview = chat.lastMessage?.text ?? 'нет сообщений';
        const time = formatTime(chat.updatedAt);

        return (
          <button
            key={chat.id}
            type="button"
            onClick={() => handleSelectChat(chat)}
            className={`row${isActive ? ' on' : ''}`}
          >
            <div className="row-ava">
              <Avatar
                user={!isGroup ? otherParticipant?.user : undefined}
                chat={chat}
                size="lg"
              />
            </div>
            <div className="row-body">
              <div className="row-top">
                <span className="row-name">{displayName}</span>
                <span className="row-time mono">{time}</span>
              </div>
              <div className="row-bot">
                <span className="row-preview">
                  {isGroup && chat.lastMessage && (
                    <span style={{ color: 'var(--accent)', marginRight: 2 }}>
                      {chat.participants.find(
                        (p) => p.userId === chat.lastMessage?.senderId,
                      )?.user.displayName || 'User'}:{' '}
                    </span>
                  )}
                  <span className="row-preview-t">{preview}</span>
                </span>
                {isUnread && <span className="row-unread">1</span>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
