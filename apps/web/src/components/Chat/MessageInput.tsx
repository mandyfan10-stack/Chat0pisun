import { useState } from 'react';
import { Send } from 'lucide-react';
import { useChatStore } from '../../store/useStore';

export const MessageInput = () => {
  const [message, setMessage] = useState('');
  const activeChatId = useChatStore((state) => state.activeChatId);
  const sendChatMessage = useChatStore((state) => state.sendMessage);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !activeChatId) {
      return;
    }

    const text = message;
    setMessage('');
    await sendChatMessage(activeChatId, text);
  };

  if (!activeChatId) return null;

  return (
    <footer className="border-t border-white/10 bg-[#101a25]/95 px-4 py-3 sm:px-6">
      <form onSubmit={handleSendMessage} className="mx-auto flex max-w-4xl items-end gap-2">
        <input
          type="text"
          placeholder="Message"
          className="min-h-11 flex-1 rounded-2xl border border-white/10 bg-[#0e141b] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#5b9be7] focus:ring-4 focus:ring-[#5b9be7]/10"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-label="Message"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#5288c1] text-white shadow-lg shadow-[#5288c1]/20 transition hover:bg-[#6aa8ef] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <Send size={19} />
        </button>
      </form>
    </footer>
  );
};
