import { X } from 'lucide-react';
import { useAuthStore, useChatStore } from '../../store/useStore';
import { Avatar } from '../Sidebar/Avatar';
import { getOtherParticipant } from '../Sidebar/utils';

interface ChatDetailsProps {
  onClose: () => void;
  onSetFolder: (chatId: string, folder: 'personal' | 'work') => void;
    getChatFolder: (chat: { id: string }) => 'personal' | 'work';
}

export const ChatDetails = ({ onClose, onSetFolder, getChatFolder }: ChatDetailsProps) => {
  const user = useAuthStore((state) => state.user);
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;
  const activeParticipant = activeChat && user ? getOtherParticipant(activeChat, user.id) : undefined;

  if (!activeChat) return null;

  return (
    <aside className="absolute right-0 top-0 z-30 flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-[#101a25] p-5 shadow-2xl shadow-black/40 sm:w-[340px]">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Chat details</div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Close chat details"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mb-6 flex flex-col items-center text-center">
        <Avatar user={activeParticipant?.user} size="lg" />
        <div className="mt-3 text-lg font-semibold text-white">
          {activeParticipant?.user.displayName ?? 'Chat'}
        </div>
        <div className="mt-1 text-sm text-slate-400">@{activeParticipant?.user.username ?? 'user'}</div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#121b28] p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Folder</div>
        <div className="grid grid-cols-2 gap-2">
          {(['personal', 'work'] as const).map((folder) => (
            <button
              key={folder}
              type="button"
              onClick={() => onSetFolder(activeChat.id, folder)}
              className={`rounded-2xl px-3 py-2 text-sm font-semibold capitalize transition ${
                getChatFolder(activeChat) === folder
                  ? 'bg-[#5288c1] text-white'
                  : 'border border-white/10 text-slate-300 hover:bg-white/5'
              }`}
              aria-pressed={getChatFolder(activeChat) === folder}
            >
              {folder}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
