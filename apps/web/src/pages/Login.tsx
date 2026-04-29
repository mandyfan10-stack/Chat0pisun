import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuthStore } from '../store/useStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.authError);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);
      navigate('/');
    } catch {
      // Store state renders the backend error.
    }
  };

  return (
    <div className="nextgram-bg grid min-h-screen place-items-center px-4 py-8 text-slate-100">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0f1824]/90 shadow-2xl shadow-black/40 md:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden border-r border-white/10 p-10 md:flex md:flex-col md:justify-between">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#5b9be7] text-white shadow-lg shadow-[#5b9be7]/20">
                <MessageCircle size={22} />
              </div>
              <div>
                <div className="text-2xl font-semibold tracking-[0.08em]">NEXTGRAM</div>
                <div className="text-sm text-slate-400">secure messenger MVP</div>
              </div>
            </div>
            <h1 className="max-w-sm text-4xl font-semibold leading-tight text-white">
              A dark, fast messenger for local chats.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              Auth, user search, persistent messages, and live updates are connected to the API.
            </p>
          </div>

          <div className="grid grid-cols-6 gap-3">
            {['#0E141B', '#121B28', '#243447', '#5288C1', '#7DD3FC', '#E6EDF3'].map((color) => (
              <span
                key={color}
                className="h-9 rounded-full border border-white/10"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
            ))}
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8 md:hidden">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#5b9be7] text-white">
                <MessageCircle size={24} />
              </div>
              <div className="text-2xl font-semibold tracking-[0.08em]">NEXTGRAM</div>
            </div>

            <p className="text-sm font-medium text-[#7dd3fc]">Welcome back</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Sign in</h2>
            <p className="mt-2 text-sm text-slate-400">Use your account to open the chat list.</p>

            {error ? (
              <div className="mt-6 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleLogin} className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                <input
                  type="email"
                  className="w-full rounded-2xl border border-white/10 bg-[#121b28] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#5b9be7] focus:ring-4 focus:ring-[#5b9be7]/10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  className="w-full rounded-2xl border border-white/10 bg-[#121b28] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#5b9be7] focus:ring-4 focus:ring-[#5b9be7]/10"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-[#5b9be7] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5b9be7]/20 transition hover:bg-[#6aa8ef] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-slate-400">No account? </span>
              <button onClick={() => navigate('/register')} className="font-medium text-[#7dd3fc] hover:text-white">
                Create one
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
