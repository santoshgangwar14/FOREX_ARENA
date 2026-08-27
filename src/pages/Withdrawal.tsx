import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';

type WithdrawalStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

interface Withdrawal {
  id: string;
  uid: string;
  amount: number;
  method: 'USDT TRC20';
  walletAddress: string;
  status: WithdrawalStatus;
  createdAt: number;
  updatedAt: number;
  adminNote?: string;
}

export default function Withdrawal() {
  const { currentUser, wallet } = useAuth();

  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const availableBalance = Math.max(
    0,
    Number(wallet?.balance || 0)
  );

  const numericAmount = Number(amount || 0);

  const formError = useMemo(() => {
    if (!amount) return '';
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return 'Enter a valid withdrawal amount.';
    }
    if (numericAmount < 10) {
      return 'Minimum withdrawal amount is $10.';
    }
    if (numericAmount > availableBalance) {
      return 'Withdrawal amount cannot exceed your available balance.';
    }
    return '';
  }, [amount, numericAmount, availableBalance]);

  useEffect(() => {
    if (!currentUser) {
      setWithdrawals([]);
      return;
    }

    const q = query(
      collection(db, 'withdrawals'),
      where('uid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snap) => {
        const rows: Withdrawal[] = [];
        snap.forEach((item) => {
          rows.push({
            id: item.id,
            ...item.data(),
          } as Withdrawal);
        });
        setWithdrawals(rows);
      },
      (err) => {
        console.error('Withdrawal history failed:', err);
      }
    );
  }, [currentUser]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const submitWithdrawal = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!currentUser) return;

    setError('');
    setSuccess('');

    if (formError) {
      setError(formError);
      return;
    }

    const address = walletAddress.trim();

    if (!address) {
      setError('Enter your USDT TRC20 wallet address.');
      return;
    }

    if (address.length < 20) {
      setError('Please enter a valid USDT TRC20 wallet address.');
      return;
    }

    const hasPendingRequest = withdrawals.some(
      (item) => item.status === 'pending'
    );

    if (hasPendingRequest) {
      setError(
        'You already have a withdrawal request under review.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const now = Date.now();

      await addDoc(collection(db, 'withdrawals'), {
        uid: currentUser.uid,
        email: currentUser.email || '',
        amount: Number(numericAmount.toFixed(2)),
        method: 'USDT TRC20',
        walletAddress: address,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });

      setAmount('');
      setWalletAddress('');
      setSuccess(
        'Withdrawal request submitted successfully. An administrator will review it shortly.'
      );
    } catch (err: any) {
      console.error('Withdrawal request failed:', err);

      if (err?.code === 'permission-denied') {
        setError(
          'Withdrawal requests are not enabled in the current Firestore rules.'
        );
      } else {
        setError(
          err?.message ||
            'Unable to submit the withdrawal request.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-3">
          <ArrowDownToLine className="w-7 h-7 text-amber-500" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Withdrawal
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Request a withdrawal from your available account balance.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-zinc-900 bg-zinc-900/40 p-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                  Available Balance
                </p>
                <p className="text-2xl font-mono font-bold text-white mt-2">
                  {formatCurrency(availableBalance)}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-900/40 p-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                  Withdrawal Method
                </p>
                <p className="text-base font-bold text-amber-400 mt-2">
                  USDT TRC20
                </p>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-900/40 p-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                  Minimum Withdrawal
                </p>
                <p className="text-base font-bold text-white mt-2">
                  $10.00
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-200 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-200 text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form
              onSubmit={submitWithdrawal}
              className="space-y-5"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Withdrawal Amount
                </label>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 font-mono">
                    $
                  </span>

                  <input
                    type="number"
                    min="10"
                    max={availableBalance}
                    step="0.01"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value)
                    }
                    placeholder="500.00"
                    disabled={submitting}
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono outline-none focus:border-amber-500 disabled:opacity-60"
                  />
                </div>

                <p className="text-[11px] text-zinc-600 mt-2">
                  Maximum available: {formatCurrency(availableBalance)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  USDT TRC20 Wallet Address
                </label>

                <input
                  value={walletAddress}
                  onChange={(e) =>
                    setWalletAddress(e.target.value)
                  }
                  placeholder="Enter the destination TRC20 address"
                  disabled={submitting}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-sm outline-none focus:border-amber-500 disabled:opacity-60"
                />
              </div>

              <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-xs text-zinc-400 leading-relaxed">
                Confirm the network and destination address
                carefully. Withdrawal requests are reviewed
                before processing.
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !currentUser ||
                  availableBalance < 10
                }
                className="w-full py-4 rounded-xl bg-[#D4AF37] hover:bg-[#F9E29B] text-black font-extrabold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting
                  ? 'Submitting Request...'
                  : 'Submit Withdrawal Request'}
              </button>
            </form>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Clock3 className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-white">
                Withdrawal History
              </h2>
            </div>

            {withdrawals.length === 0 ? (
              <div className="py-12 text-center text-zinc-600 text-sm">
                No withdrawal requests yet.
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-zinc-500">
                          {formatDate(item.createdAt)}
                        </p>

                        <p className="text-lg font-mono font-bold text-white mt-1">
                          {formatCurrency(item.amount)}
                        </p>

                        <p className="text-[10px] text-zinc-600 font-mono mt-1 break-all">
                          {item.walletAddress}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase ${
                          item.status === 'approved'
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                            : item.status === 'rejected'
                            ? 'bg-rose-950/30 border-rose-500/30 text-rose-400'
                            : 'bg-amber-950/30 border-amber-500/30 text-amber-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {item.adminNote && (
                      <div className="mt-3 pt-3 border-t border-zinc-900 text-xs text-zinc-500">
                        {item.adminNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <WalletCards className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-white">
                Before you submit
              </h2>
            </div>

            <div className="space-y-3 text-xs text-zinc-500 leading-relaxed">
              <p>Make sure the wallet address belongs to you.</p>
              <p>Use the TRC20 network for this withdrawal method.</p>
              <p>Requests are reviewed by the administrator before processing.</p>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-white">
                Account checks
              </h2>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              Withdrawal approval can be subject to account verification,
              available balance, open-position settlement and administrator review.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}