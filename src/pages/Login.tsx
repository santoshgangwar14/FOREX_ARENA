import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Coins, ArrowRight, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { logIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);

      await logIn(email.trim(), password);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);

      setError(
        err?.message || 'Failed to sign in. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle gold glowing gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 relative"
        id="login-card"
      >
        {/* Gold Border Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-t-2xl" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-400 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Coins className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
              GoldxArena
            </span>
          </h1>

          <p className="text-sm text-zinc-400 mt-2">
            The premium trading terminal
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2"
            >
              Email Address
            </label>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all duration-200"
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="login-password"
                className="text-xs font-semibold text-zinc-300 uppercase tracking-wider"
              >
                Password
              </label>

              <Link
                to="/forgot-password"
                className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />

              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all duration-200"
                disabled={loading}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#F9E29B] text-[#050505] font-extrabold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.15)] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}

            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Register */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center text-sm text-zinc-400">
          New to GoldxArena?{' '}
          <Link
            to="/register"
            className="font-medium text-amber-400 hover:text-amber-300 transition-colors"
          >
            Create an account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}