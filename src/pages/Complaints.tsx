import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3 } from 'lucide-react';

type ComplaintStatus = 'open' | 'in_progress' | 'resolved';

interface Complaint {
  id: string;
  uid: string;
  email?: string;
  category: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  createdAt: number;
  updatedAt: number;
  adminReply?: string;
}

export default function Complaints() {
  const { currentUser } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [category, setCategory] = useState('Withdrawal');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'complaints'),
      where('uid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snap) => {
        setComplaints(
          snap.docs.map(
            (item) =>
              ({
                id: item.id,
                ...item.data(),
              } as Complaint)
          )
        );
      },
      (err) => {
        console.error('Complaint history failed:', err);
        setError('Unable to load your complaint history.');
      }
    );
  }, [currentUser]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) return;

    setSubmitting(true);
    setError('');
    setSent('');

    try {
      const now = Date.now();

      await addDoc(collection(db, 'complaints'), {
        uid: currentUser.uid,
        email: currentUser.email || '',
        category,
        subject: subject.trim(),
        description: description.trim(),
        status: 'open',
        createdAt: now,
        updatedAt: now,
      });

      setSubject('');
      setDescription('');
      setSent('Complaint submitted successfully.');
    } catch (err: any) {
      console.error('Complaint submit failed:', err);
      setError(
        err?.code === 'permission-denied'
          ? 'Complaint submission is not enabled in the current Firestore rules.'
          : err?.message || 'Unable to submit your complaint.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const statusMeta = (status: ComplaintStatus) => {
    if (status === 'resolved') {
      return {
        label: 'Resolved',
        cls: 'text-emerald-400 bg-emerald-950/30 border-emerald-500/20',
        Icon: CheckCircle2,
      };
    }

    if (status === 'in_progress') {
      return {
        label: 'In Progress',
        cls: 'text-blue-400 bg-blue-950/30 border-blue-500/20',
        Icon: Clock3,
      };
    }

    return {
      label: 'Open',
      cls: 'text-amber-400 bg-amber-950/30 border-amber-500/20',
      Icon: AlertTriangle,
    };
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-6xl mx-auto px-5 lg:px-8 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          Back to GoldX Arena
        </Link>

        <div className="mt-8">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#CBAA3D] font-bold">
            Client support
          </p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold">
            Raise a Complaint
          </h1>
          <p className="mt-3 text-sm text-zinc-500 max-w-2xl">
            Report an issue with your account, trading, deposit, withdrawal,
            verification or another GoldX Arena service.
          </p>
        </div>

        <div className="mt-8 grid lg:grid-cols-[.8fr_1.2fr] gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-[#0a0c0f] p-6">
            {sent && (
              <div className="mb-5 p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-emerald-200 text-sm">
                {sent}
              </div>
            )}

            {error && (
              <div className="mb-5 p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 outline-none focus:border-[#D4AF37]"
              >
                <option>Withdrawal</option>
                <option>Deposit</option>
                <option>Trading</option>
                <option>Account</option>
                <option>KYC / Verification</option>
                <option>Technical Issue</option>
                <option>Other</option>
              </select>

              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Complaint subject"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-[#D4AF37]"
              />

              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                placeholder="Describe the issue clearly. Include dates, transaction references or relevant details."
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-[#D4AF37] resize-none"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-[#D4AF37] hover:bg-[#F9E29B] text-black font-extrabold text-sm disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#0a0c0f] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-600 font-bold">
                  My complaints
                </p>
                <h2 className="mt-1 text-lg font-bold">
                  Case history
                </h2>
              </div>
              <AlertTriangle className="w-5 h-5 text-[#D4AF37]" />
            </div>

            <div className="mt-5 space-y-3">
              {complaints.length === 0 ? (
                <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-8 text-center text-sm text-zinc-600">
                  No complaints submitted yet.
                </div>
              ) : (
                complaints.map((item) => {
                  const meta = statusMeta(item.status);
                  const Icon = meta.Icon;

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                            {item.category}
                          </p>
                          <h3 className="text-sm font-bold mt-1">
                            {item.subject}
                          </h3>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${meta.cls}`}
                        >
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
                        {item.description}
                      </p>

                      {item.adminReply && (
                        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold">
                            Admin response
                          </p>
                          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                            {item.adminReply}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}