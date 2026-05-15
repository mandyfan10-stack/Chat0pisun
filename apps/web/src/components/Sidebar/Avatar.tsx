import { SOCKET_URL } from '../../services/api';
import { type Chat, type User } from '../../store/useStore';
import { getInitials } from './avatarUtils';

export const Avatar = ({ user, chat, size = 'md' }: { user?: User; chat?: Chat; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClass = size === 'lg' ? 'h-14 w-14 text-lg' : size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm';
  
  const avatarUrl = user?.avatarUrl || chat?.avatarUrl;
  const name = (chat?.type === 'GROUP' ? chat.name : (user?.displayName || user?.username)) || 'User';

  if (avatarUrl) {
    const fullUrl = avatarUrl.startsWith('http')
      ? avatarUrl
      : `${SOCKET_URL}${avatarUrl}`;
    return <img src={fullUrl} alt="" className={`${sizeClass} rounded-full object-cover`} />;
  }

  const isGroup = chat?.type === 'GROUP';

  return (
    <div
      className={`${sizeClass} grid shrink-0 place-items-center rounded-full border border-white/10 ${
        isGroup 
          ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' 
          : 'bg-gradient-to-br from-[#7dd3fc] to-[#5288c1]'
      } font-semibold text-white shadow-lg shadow-black/20`}
    >
      {getInitials(name)}
    </div>
  );
};
