import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  MessageCircle,
  ShieldCheck,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function Contact() {
  const { currentUser } = useAuth();

  const [name, setName] = useState(
    currentUser?.displayName || ''
  );
  const [email, setEmail] = useState(
    currentUser?.email || ''
  );
  const [category, setCategory] = useState(
    'Account support'
  );
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    setSending(true);
    setSent(false);
    setError('');

    try {
      const now = Date.now();

      await addDoc(
        collection(db, 'contactMessages'),
        {
          uid: currentUser?.uid ?? null,
          name: name.trim(),
          email: email.trim(),
          category,
          message: message.trim(),
          status: 'open',
          createdAt: now,
          updatedAt: now,
        }
      );

      setMessage('');
      setSent(true);
    } catch (err: any) {
      console.error(
        'Contact message submission failed:',
        err
      );

      if (
        err?.code === 'permission-denied' ||
        err?.code === 'firestore/permission-denied'
      ) {
        setError(
          'Contact submission is not permitted by the current Firestore rules.'
        );
      } else {
        setError(
          err?.message ||
            'Unable to send your support request.'
        );
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-5xl mx-auto px-5 lg:px-8 py-10">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to GoldX Arena
        </Link>

        <div className="mt-8 grid lg:grid-cols-[0.8fr_1.2fr] gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-[#0a0c0f] p-7">
            <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
            </div>

            <h1 className="mt-5 text-3xl font-bold">
              Contact GoldX Arena
            </h1>

            <p className="mt-3 text-sm text-zinc-500 leading-relaxed">
              Have a question about your account, trading terminal,
              funding or verification? Send us a message and our
              support team can review it.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex gap-3">
                <Mail className="w-4 h-4 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">
                    Support email
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    support@goldxarena.com
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <ShieldCheck className="w-4 h-4 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">
                    Account security
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Never share your password or private keys.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#0a0c0f] p-7">
            {sent ? (
              <div className="min-h-[360px] flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>

                <h2 className="mt-5 text-xl font-bold">
                  Message received
                </h2>

                <p className="mt-2 text-sm text-zinc-500 max-w-md">
                  Your support request has been submitted to the
                  GoldX Arena support queue.
                </p>

                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-6 text-xs font-bold text-[#D4AF37]"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={submit}
                className="space-y-5"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#CBAA3D] font-bold">
                    Support request
                  </p>

                  <h2 className="mt-2 text-xl font-bold">
                    How can we help?
                  </h2>
                </div>

                {error && (
                  <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-200 text-xs flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <input
                  required
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-[#D4AF37]"
                />

                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Email address"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-[#D4AF37]"
                />

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 outline-none focus:border-[#D4AF37]"
                >
                  <option>Account support</option>
                  <option>Trading platform</option>
                  <option>Deposit</option>
                  <option>Withdrawal</option>
                  <option>KYC / Verification</option>
                  <option>Technical issue</option>
                  <option>Other</option>
                </select>

                <textarea
                  required
                  rows={6}
                  value={message}
                  onChange={(e) =>
                    setMessage(e.target.value)
                  }
                  placeholder="Describe your request..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-[#D4AF37] resize-none"
                />

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3.5 rounded-xl bg-[#D4AF37] hover:bg-[#F9E29B] text-black font-extrabold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}