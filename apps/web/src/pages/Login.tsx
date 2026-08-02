import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  mono?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <label className={`fld${focus ? ' focus' : ''}${mono ? ' mono' : ''}`}>
      <span className="fld-lbl">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />
      <span className="fld-rule" />
    </label>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.authError);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      // Store state renders the backend error.
    }
  };

  return (
    <div className="auth">
      {/* left — manifesto */}
      <aside className="auth-left">
        <div className="auth-mark">
          <span className="auth-mark-glyph">◐</span>
          <span className="auth-mark-name">CHAT<i>0</i>PISUN</span>
        </div>

        <div className="auth-headline">
          <div className="ah-line ah-1">писать—</div>
          <div className="ah-line ah-2">это</div>
          <div className="ah-line ah-3"><span className="ah-accent">существовать</span></div>
          <div className="ah-line ah-4">вместе</div>
        </div>

        <ul className="auth-feats">
          <li><span className="bullet" />сообщения в реальном времени через socket — задержка менее 80&nbsp;мс</li>
          <li><span className="bullet" />сквозная JWT-сессия без сторонних трекеров и аналитики</li>
          <li><span className="bullet" />отметки о прочтении, индикатор печати, статус «в&nbsp;сети»</li>
          <li><span className="bullet" />прямые чаты и группы, медиа и файлы в деталях</li>
        </ul>

        <div className="auth-foot">
          <span className="mono">v 0.1.0 · build 14052</span>
        </div>
      </aside>

      {/* right — form */}
      <main className="auth-right">
        <div className="auth-switch" data-mode="login">
          <span className="switch-pill" />
          <button className="on" type="button">Вход</button>
          <button type="button" onClick={() => navigate('/register')}>Регистрация</button>
        </div>

        <form className={`auth-form${shake ? ' shake' : ''}`} onSubmit={handleLogin}>
          <Field label="Электронная почта" type="email" value={email} onChange={setEmail} placeholder="you@chat0pisun.app" />
          <Field label="Пароль" type="password" value={password} onChange={setPassword} placeholder="••••••••••" />

          {error ? <div className="auth-error">{error}</div> : null}

          <div className="auth-meta">
            <label className="auth-check">
              <input type="checkbox" defaultChecked />
              <span />
              <em>запомнить устройство</em>
            </label>
            <a href="#">забыли пароль?</a>
          </div>

          <button type="submit" className="auth-cta" disabled={isSubmitting}>
            <span>{isSubmitting ? 'соединение…' : 'войти в эфир'}</span>
            <i>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </i>
          </button>

          <div className="auth-or"><span>или продолжить через</span></div>
          <div className="auth-oauth">
            <button type="button">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="#EA4335" d="M12 5.04c1.7 0 3.22.59 4.42 1.74l3.3-3.3C17.7 1.55 15.05.4 12 .4 7.4.4 3.4 3.04 1.45 6.9l3.84 2.99C6.22 6.97 8.86 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45c-.28 1.5-1.12 2.77-2.4 3.62l3.71 2.88c2.17-2 3.74-4.95 3.74-8.69z"/>
                <path fill="#FBBC05" d="M5.3 14.32a7.2 7.2 0 0 1-.38-2.32c0-.8.14-1.58.38-2.32L1.45 6.7A11.6 11.6 0 0 0 .2 12c0 1.88.45 3.66 1.25 5.3l3.85-2.98z"/>
                <path fill="#34A853" d="M12 23.6c3.24 0 5.96-1.07 7.95-2.9l-3.71-2.88c-1.03.7-2.35 1.1-4.24 1.1-3.14 0-5.78-1.93-6.71-4.55L1.45 17.3C3.4 21.16 7.4 23.6 12 23.6z"/>
              </svg>
              <span>Google</span>
            </button>
            <button type="button">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M17.05 12.54c-.02-2.4 1.96-3.56 2.05-3.62-1.12-1.64-2.86-1.86-3.48-1.89-1.48-.15-2.89.87-3.64.87-.76 0-1.92-.85-3.16-.83-1.62.03-3.13.95-3.97 2.4-1.7 2.94-.43 7.3 1.22 9.7.8 1.17 1.76 2.49 3.01 2.44 1.21-.05 1.67-.78 3.13-.78 1.46 0 1.87.78 3.15.76 1.3-.02 2.12-1.19 2.92-2.37.92-1.36 1.3-2.68 1.32-2.75-.03-.01-2.53-.97-2.55-3.85zM14.6 5.3c.67-.81 1.12-1.94 1-3.06-.97.04-2.14.65-2.83 1.45-.62.71-1.16 1.85-1.02 2.95 1.08.08 2.18-.55 2.85-1.34z"/>
              </svg>
              <span>Apple</span>
            </button>
            <button type="button">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <circle cx="12" cy="12" r="12" fill="#229ED9"/>
                <path fill="#fff" d="M5.5 11.7l11.6-4.5c.54-.2 1.01.13.84.95l-1.97 9.3c-.14.66-.54.83-1.1.52l-3.04-2.24-1.47 1.41c-.16.16-.3.3-.62.3l.22-3.13 5.7-5.16c.25-.22-.05-.34-.39-.13L8.27 12.9 5.24 11.95c-.66-.21-.67-.66.26-.97z"/>
              </svg>
              <span>Telegram</span>
            </button>
          </div>
        </form>

        <div className="auth-switch-link">
          <span>Нет аккаунта?</span>
          <button type="button" onClick={() => navigate('/register')}>Создать</button>
        </div>
      </main>

      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grain" />
    </div>
  );
}
