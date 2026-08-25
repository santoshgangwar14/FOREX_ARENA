import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, getFirebaseUserMessage } from '../context/AuthContext';
import { Mail, ArrowLeft, CheckCircle, AlertTriangle, Coins } from 'lucide-react';
import { motion } from 'motion/react';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }

    try {
      setError('');
      setSuccess(false);
      setLoading(true);
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      setError(getFirebaseUserMessage(err, 'We could not process your request. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 relative" id="forgot-password-card">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-t-2xl" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-400 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.15)]"><Coins className="w-6 h-6" /></div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Reset Password</h1>
          <p className="text-sm text-zinc-400 mt-2">Reset your ForexArena account password</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" /><span>{error}</span></div>}

        {success ? (
          <div className="space-y-6 text-center">
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-sm flex items-start gap-3 text-left"><CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /><div><p className="font-semibold">Reset Email Sent</p><p className="mt-1 text-zinc-300">Please check your inbox at <strong>{email}</strong> for instructions to reset your password.</p></div></div>
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"><ArrowLeft className="w-4 h-4" />Back to Sign In</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" /><input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className="w-full pl-11 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all duration-200" disabled={loading} autoComplete="email" required /></div>
            </div>
            <button id="reset-submit-btn" type="submit" disabled={loading} className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#F9E29B] text-[#050505] font-extrabold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.15)] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] cursor-pointer">{loading ? 'Sending Request...' : 'Send Reset Link'}</button>
            <div className="text-center"><Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-amber-400 transition-colors mt-2"><ArrowLeft className="w-4 h-4" />Back to Sign In</Link></div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
