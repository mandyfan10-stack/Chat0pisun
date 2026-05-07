import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuthStore } from '../store/useStore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const error = useAuthStore((state) => state.authError);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await register({ email, username, displayName, password });
      navigate('/');
    } catch (error) {
      console.error('Registration failed:', error);
      // Store state renders the backend error.
    }
  };

  return (
    <div className="nextgram-bg grid min-h-screen place-items-center px-4 py-8 text-slate-100">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0f1824]/90 shadow-2xl shadow-black/40 md:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden border-r border-white/10 p-10 md:flex md:flex-col md:justify-between">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#5b9be7] text-white shadow-lg shadow-[#5b9be7]/20">
                <MessageCircle size={22} />
              </div>
              <div>
                <div className="text-2xl font-semibold tracking-[0.08em]">NEXTGRAM</div>
                <div className="text-sm text-slate-400">Telegram-inspired local MVP</div>
              </div>
            </div>
            <h1 className="max-w-sm text-4xl font-semibold leading-tight text-white">
              Create your profile and start a direct chat.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              The account is stored through the real API, with hashed passwords and refresh sessions.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#121b28]/70 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-[#7dd3fc]" />
              <div>
                <div className="h-3 w-32 rounded-full bg-white/70" />
                <div className="mt-2 h-2 w-24 rounded-full bg-white/20" />
              </div>
            </div>
            <div className="ml-auto w-56 rounded-2xl rounded-br-md bg-[#5288c1] p-3 text-sm text-white">
              Welcome to Nextgram.
            </div>
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

            <p className="text-sm font-medium text-[#7dd3fc]">New account</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Register</h2>
            <p className="mt-2 text-sm text-slate-400">Create a profile for the local messenger.</p>

            {error ? (
              <div className="mt-6 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleRegister} className="mt-7 space-y-4">
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Username</label>
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-white/10 bg-[#121b28] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#5b9be7] focus:ring-4 focus:ring-[#5b9be7]/10"
                    placeholder="alex"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Display name</label>
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-white/10 bg-[#121b28] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#5b9be7] focus:ring-4 focus:ring-[#5b9be7]/10"
                    placeholder="Alex"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
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
                {isSubmitting ? 'Creating...' : 'Create account'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-slate-400">Already registered? </span>
              <button onClick={() => navigate('/login')} className="font-medium text-[#7dd3fc] hover:text-white">
                Sign in
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
