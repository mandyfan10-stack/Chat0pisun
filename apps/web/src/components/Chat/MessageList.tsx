import { useMemo, useEffect, useRef } from 'react';
import { CheckCheck, Check } from 'lucide-react';
import { useAuthStore, useChatStore } from '../../store/useStore';
import { LinkifiedText } from '../LinkifiedText';
import { formatTime } from '../Sidebar/utils';

export const MessageList = () => {
  const user = useAuthStore((state) => state.user);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const chats = useChatStore((state) => state.chats);
  const messages = useChatStore((state) => state.messages);
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const isGroup = activeChat?.type === 'GROUP';

  const visibleMessages = useMemo(
    () => (activeChatId ? [...(messages[activeChatId] ?? [])].reverse() : []),
    [activeChatId, messages],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleMessages.length, activeChatId]);

  if (!activeChatId) return null;

  return (
    <div className="chat-scroll" ref={scrollRef}>
      <div className="chat-stream">
        {isLoadingMessages ? (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--ink-3)' }}>
            <span className="mono" style={{ fontSize: 12 }}>загрузка…</span>
          </div>
        ) : visibleMessages.length > 0 ? (
          <>
            <div className="day-sep">
              <span className="mono">сегодня</span>
            </div>
            {visibleMessages.map((chatMessage, i) => {
              const isMine = chatMessage.senderId === user?.id;
              const prev = visibleMessages[i - 1];
              const sameAuthor = prev && prev.senderId === chatMessage.senderId;
              const sender = activeChat?.participants.find(
                (p) => p.userId === chatMessage.senderId,
              )?.user;

              return (
                <div
                  key={chatMessage.id}
                  className={`msg ${isMine ? 'out' : 'in'}${sameAuthor ? ' tight' : ''}`}
                >
                  {!isMine && (
                    sameAuthor ? (
                      <div className="msg-ava-spacer" />
                    ) : (
                      <div style={{ width: 32, height: 32, flexShrink: 0 }}>
                        <div
                          className="avatar"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 32 * 0.28,
                            background: 'var(--panel-2)',
                            color: 'var(--ink-2)',
                            fontSize: 11,
                          }}
                        >
                          <span>
                            {(sender?.displayName || sender?.username || '?')
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                  <div className="msg-body">
                    {!isMine && !sameAuthor && isGroup && (
                      <div className="msg-author">
                        {sender?.displayName || sender?.username || 'User'}
                      </div>
                    )}
                    <div className="bubble-wrap">
                      <div className={`bubble bubble-blob ${isMine ? 'out' : 'in'}`}>
                        <div className="bubble-text">
                          <LinkifiedText text={chatMessage.text} isMine={isMine} />
                        </div>
                        <div className="bubble-meta">
                          <span className="mono">{formatTime(chatMessage.createdAt)}</span>
                          {isMine && (
                            <span className={`ticks ${chatMessage.readAt ? 'read' : 'sent'}`}>
                              {chatMessage.readAt ? (
                                <CheckCheck size={14} strokeWidth={1.8} />
                              ) : (
                                <Check size={14} strokeWidth={1.8} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="empty">
            <div className="empty-mark">◐</div>
            <div className="empty-h">Начните разговор</div>
            <div className="empty-sub">сообщения сохраняются в базе данных</div>
          </div>
        )}
      </div>
    </div>
  );
};
