import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { User, Mail, Shield, ShieldCheck, RefreshCw, AlertTriangle, KeyRound, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { currentUser, userProfile, wallet, updateLocalWallet } = useAuth();

  const [resetting, setResetting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleAccountReset = async () => {
    if (!currentUser || !wallet) return;

    const confirmReset = window.confirm(
      'Are you sure you want to reset your account? This will permanently close all open trades, delete all closed trade history, and reset your wallet balance back to $10,000.00.'
    );

    if (!confirmReset) return;

    try {
      setResetting(true);
      setError('');
      setSuccess('');

      // 1. Delete all user's trades from Firestore
      const tradesCol = collection(db, 'trades');
      const qTrades = query(tradesCol, where('uid', '==', currentUser.uid));
      const querySnap = await getDocs(qTrades);
      
      const deletePromises = querySnap.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // 2. Reset wallet in Firestore
      const walletRef = doc(db, 'wallets', currentUser.uid);
      const freshWallet = {
        balance: 10000,
        equity: 10000,
        margin: 0,
        freeMargin: 10000,
        floatingPL: 0,
        updatedAt: Date.now(),
      };
      await updateDoc(walletRef, freshWallet);

      // 3. Update Auth Context locally
      updateLocalWallet({
        uid: currentUser.uid,
        ...freshWallet,
      });

      setSuccess('Your sandbox account has been reset back to $10,000.00! Trade history has been cleared.');
    } catch (err: any) {
      console.error(err);
      setError('Failed to reset account. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="border-b border-zinc-900 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Trader Profile</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage your proprietary sandbox settings and credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: User Details Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 text-center relative overflow-hidden">
            {/* Top gold design lines */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-2 border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-3xl font-bold mt-4 shadow-sm">
              {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'T'}
            </div>

            <h2 className="text-xl font-bold text-white mt-4 font-sans">{userProfile?.displayName || 'Active Trader'}</h2>
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mt-1">PRO-EVALUATION DESK</p>

            <div className="border-t border-zinc-900 mt-6 pt-6 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-semibold text-zinc-300 truncate">{currentUser?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-zinc-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Registered Since</p>
                  <p className="text-sm font-semibold text-zinc-300">{formatDate(userProfile?.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-zinc-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Identity Verification</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Level 1 - KYC Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Security & Reset Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              Evaluation Risk Parameters
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-zinc-400">
              <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl space-y-1">
                <p className="font-bold text-zinc-300">Default Allocation</p>
                <p className="text-xs text-zinc-500">The total virtual buying power assigned to this demo prop trading profile.</p>
                <p className="text-lg font-mono font-bold text-amber-500 pt-2">$10,000.00</p>
              </div>

              <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl space-y-1">
                <p className="font-bold text-zinc-300">Drawdown Guard Limit</p>
                <p className="text-xs text-zinc-500">The maximum loss threshold allowed before evaluation failure conditions.</p>
                <p className="text-lg font-mono font-bold text-rose-400 pt-2">$9,500.00 (-5%)</p>
              </div>
            </div>

            {success && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-sm flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Clear and Reset account section */}
            <div className="border-t border-zinc-900 pt-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-rose-500 mb-2">Danger Zone</h3>
              <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                Resetting your account will delete your complete trading history logs and reload your cash reserves back to $10,000. This action is permanent and cannot be undone. Use it to restart your evaluation journey from scratch.
              </p>

              <button
                id="reset-account-btn"
                onClick={handleAccountReset}
                disabled={resetting}
                className="px-5 py-3 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
                {resetting ? 'Resetting Account...' : 'Reset Sandbox Wallet ($10,000)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
