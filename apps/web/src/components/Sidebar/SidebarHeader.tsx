import { LogOut, Menu, MessageCircle } from 'lucide-react';

interface SidebarHeaderProps {
  onMenuClick: () => void;
  onLogout: () => void;
  isProfileMenuOpen: boolean;
}

export const SidebarHeader = ({ onMenuClick, onLogout, isProfileMenuOpen }: SidebarHeaderProps) => {
  return (
    <div className="mb-5 flex items-center justify-between">
      <button
        type="button"
        onClick={onMenuClick}
        className="grid h-10 w-10 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
        aria-expanded={isProfileMenuOpen}
        aria-label="Open profile menu"
      >
        <Menu size={21} />
      </button>
      <div className="flex items-center gap-2">
        <MessageCircle size={20} className="text-[#7dd3fc]" />
        <span className="text-sm font-semibold tracking-[0.12em] text-white">NEXTGRAM</span>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-red-500/10 hover:text-red-200"
        aria-label="Logout"
      >
        <LogOut size={20} />
      </button>
    </div>
  );
};
