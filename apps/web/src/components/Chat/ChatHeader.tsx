import { MoreVertical, X } from 'lucide-react';
import { useAuthStore, useChatStore } from '../../store/useStore';
import { Avatar } from '../Sidebar/Avatar';
import { getOtherParticipant } from '../Sidebar/utils';

interface ChatHeaderProps {
  isDetailsOpen: boolean;
  onToggleDetails: () => void;
}

export const ChatHeader = ({ isDetailsOpen, onToggleDetails }: ChatHeaderProps) => {
  const user = useAuthStore((state) => state.user);
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const setActiveChatId = useChatStore((state) => state.setActiveChatId);

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;
  const activeParticipant = activeChat && user ? getOtherParticipant(activeChat, user.id) : undefined;

  if (!activeChat) return null;

  return (
    <header className="flex h-[76px] items-center justify-between border-b border-white/10 bg-[#101a25]/95 px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 lg:hidden"
          onClick={() => setActiveChatId(null)}
          aria-label="Back to chats"
        >
          <X size={21} />
        </button>
        <Avatar user={activeChat.type === 'DIRECT' ? activeParticipant?.user : undefined} chat={activeChat} />
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-white">
            {activeChat.type === 'GROUP' ? activeChat.name : (activeParticipant?.user.displayName ?? 'Chat')}
          </h2>
          <p className="truncate text-xs text-slate-400">
            {activeChat.type === 'GROUP' 
              ? `${activeChat.participants.length} members` 
              : 'online recently'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleDetails}
          className="grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-expanded={isDetailsOpen}
          aria-label="Chat options"
        >
          <MoreVertical size={20} />
        </button>
      </div>
    </header>
  );
};
