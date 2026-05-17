import { useState, useRef } from 'react';
import { Send, Mic, Plus, Smile } from 'lucide-react';
import { useChatStore } from '../../store/useStore';

export const MessageInput = () => {
  const [message, setMessage] = useState('');
  const activeChatId = useChatStore((state) => state.activeChatId);
  const sendChatMessage = useChatStore((state) => state.sendMessage);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!message.trim() || !activeChatId) {
      return;
    }

    const text = message;
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendChatMessage(activeChatId, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  };

  if (!activeChatId) return null;

  const hasText = message.trim().length > 0;

  return (
    <footer className="composer">
      <div className="composer-shell">
        <button className="iconbtn" type="button" aria-label="Прикрепить">
          <Plus size={18} strokeWidth={1.6} />
        </button>
        <div className="composer-field">
          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            placeholder="написать в эфир…"
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            aria-label="Сообщение"
          />
        </div>
        <button className="iconbtn" type="button" aria-label="Эмодзи">
          <Smile size={18} strokeWidth={1.6} />
        </button>
        {hasText ? (
          <button
            className="composer-send on"
            type="button"
            onClick={() => void handleSendMessage()}
            aria-label="Отправить"
          >
            <Send size={18} strokeWidth={1.6} />
          </button>
        ) : (
          <button className="composer-send" type="button" aria-label="Голосовое">
            <Mic size={18} strokeWidth={1.6} />
          </button>
        )}
      </div>
    </footer>
  );
};
