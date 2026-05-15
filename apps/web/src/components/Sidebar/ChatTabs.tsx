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
    <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3 text-xs">
      {tabs.map(({ filter, label, count }) => (
        <button
          key={filter}
          type="button"
          onClick={() => setActiveFilter(filter)}
          className={`rounded-full px-3 py-1.5 transition ${
            activeFilter === filter ? 'bg-[#5288c1] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
          aria-pressed={activeFilter === filter}
        >
          {label}
          {count > 0 ? <span className="ml-1 opacity-75">{count}</span> : null}
        </button>
      ))}
    </div>
  );
};
