import { useMemo } from 'react';
import { CheckCheck, MessageCircle } from 'lucide-react';
import { useAuthStore, useChatStore } from '../../store/useStore';
import { LinkifiedText } from '../LinkifiedText';
import { formatTime } from '../Sidebar/utils';

export const MessageList = () => {
  const user = useAuthStore((state) => state.user);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const messages = useChatStore((state) => state.messages);
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);

  const visibleMessages = useMemo(
    () => (activeChatId ? [...(messages[activeChatId] ?? [])].reverse() : []),
    [activeChatId, messages],
  );

  if (!activeChatId) return null;

  return (
    <section className="nextgram-pattern flex-1 overflow-y-auto px-4 py-6 sm:px-8">
      {isLoadingMessages ? (
        <div className="grid h-full place-items-center text-sm text-slate-500">Loading messages...</div>
      ) : visibleMessages.length > 0 ? (
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <div className="mx-auto mb-3 rounded-full bg-[#182331]/90 px-3 py-1 text-xs text-slate-400">Today</div>
          {visibleMessages.map((chatMessage) => {
            const isMine = chatMessage.senderId === user?.id;

            return (
              <div key={chatMessage.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-[22px] px-4 py-2.5 shadow-lg shadow-black/10 ${
                    isMine
                      ? 'rounded-br-md bg-[#5288c1] text-white'
                      : 'rounded-bl-md border border-white/5 bg-[#182331] text-slate-100'
                  }`}
                >
                  <LinkifiedText text={chatMessage.text} isMine={isMine} />
                  <div className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${isMine ? 'text-blue-100' : 'text-slate-500'}`}>
                    <span>{formatTime(chatMessage.createdAt)}</span>
                    {isMine ? (
                      <CheckCheck size={13} className={chatMessage.readAt ? 'text-blue-300' : ''} />
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid h-full place-items-center">
          <div className="max-w-xs text-center">
            <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-[#5288c1]/20 text-[#7dd3fc]">
              <MessageCircle size={38} />
            </div>
            <p className="text-lg font-semibold text-white">Start the conversation</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Send a message and it will be saved to the database.</p>
          </div>
        </div>
      )}
    </section>
  );
};
