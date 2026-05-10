import { User as UserIcon } from 'lucide-react';
import { useAuthStore, useChatStore, type Chat } from '../../store/useStore';
import { Avatar } from './Avatar';
import { formatTime, getOtherParticipant } from './utils';
import { type ChatFilter, chatFilterLabels } from './ChatTabs';

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

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      {isLoadingChats ? (
        <div className="grid h-40 place-items-center text-sm text-slate-500">Loading chats...</div>
      ) : chats.length === 0 ? (
        <div className="m-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#5288c1]/20 text-[#7dd3fc]">
            <UserIcon size={26} />
          </div>
          <div className="text-sm font-medium text-white">No chats yet</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">Search for a user to start a conversation.</div>
        </div>
      ) : filteredChats.length === 0 ? (
        <div className="m-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
          <div className="text-sm font-medium text-white">No {chatFilterLabels[activeFilter].toLowerCase()} chats</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">
            {activeFilter === 'work'
              ? 'Open a chat and move it to Work from the chat details panel.'
              : activeFilter === 'new'
                ? 'Unread incoming messages will appear here.'
                : 'Try another folder or start a new chat.'}
          </div>
        </div>
      ) : (
        filteredChats.map((chat) => {
          const otherParticipant = getOtherParticipant(chat, user.id);
          const isActive = activeChatId === chat.id;
          const isUnread = isChatUnread(chat);
          const isGroup = chat.type === 'GROUP';

          return (
            <button
              key={chat.id}
              type="button"
              onClick={() => handleSelectChat(chat)}
              className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                isActive ? 'bg-[#182331]' : 'hover:bg-white/[0.04]'
              }`}
            >
              <Avatar user={!isGroup ? otherParticipant?.user : undefined} chat={chat} size="lg" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-white">
                    {isGroup ? chat.name : (otherParticipant?.user.displayName ?? 'Unknown chat')}
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-500">{formatTime(chat.updatedAt)}</span>
                </span>
                <span className="mt-1 block truncate text-sm text-slate-400">
                  {isGroup && chat.lastMessage && (
                    <span className="text-[#7dd3fc]">
                      {chat.participants.find(p => p.userId === chat.lastMessage?.senderId)?.user.displayName || 'User'}:{' '}
                    </span>
                  )}
                  {chat.lastMessage?.text ?? 'No messages yet'}
                </span>
                <span className="mt-2 inline-flex rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {isGroup ? 'Group' : getChatFolder(chat)}
                </span>
              </span>
              {isUnread ? (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#5288c1] text-[11px] font-semibold text-white">
                  1
                </span>
              ) : null}
            </button>
          );
        })
      )}
    </div>
  );
};
