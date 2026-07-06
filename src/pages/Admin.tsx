import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  ShieldAlert,
  Check,
  X,
  User,
  DollarSign,
  Search,
  ExternalLink,
  Users,
  Layers,
  AlertTriangle,
  Coins,
} from 'lucide-react';

interface FullDeposit {
  id: string;
  uid: string;
  email: string;
  amount: number;
  txHash: string;
  screenshot?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
}

interface AdminWallet {
  uid: string;
  balance: number;
  equity: number;
}

export default function Admin() {
  const { userProfile } = useAuth();

  const [pendingDeposits, setPendingDeposits] = useState<FullDeposit[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedUserWallet, setSelectedUserWallet] = useState<AdminWallet | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [customBalance, setCustomBalance] = useState('');
  
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [updatingWallet, setUpdatingWallet] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Protect Admin Route visually (Auth guard should block routing in Router, but visual protection is excellent)
  const isAdmin = userProfile?.isAdmin === true;

  // 1. Fetch pending deposits for admin approval
  useEffect(() => {
    if (!isAdmin) return;

    const depositsCol = collection(db, 'deposits');
    const qPending = query(depositsCol, where('status', '==', 'pending'));

    const unsubPending = onSnapshot(qPending, (snap) => {
      const pending: FullDeposit[] = [];
      snap.forEach((doc) => {
        pending.push({ id: doc.id, ...doc.data() } as FullDeposit);
      });
      pending.sort((a, b) => b.createdAt - a.createdAt);
      setPendingDeposits(pending);
      setLoadingDeposits(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'deposits');
    });

    return () => unsubPending();
  }, [isAdmin]);

  // 2. Fetch list of users for manual wallet updates
  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      try {
        const usersCol = collection(db, 'users');
        let snap;
        try {
          snap = await getDocs(usersCol);
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, 'users');
          return;
        }
        const usersList: AdminUser[] = [];
        snap.forEach((doc) => {
          usersList.push(doc.data() as AdminUser);
        });
        setAllUsers(usersList);
      } catch (err) {
        console.error('Error fetching admin users:', err);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  // Handle selected user wallet lookups
  const handleSelectUser = async (user: AdminUser) => {
    setSelectedUser(user);
    setCustomBalance('');
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const walletRef = doc(db, 'wallets', user.uid);
      let walletSnap;
      try {
        walletSnap = await getDoc(walletRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `wallets/${user.uid}`);
        return;
      }
      if (walletSnap.exists()) {
        const data = walletSnap.data();
        setSelectedUserWallet({
          uid: user.uid,
          balance: data.balance || 0,
          equity: data.equity || 0,
        });
        setCustomBalance(data.balance.toString());
      } else {
        setSelectedUserWallet(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle manual wallet balance adjust
  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !customBalance) return;

    try {
      setUpdatingWallet(true);
      setErrorMsg('');
      setSuccessMsg('');

      const newBalance = parseFloat(customBalance);
      if (isNaN(newBalance) || newBalance < 0) {
        throw new Error('Please enter a valid balance amount');
      }

      const walletRef = doc(db, 'wallets', selectedUser.uid);
      let walletSnap;
      try {
        walletSnap = await getDoc(walletRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `wallets/${selectedUser.uid}`);
        return;
      }

      if (walletSnap.exists()) {
        const currentData = walletSnap.data();
        const balanceDiff = newBalance - currentData.balance;
        const newEquity = currentData.equity + balanceDiff;
        const newFreeMargin = currentData.freeMargin + balanceDiff;

        try {
          await updateDoc(walletRef, {
            balance: newBalance,
            equity: newEquity,
            freeMargin: newFreeMargin,
            updatedAt: Date.now(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `wallets/${selectedUser.uid}`);
        }
      } else {
        // Create wallet if it doesn't exist
        try {
          await updateDoc(walletRef, {
            balance: newBalance,
            equity: newBalance,
            margin: 0,
            freeMargin: newBalance,
            floatingPL: 0,
            updatedAt: Date.now(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `wallets/${selectedUser.uid}`);
        }
      }

      setSuccessMsg(`Successfully updated balance of user ${selectedUser.email} to $${newBalance.toLocaleString()}`);
      setSelectedUserWallet({
        uid: selectedUser.uid,
        balance: newBalance,
        equity: selectedUserWallet ? selectedUserWallet.equity + (newBalance - selectedUserWallet.balance) : newBalance,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update balance');
    } finally {
      setUpdatingWallet(false);
    }
  };

  // Approve pending USDT deposit
  const handleApproveDeposit = async (deposit: FullDeposit) => {
    try {
      setActioningId(deposit.id);
      setErrorMsg('');
      setSuccessMsg('');

      // 1. Update deposit claim status
      const depRef = doc(db, 'deposits', deposit.id);
      try {
        await updateDoc(depRef, {
          status: 'approved',
          updatedAt: Date.now(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `deposits/${deposit.id}`);
      }

      // 2. Fetch and fund user wallet
      const walletRef = doc(db, 'wallets', deposit.uid);
      let walletSnap;
      try {
        walletSnap = await getDoc(walletRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `wallets/${deposit.uid}`);
        return;
      }

      if (walletSnap.exists()) {
        const currentData = walletSnap.data();
        const newBalance = parseFloat((currentData.balance + deposit.amount).toFixed(2));
        const newEquity = parseFloat((currentData.equity + deposit.amount).toFixed(2));
        const newFreeMargin = parseFloat((currentData.freeMargin + deposit.amount).toFixed(2));

        try {
          await updateDoc(walletRef, {
            balance: newBalance,
            equity: newEquity,
            freeMargin: newFreeMargin,
            updatedAt: Date.now(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `wallets/${deposit.uid}`);
        }
      } else {
        // Create new wallet funded
        try {
          await updateDoc(walletRef, {
            balance: deposit.amount,
            equity: deposit.amount,
            margin: 0,
            freeMargin: deposit.amount,
            floatingPL: 0,
            updatedAt: Date.now(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `wallets/${deposit.uid}`);
        }
      }

      setSuccessMsg(`Approved deposit of $${deposit.amount.toLocaleString()} for user ${deposit.email}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve deposit');
    } finally {
      setActioningId(null);
    }
  };

  // Reject pending USDT deposit
  const handleRejectDeposit = async (depositId: string) => {
    try {
      setActioningId(depositId);
      setErrorMsg('');
      setSuccessMsg('');

      const depRef = doc(db, 'deposits', depositId);
      try {
        await updateDoc(depRef, {
          status: 'rejected',
          updatedAt: Date.now(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `deposits/${depositId}`);
      }

      setSuccessMsg('Deposit claim marked as rejected successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject deposit');
    } finally {
      setActioningId(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  // Filter user lists
  const filteredUsers = allUsers.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(q) ||
      (user.displayName && user.displayName.toLowerCase().includes(q))
    );
  });

  if (!isAdmin) {
    return (
      <div className="p-10 text-center bg-zinc-950 border border-zinc-900 rounded-2xl animate-fade-in max-w-lg mx-auto mt-16">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white font-sans">Access Denied</h2>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
          You do not possess the administrative credentials required to view this interface. If you are an auditor, sign in using your corporate admin account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="border-b border-zinc-900 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Corporate Admin Panel</h1>
        <p className="text-sm text-zinc-400 mt-1">Review pending deposit vouchers and manually audit user ledger balances.</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-sm flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Admin Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Pending deposits */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-4 uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              Pending Deposits Claims ({pendingDeposits.length})
            </h2>

            {loadingDeposits ? (
              <p className="text-sm text-zinc-500 p-8 text-center">Loading deposit database...</p>
            ) : pendingDeposits.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-zinc-900 rounded-xl">
                <Users className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
                <p className="text-sm font-semibold text-zinc-300">All caught up!</p>
                <p className="text-xs text-zinc-500 mt-1">There are no pending USDT TRC20 claims awaiting validation.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingDeposits.map((dep) => (
                  <div key={dep.id} className="p-5 bg-zinc-900/40 border border-zinc-900 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <p className="text-xs text-zinc-500 font-semibold">USER ACCOUNT</p>
                        <p className="text-sm font-bold text-zinc-200 mt-0.5">{dep.email}</p>
                        <p className="text-xs text-zinc-400 font-mono mt-1 break-all" title={dep.txHash}>
                          TXID: <span className="text-zinc-300">{dep.txHash}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs text-zinc-500 font-semibold">AMOUNT CLAIMED</p>
                        <p className="text-lg font-mono font-extrabold text-amber-400 mt-0.5">{formatCurrency(dep.amount)}</p>
                      </div>
                    </div>

                    {/* Screenshot attachment preview */}
                    {dep.screenshot && (
                      <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">VALIDATION PROOF ATTACHMENT</p>
                        <a href={dep.screenshot} target="_blank" rel="noreferrer" className="inline-block group relative rounded overflow-hidden">
                          <img
                            src={dep.screenshot}
                            alt="transaction screenshot"
                            className="max-h-36 object-contain border border-zinc-900 rounded bg-black hover:opacity-85 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-white transition-opacity gap-1">
                            <ExternalLink className="w-3.5 h-3.5" /> Open Full-size Image
                          </div>
                        </a>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-end gap-3.5 border-t border-zinc-850 pt-4">
                      <button
                        id={`reject-${dep.id}`}
                        disabled={actioningId !== null}
                        onClick={() => handleRejectDeposit(dep.id)}
                        className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <X className="w-4 h-4" /> Reject Voucher
                      </button>

                      <button
                        id={`approve-${dep.id}`}
                        disabled={actioningId !== null}
                        onClick={() => handleApproveDeposit(dep)}
                        className="px-4 py-2 bg-[#D4AF37] hover:bg-[#F9E29B] text-[#050505] font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-[0_2px_10px_rgba(212,175,55,0.1)] cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> Approve and Fund
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Manual User Wallet Adjuster */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 flex flex-col h-[600px]">
            <h2 className="text-base font-bold text-white mb-3 uppercase tracking-wider text-zinc-400">Manual Ledger Adjuster</h2>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                id="admin-search-users"
                type="text"
                placeholder="Search user email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-850 rounded-xl text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-amber-550"
              />
            </div>

            {/* List of filtered users */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 border-b border-zinc-900 pb-4">
              {filteredUsers.length === 0 ? (
                <p className="text-xs text-zinc-600 text-center p-6">No users match your query.</p>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.uid}
                    id={`admin-select-user-${user.uid}`}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center gap-3 ${
                      selectedUser?.uid === user.uid
                        ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border-amber-500/40 text-white'
                        : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-400 shrink-0 uppercase">
                      {user.displayName ? user.displayName.charAt(0) : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-200 truncate">{user.displayName || 'Unnamed Trader'}</p>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{user.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Update Balance Action Form */}
            <div className="pt-4 shrink-0">
              {selectedUser ? (
                <form onSubmit={handleUpdateBalance} className="space-y-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">AUDITING ACCOUNT</p>
                    <p className="text-xs font-bold text-zinc-200 truncate">{selectedUser.email}</p>
                    {selectedUserWallet && (
                      <p className="text-[11px] text-zinc-500 font-semibold font-mono mt-0.5">
                        Current Balance: {formatCurrency(selectedUserWallet.balance)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Adjusted Account Balance (USD)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        id="admin-balance-input"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="10,000.00"
                        value={customBalance}
                        onChange={(e) => setCustomBalance(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-550"
                        disabled={updatingWallet}
                        required
                      />
                    </div>
                  </div>

                  <button
                    id="admin-update-balance-btn"
                    type="submit"
                    disabled={updatingWallet}
                    className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#F9E29B] text-[#050505] font-extrabold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                  >
                    {updatingWallet ? 'Updating Balance...' : 'Overhaul Ledger Balance'}
                  </button>
                </form>
              ) : (
                <div className="text-center p-6 text-zinc-600 text-xs">
                  Select a registered trader from the list above to overwrite their sandbox balance.
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
