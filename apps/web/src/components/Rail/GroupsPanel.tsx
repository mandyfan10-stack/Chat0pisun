import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { type Chat } from '../../store/useStore';
import { Avatar } from '../Sidebar/Avatar';
import { formatTime } from '../Sidebar/utils';

interface GroupsPanelProps {
  chats: Chat[];
  onSelectChat: (chat: Chat) => void;
  onCreateGroup: () => void;
}

export const GroupsPanel = ({ chats, onSelectChat, onCreateGroup }: GroupsPanelProps) => {
  const groups = useMemo(() => chats.filter((c) => c.type === 'GROUP'), [chats]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="panel-head">
        <span className="panel-head-title">Группы</span>
        <button
          type="button"
          className="iconbtn"
          onClick={onCreateGroup}
          title="Создать группу"
          style={{ width: 32, height: 32 }}
        >
          <Plus size={16} strokeWidth={1.6} />
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="panel-empty">
          <div className="panel-empty-glyph">&#x25D0;</div>
          <div className="panel-empty-h">Создайте первую группу</div>
          <div className="panel-empty-sub">нажмите + чтобы начать</div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {groups.map((group) => {
            const preview = group.lastMessage?.text ?? 'нет сообщений';
            const time = formatTime(group.updatedAt);
            const memberCount = group.participants.length;

            return (
              <button
                key={group.id}
                type="button"
                className="row"
                onClick={() => onSelectChat(group)}
              >
                <div className="row-ava">
                  <Avatar chat={group} size="lg" />
                </div>
                <div className="row-body">
                  <div className="row-top">
                    <span className="row-name" style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic' }}>
                      {group.name ?? 'Группа'}
                    </span>
                    <span className="row-time mono">{time}</span>
                  </div>
                  <div className="row-bot">
                    <span className="row-preview">
                      <span style={{ color: 'var(--ink-3)', fontFamily: '"JetBrains Mono", monospace', fontSize: 10 }}>
                        {memberCount} участн. &middot;{' '}
                      </span>
                      <span className="row-preview-t">{preview}</span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
