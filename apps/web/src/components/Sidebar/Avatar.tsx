import { SOCKET_URL } from '../../services/api';
import { type Chat, type User } from '../../store/useStore';
import { getInitials } from './avatarUtils';

const AVATAR_TINTS: [string, string][] = [
  ['#ff7a59', '#2a1410'],
  ['#c5ff2e', '#1a1f0a'],
  ['#7cc7ff', '#0e1a25'],
  ['#ffb84d', '#241608'],
  ['#e08aff', '#1d0e25'],
  ['#5cffb4', '#0a2018'],
];

function tintFor(s: string): [string, string] {
  let h = 0;
  for (const c of s) h = ((h * 31 + c.charCodeAt(0)) | 0);
  return AVATAR_TINTS[Math.abs(h) % AVATAR_TINTS.length];
}

interface AvatarProps {
  user?: User;
  chat?: Chat;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar = ({ user, chat, size = 'md' }: AvatarProps) => {
  const px = size === 'lg' ? 56 : size === 'sm' ? 36 : 44;

  const avatarUrl = user?.avatarUrl || chat?.avatarUrl;
  const name =
    (chat?.type === 'GROUP'
      ? chat.name
      : user?.displayName || user?.username) || 'User';

  if (avatarUrl) {
    const fullUrl = avatarUrl.startsWith('http')
      ? avatarUrl
      : `${SOCKET_URL}${avatarUrl}`;
    return (
      <img
        src={fullUrl}
        alt=""
        className="avatar"
        style={{ width: px, height: px, borderRadius: px * 0.28, objectFit: 'cover' }}
      />
    );
  }

  const [bg, fg] = tintFor(name);
  const radius = px * 0.28;

  return (
    <div
      className="avatar"
      style={{
        width: px,
        height: px,
        borderRadius: radius,
        background: bg,
        color: fg,
        fontSize: px * 0.36,
      }}
    >
      <span>{getInitials(name)}</span>
    </div>
  );
};
