import { useMemo } from 'react';
import { type Chat, type User } from '../../store/useStore';
import { Avatar } from '../Sidebar/Avatar';

interface ContactsPanelProps {
  chats: Chat[];
  user: User;
  usersPresence: Record<string, 'online' | 'offline'>;
  onStartChat: (userId: string) => void;
}

export const ContactsPanel = ({ chats, user, usersPresence, onStartChat }: ContactsPanelProps) => {
  const contacts = useMemo(() => {
    const seen = new Set<string>();
    const result: User[] = [];
    for (const chat of chats) {
      for (const p of chat.participants) {
        if (p.userId !== user.id && !seen.has(p.userId)) {
          seen.add(p.userId);
          result.push(p.user);
        }
      }
    }
    return result;
  }, [chats, user.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="panel-head">
        <span className="panel-head-title">Контакты</span>
        <span className="panel-head-meta">{contacts.length} чел.</span>
      </div>

      {contacts.length === 0 ? (
        <div className="panel-empty">
          <div className="panel-empty-glyph">&#x25D0;</div>
          <div className="panel-empty-h">Начни общаться</div>
          <div className="panel-empty-sub">здесь появятся контакты</div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {contacts.map((contact) => {
            const isOnline = usersPresence[contact.id] === 'online';
            return (
              <div
                key={contact.id}
                className="row"
                style={{ position: 'relative' }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget.querySelector<HTMLElement>('.contact-write-btn');
                  if (btn) btn.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget.querySelector<HTMLElement>('.contact-write-btn');
                  if (btn) btn.style.opacity = '0';
                }}
              >
                <div className="row-ava" style={{ position: 'relative' }}>
                  <Avatar user={contact} size="lg" />
                  {isOnline && (
                    <span
                      className="odot on"
                      style={{
                        width: 9,
                        height: 9,
                        position: 'absolute',
                        bottom: -1,
                        right: -1,
                        border: '2px solid var(--panel)',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        display: 'block',
                      }}
                    />
                  )}
                </div>
                <div className="row-body">
                  <div className="row-top">
                    <span className="row-name">{contact.displayName}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: '"JetBrains Mono", monospace' }}>
                    @{contact.username}
                  </div>
                </div>
                <button
                  className="contact-write-btn"
                  type="button"
                  style={{
                    opacity: 0,
                    transition: 'opacity .15s',
                    fontSize: 11,
                    color: 'var(--accent)',
                    fontFamily: '"JetBrains Mono", monospace',
                    background: 'none',
                    border: '1px solid var(--accent)',
                    borderRadius: 8,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  onClick={() => onStartChat(contact.id)}
                >
                  написать
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
