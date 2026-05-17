import { useMemo } from 'react';
import { useChatStore, type Chat } from '../../store/useStore';
import { type ChatFilter, chatFilterLabels } from './chatTabsTypes';

interface ChatTabsProps {
  activeFilter: ChatFilter;
  setActiveFilter: (filter: ChatFilter) => void;
  getChatFolder: (chat: Chat) => 'personal' | 'work';
  isChatUnread: (chat: Chat) => boolean;
}

export const ChatTabs = ({ activeFilter, setActiveFilter, getChatFolder, isChatUnread }: ChatTabsProps) => {
  const chats = useChatStore((state) => state.chats);

  const tabs = useMemo(
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

  return (
    <div className="sb-tabs">
      {tabs.map(({ filter, label, count }) => (
        <button
          key={filter}
          type="button"
          onClick={() => setActiveFilter(filter)}
          className={activeFilter === filter ? 'on' : ''}
          aria-pressed={activeFilter === filter}
        >
          {label}
          {count > 0 ? <span style={{ opacity: 0.7, marginLeft: 4 }}>{count}</span> : null}
        </button>
      ))}
    </div>
  );
};
