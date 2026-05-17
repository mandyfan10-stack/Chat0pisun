import { Phone } from 'lucide-react';

const featCards = [
  {
    ico: '🎙',
    title: 'HD аудио',
    desc: 'Кристально чистый звук без задержек',
  },
  {
    ico: '🔒',
    title: 'End-to-end',
    desc: 'Сквозное шифрование каждого звонка',
  },
  {
    ico: '🖥',
    title: 'Screenshare',
    desc: 'Делитесь экраном в один клик',
  },
];

export const CallsPanel = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="panel-head">
        <span className="panel-head-title">Звонки</span>
      </div>

      <div className="calls-empty" style={{ overflowY: 'auto' }}>
        <div className="calls-icon-wrap">
          <Phone size={28} strokeWidth={1.6} />
        </div>

        <div>
          <div className="calls-title">Звонки скоро</div>
          <div className="calls-sub">
            Голосовые и видео-вызовы появятся в следующей версии
          </div>
        </div>

        <div className="feat-cards">
          {featCards.map((card) => (
            <div key={card.title} className="feat-card">
              <div className="feat-card-ico">{card.ico}</div>
              <div>
                <div className="feat-card-title">{card.title}</div>
                <div className="feat-card-desc">{card.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
