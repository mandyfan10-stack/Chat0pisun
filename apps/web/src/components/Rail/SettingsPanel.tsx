import { useEffect, useRef, useState } from 'react';
import { type User, useAuthStore } from '../../store/useStore';
import { Avatar } from '../Sidebar/Avatar';

const THEMES = ['espresso', 'ink', 'paper'] as const;
const ACCENTS = ['#c5ff2e', '#ff7a59', '#7cc7ff', '#e08aff', '#ffb84d'];

interface SettingsPanelProps {
  user: User;
  onLogout: () => void;
}

export const SettingsPanel = ({ user, onLogout }: SettingsPanelProps) => {
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const uploadAvatar = useAuthStore((state) => state.uploadAvatar);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const authError = useAuthStore((state) => state.authError);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user.displayName ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [currentTheme, setCurrentTheme] = useState<string>(
    () => localStorage.getItem('c0p.theme') ?? 'espresso',
  );
  const [currentAccent, setCurrentAccent] = useState<string>(
    () => localStorage.getItem('c0p.accent') ?? '#c5ff2e',
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    () => localStorage.getItem('c0p.sound') !== 'off',
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem('c0p.theme');
    if (savedTheme) {
      document.documentElement.dataset.theme = savedTheme === 'espresso' ? '' : savedTheme;
    }
    const savedAccent = localStorage.getItem('c0p.accent');
    if (savedAccent) {
      document.documentElement.style.setProperty('--accent', savedAccent);
    }
  }, []);

  const handleTheme = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.dataset.theme = theme === 'espresso' ? '' : theme;
    localStorage.setItem('c0p.theme', theme);
  };

  const handleAccent = (color: string) => {
    setCurrentAccent(color);
    document.documentElement.style.setProperty('--accent', color);
    localStorage.setItem('c0p.accent', color);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ displayName, bio });
    } catch {
      // Error handled by store
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await uploadAvatar(file);
      } catch {
        // Error handled by store
      }
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('c0p.sound', next ? 'on' : 'off');
  };

  return (
    <div className="settings-panel">
      <div className="settings-section">
        <div className="settings-section-title">Профиль</div>
        <form onSubmit={(e) => void handleSaveProfile(e)} style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            <div className="settings-ava-wrap" onClick={handleAvatarClick} title="Сменить аватар">
              <Avatar user={user} size="lg" />
              <div className="settings-ava-overlay">📷</div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => void handleFileChange(e)}
            />
          </div>

          <div className="fld">
            <span className="fld-lbl">Имя</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ваше имя"
            />
          </div>

          <div className="fld">
            <span className="fld-lbl">О себе</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Несколько слов о вас…"
              style={{ resize: 'none', width: '100%', fontFamily: 'inherit' }}
            />
          </div>

          {authError && (
            <div className="auth-error">{authError}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-cta"
            style={{ marginTop: 0, padding: '10px 14px', fontSize: 13 }}
          >
            <span>Сохранить</span>
          </button>
        </form>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Внешний вид</div>

        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <span className="settings-row-label">Тема</span>
          <div className="theme-chips">
            {THEMES.map((theme) => (
              <button
                key={theme}
                type="button"
                className={`theme-chip${currentTheme === theme ? ' on' : ''}`}
                onClick={() => handleTheme(theme)}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginTop: 12 }}>
          <span className="settings-row-label">Акцент</span>
          <div className="accent-chips">
            {ACCENTS.map((color) => (
              <button
                key={color}
                type="button"
                className={`accent-chip${currentAccent === color ? ' on' : ''}`}
                style={{ background: color }}
                onClick={() => handleAccent(color)}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Уведомления</div>
        <div className="settings-toggle-row">
          <span className="settings-row-label">Звук сообщений</span>
          <button
            type="button"
            className={`settings-toggle${soundEnabled ? ' on' : ''}`}
            onClick={toggleSound}
            aria-label="Звук сообщений"
          >
            <i />
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Аккаунт</div>
        <div className="fld" style={{ marginBottom: 14 }}>
          <span className="fld-lbl">Email</span>
          <input
            type="email"
            value={user.email}
            readOnly
            style={{ opacity: 0.6, cursor: 'default' }}
          />
        </div>
        <button
          type="button"
          className="danger-btn"
          onClick={onLogout}
        >
          Выйти
        </button>
      </div>
    </div>
  );
};
