import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { ShieldAlert, Check, X, Search, Users, Coins, WalletCards, ShieldCheck, AlertTriangle } from 'lucide-react';

interface FullDeposit { id: string; uid: string; email: string; amount: number; txHash: string; screenshot?: string; status: 'pending' | 'approved' | 'rejected'; createdAt: number; }
interface AdminUser { uid: string; email: string; displayName?: string; }
interface AdminWallet { uid: string; balance: number; equity: number; freeMargin: number; }
interface KYCRecord { uid: string; legalName: string; dateOfBirth: string; country: string; address: string; documentType: string; documentLast4: string; status: 'not_submitted' | 'pending' | 'approved' | 'rejected'; submittedAt?: number; rejectionReason?: string; updatedAt: number; }

const money = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0);

export default function Admin() {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.isAdmin === true;
  const [pendingDeposits, setPendingDeposits] = useState<FullDeposit[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<AdminWallet | null>(null);
  const [selectedKyc, setSelectedKyc] = useState<KYCRecord | null>(null);
  const [search, setSearch] = useState('');
  const [balanceInput, setBalanceInput] = useState('');
  const [kycReason, setKycReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(query(collection(db, 'deposits'), where('status', '==', 'pending')), snap => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as FullDeposit));
      rows.sort((a, b) => b.createdAt - a.createdAt);
      setPendingDeposits(rows);
    }, err => handleFirestoreError(err, OperationType.LIST, 'deposits'));
    return unsub;
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        setAllUsers(usersSnap.docs.map(d => d.data() as AdminUser));
        const kycSnap = await getDocs(query(collection(db, 'kyc'), where('status', '==', 'pending')));
        setKycRecords(kycSnap.docs.map(d => d.data() as KYCRecord));
      } catch (err) {
        console.error(err);
        setError('Unable to load admin data.');
      }
    };
    load();
  }, [isAdmin]);

  const refreshKyc = async () => {
    const snap = await getDocs(query(collection(db, 'kyc'), where('status', '==', 'pending')));
    setKycRecords(snap.docs.map(d => d.data() as KYCRecord));
  };

  const selectUser = async (user: AdminUser) => {
    setSelectedUser(user);
    setSelectedWallet(null);
    setBalanceInput('');
    setMessage('');
    setError('');
    try {
      const snap = await getDoc(doc(db, 'wallets', user.uid));
      if (snap.exists()) {
        const d = snap.data();
        const w = { uid: user.uid, balance: d.balance || 0, equity: d.equity || 0, freeMargin: d.freeMargin || 0 };
        setSelectedWallet(w);
        setBalanceInput(String(w.balance));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `wallets/${user.uid}`);
    }
  };

  const updateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const newBalance = Number(balanceInput);
    if (!Number.isFinite(newBalance) || newBalance < 0) {
      setError('Enter a valid non-negative balance.');
      return;
    }
    setBusy(true); setMessage(''); setError('');
    try {
      const ref = doc(db, 'wallets', selectedUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        const current = Number(d.balance || 0);
        const diff = Number((newBalance - current).toFixed(2));
        await updateDoc(ref, {
          balance: newBalance,
          equity: Number((Number(d.equity || 0) + diff).toFixed(2)),
          freeMargin: Number((Number(d.freeMargin || 0) + diff).toFixed(2)),
          updatedAt: Date.now(),
        });
      } else {
        await setDoc(ref, { uid: selectedUser.uid, balance: newBalance, equity: newBalance, margin: 0, freeMargin: newBalance, floatingPL: 0, updatedAt: Date.now() });
      }
      const updated = await getDoc(ref);
      if (updated.exists()) {
        const d = updated.data();
        setSelectedWallet({ uid: selectedUser.uid, balance: d.balance || 0, equity: d.equity || 0, freeMargin: d.freeMargin || 0 });
      }
      setMessage(`Wallet balance updated for ${selectedUser.email}.`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to update wallet.');
    } finally { setBusy(false); }
  };

  const approveDeposit = async (deposit: FullDeposit) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const walletRef = doc(db, 'wallets', deposit.uid);
      const walletSnap = await getDoc(walletRef);
      if (walletSnap.exists()) {
        const d = walletSnap.data();
        await updateDoc(walletRef, {
          balance: Number((Number(d.balance || 0) + deposit.amount).toFixed(2)),
          equity: Number((Number(d.equity || 0) + deposit.amount).toFixed(2)),
          freeMargin: Number((Number(d.freeMargin || 0) + deposit.amount).toFixed(2)),
          updatedAt: Date.now(),
        });
      } else {
        await setDoc(walletRef, { uid: deposit.uid, balance: deposit.amount, equity: deposit.amount, margin: 0, freeMargin: deposit.amount, floatingPL: 0, updatedAt: Date.now() });
      }
      await updateDoc(doc(db, 'deposits', deposit.id), { status: 'approved', updatedAt: Date.now() });
      setMessage(`Approved ${money(deposit.amount)} deposit for ${deposit.email}.`);
    } catch (err: any) {
      console.error(err); setError(err?.message || 'Failed to approve deposit.');
    } finally { setBusy(false); }
  };

  const rejectDeposit = async (deposit: FullDeposit) => {
    setBusy(true); setError(''); setMessage('');
    try {
      await updateDoc(doc(db, 'deposits', deposit.id), { status: 'rejected', updatedAt: Date.now() });
      setMessage(`Rejected deposit claim for ${deposit.email}.`);
    } catch (err: any) { setError(err?.message || 'Failed to reject deposit.'); }
    finally { setBusy(false); }
  };

  const reviewKyc = async (status: 'approved' | 'rejected') => {
    if (!selectedKyc) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await updateDoc(doc(db, 'kyc', selectedKyc.uid), { status, rejectionReason: status === 'rejected' ? kycReason.trim() : '', reviewedAt: Date.now(), updatedAt: Date.now() });
      setSelectedKyc(null); setKycReason(''); await refreshKyc();
      setMessage(`KYC marked ${status}.`);
    } catch (err: any) { setError(err?.message || 'Failed to review KYC.'); }
    finally { setBusy(false); }
  };

  if (!isAdmin) return <div className="p-10 text-center bg-zinc-950 border border-zinc-900 rounded-2xl max-w-lg mx-auto mt-16"><ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" /><h2 className="text-xl font-bold text-white">Access Denied</h2><p className="text-sm text-zinc-400 mt-2">Administrative credentials are required.</p></div>;

  const filteredUsers = allUsers.filter(u => `${u.email} ${u.displayName || ''}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-zinc-900 pb-6"><h1 className="text-3xl font-bold text-white">Corporate Admin Panel</h1><p className="text-sm text-zinc-400 mt-1">Manage wallet balances, deposit approvals and KYC reviews.</p></div>
      {message && <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-sm flex gap-3"><Check className="w-5 h-5 text-emerald-400" />{message}</div>}
      {error && <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm flex gap-3"><AlertTriangle className="w-5 h-5 text-red-400" />{error}</div>}

      <section className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
        <h2 className="text-base font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 mb-5"><WalletCards className="w-5 h-5 text-amber-500" /> User Wallet Balance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="relative mb-3"><Search className="absolute left-3 top-3 w-4 h-4 text-zinc-600" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user by email or name" className="w-full pl-9 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white outline-none focus:border-amber-500" /></div>
            <div className="max-h-64 overflow-y-auto space-y-2">{filteredUsers.map(u => <button key={u.uid} onClick={() => selectUser(u)} className={`w-full text-left p-3 rounded-xl border ${selectedUser?.uid === u.uid ? 'border-amber-500/50 bg-amber-500/5' : 'border-zinc-900 bg-zinc-900/30'} hover:border-zinc-700`}><p className="text-sm font-semibold text-white">{u.email}</p><p className="text-xs text-zinc-500">{u.displayName || 'Trader'} · {u.uid.slice(0, 8)}</p></button>)}</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-5">
            {!selectedUser ? <div className="h-full min-h-40 flex items-center justify-center text-sm text-zinc-600">Select a user to manage wallet.</div> : <form onSubmit={updateBalance} className="space-y-4"><div><p className="text-xs text-zinc-500 uppercase tracking-wider">Selected Account</p><p className="text-sm font-bold text-white mt-1">{selectedUser.email}</p></div><div className="grid grid-cols-2 gap-3"><div className="p-3 rounded-lg bg-zinc-950"><p className="text-[10px] text-zinc-600 uppercase">Current Balance</p><p className="font-mono text-lg text-white mt-1">{money(selectedWallet?.balance || 0)}</p></div><div className="p-3 rounded-lg bg-zinc-950"><p className="text-[10px] text-zinc-600 uppercase">Equity</p><p className="font-mono text-lg text-amber-400 mt-1">{money(selectedWallet?.equity || 0)}</p></div></div><label className="block"><span className="text-xs text-zinc-500">New balance (USD)</span><input type="number" min="0" step="0.01" value={balanceInput} onChange={e => setBalanceInput(e.target.value)} className="mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-amber-500" /></label><button disabled={busy} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold disabled:opacity-50">{busy ? 'Updating...' : 'Update Wallet Balance'}</button></form>}
          </div>
        </div>
      </section>

      <section className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
        <h2 className="text-base font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 mb-5"><Coins className="w-5 h-5 text-amber-500" /> Pending Deposits ({pendingDeposits.length})</h2>
        <div className="space-y-3">{pendingDeposits.length === 0 ? <p className="text-sm text-zinc-600 text-center py-8">No pending deposits.</p> : pendingDeposits.map(d => <div key={d.id} className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4"><div><p className="text-sm font-bold text-white">{d.email}</p><p className="text-xs text-zinc-500 mt-1">{money(d.amount)} · TXID: {d.txHash}</p></div><div className="flex gap-2"><button disabled={busy} onClick={() => approveDeposit(d)} className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold flex items-center gap-1"><Check className="w-4 h-4" />Approve</button><button disabled={busy} onClick={() => rejectDeposit(d)} className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold flex items-center gap-1"><X className="w-4 h-4" />Reject</button></div></div>)}</div>
      </section>

      <section className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
        <h2 className="text-base font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 mb-5"><ShieldCheck className="w-5 h-5 text-amber-500" /> KYC Review Queue ({kycRecords.length})</h2>
        <div className="space-y-3">{kycRecords.length === 0 ? <p className="text-sm text-zinc-600 text-center py-8">No KYC applications waiting for review.</p> : kycRecords.map(k => <button key={k.uid} onClick={() => setSelectedKyc(k)} className="w-full text-left p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 hover:border-zinc-700"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-white">{k.legalName}</p><p className="text-xs text-zinc-500 mt-1">{k.documentType} •••• {k.documentLast4} · {k.country}</p></div><span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Pending</span></div></button>)}</div>
      </section>

      {selectedKyc && <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-start mb-6"><div><p className="text-xs text-zinc-500 uppercase">KYC Application</p><h3 className="text-2xl font-bold text-white mt-1">{selectedKyc.legalName}</h3></div><button onClick={() => setSelectedKyc(null)}><X className="w-5 h-5 text-zinc-500" /></button></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"><div><p className="text-xs text-zinc-600">Date of Birth</p><p className="text-zinc-200 mt-1">{selectedKyc.dateOfBirth}</p></div><div><p className="text-xs text-zinc-600">Country</p><p className="text-zinc-200 mt-1">{selectedKyc.country}</p></div><div><p className="text-xs text-zinc-600">Document</p><p className="text-zinc-200 mt-1">{selectedKyc.documentType} •••• {selectedKyc.documentLast4}</p></div><div className="sm:col-span-2"><p className="text-xs text-zinc-600">Address</p><p className="text-zinc-200 mt-1 whitespace-pre-wrap">{selectedKyc.address}</p></div></div><textarea value={kycReason} onChange={e => setKycReason(e.target.value)} placeholder="Rejection reason (required when rejecting)" className="mt-6 w-full min-h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none" /><div className="flex justify-end gap-3 mt-4"><button disabled={busy || !kycReason.trim()} onClick={() => reviewKyc('rejected')} className="px-5 py-3 rounded-xl border border-red-500/30 text-red-300 font-bold text-sm disabled:opacity-40">Reject</button><button disabled={busy} onClick={() => reviewKyc('approved')} className="px-5 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm disabled:opacity-50">Approve KYC</button></div></div></div>}
    </div>
  );
}
