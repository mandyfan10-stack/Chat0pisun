import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <div className="bg-red-100 text-red-600 p-2 mb-4 rounded">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              className="w-full border p-2 rounded focus:outline-none focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              className="w-full border p-2 rounded focus:outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <span className="text-gray-600">Don't have an account? </span>
          <button onClick={() => navigate('/register')} className="text-blue-500 hover:underline">
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
