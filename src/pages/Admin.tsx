import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import {
  ShieldAlert,
  Check,
  X,
  Search,
  Coins,
  WalletCards,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Camera,
  ExternalLink,
  ArrowDownToLine,
  Clock3,
  CircleDollarSign,
  Headphones,
  MessageSquareWarning,
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
  updatedAt?: number;
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
  freeMargin: number;
}

type KYCStatus =
  | 'not_submitted'
  | 'pending'
  | 'approved'
  | 'rejected';

interface KYCRecord {
  uid: string;
  legalName: string;
  dateOfBirth: string;
  country: string;
  address: string;
  documentType: string;
  documentLast4: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  proofOfAddressUrl?: string;
  selfieUrl?: string;
  selfieVerification?: string;
  status: KYCStatus;
  submittedAt?: number;
  reviewedAt?: number;
  rejectionReason?: string;
  updatedAt: number;
}

type WithdrawalStatus =
  | 'pending'
  | 'payout_initiated'
  | 'paid'
  | 'rejected';

interface WithdrawalRequest {
  id: string;
  uid: string;
  email?: string;
  amount: number;
  method: 'USDT TRC20';
  walletAddress: string;
  status: WithdrawalStatus;
  createdAt: number;
  updatedAt: number;
  adminNote?: string;
  txHash?: string;
  paidAt?: number;
}


interface ContactMessage {
  id: string;
  uid?: string | null;
  name: string;
  email: string;
  category: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: number;
  updatedAt: number;
  adminReply?: string;
}

interface Complaint {
  id: string;
  uid: string;
  email?: string;
  category: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: number;
  updatedAt: number;
  adminReply?: string;
}

const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value || 0);

const dateTime = (timestamp?: number) =>
  timestamp
    ? new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export default function Admin() {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.isAdmin === true;

  const [pendingDeposits, setPendingDeposits] = useState<
    FullDeposit[]
  >([]);

  const [allUsers, setAllUsers] = useState<
    AdminUser[]
  >([]);

  const [kycRecords, setKycRecords] = useState<
    KYCRecord[]
  >([]);

  const [withdrawals, setWithdrawals] = useState<
    WithdrawalRequest[]
  >([]);

  const [contactMessages, setContactMessages] =
    useState<ContactMessage[]>([]);

  const [complaints, setComplaints] =
    useState<Complaint[]>([]);

  const [selectedUser, setSelectedUser] =
    useState<AdminUser | null>(null);

  const [selectedWallet, setSelectedWallet] =
    useState<AdminWallet | null>(null);

  const [selectedKyc, setSelectedKyc] =
    useState<KYCRecord | null>(null);

  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalRequest | null>(null);

  const [selectedContact, setSelectedContact] =
    useState<ContactMessage | null>(null);

  const [selectedComplaint, setSelectedComplaint] =
    useState<Complaint | null>(null);

  const [supportReply, setSupportReply] = useState('');

  const [search, setSearch] = useState('');
  const [balanceInput, setBalanceInput] = useState('');
  const [kycReason, setKycReason] = useState('');
  const [withdrawalNote, setWithdrawalNote] =
    useState('');
  const [withdrawalTxHash, setWithdrawalTxHash] =
    useState('');

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;

    const unsub = onSnapshot(
      query(
        collection(db, 'deposits'),
        where('status', '==', 'pending')
      ),
      (snap) => {
        const rows = snap.docs.map(
          (item) =>
            ({
              id: item.id,
              ...item.data(),
            } as FullDeposit)
        );

        rows.sort(
          (a, b) => b.createdAt - a.createdAt
        );

        setPendingDeposits(rows);
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.LIST,
          'deposits'
        )
    );

    return unsub;
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsub = onSnapshot(
      query(
        collection(db, 'withdrawals'),
        where('status', 'in', [
          'pending',
          'payout_initiated',
        ])
      ),
      (snap) => {
        const rows = snap.docs.map(
          (item) =>
            ({
              id: item.id,
              ...item.data(),
            } as WithdrawalRequest)
        );

        rows.sort(
          (a, b) => b.createdAt - a.createdAt
        );

        setWithdrawals(rows);
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.LIST,
          'withdrawals'
        )
    );

    return unsub;
  }, [isAdmin]);


  useEffect(() => {
    if (!isAdmin) return;

    const unsub = onSnapshot(
      query(
        collection(db, 'contactMessages')
      ),
      (snap) => {
        const rows = snap.docs.map(
          (item) =>
            ({
              id: item.id,
              ...item.data(),
            } as ContactMessage)
        );

        rows.sort(
          (a, b) => b.createdAt - a.createdAt
        );

        setContactMessages(rows);
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.LIST,
          'contactMessages'
        )
    );

    return unsub;
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsub = onSnapshot(
      query(
        collection(db, 'complaints')
      ),
      (snap) => {
        const rows = snap.docs.map(
          (item) =>
            ({
              id: item.id,
              ...item.data(),
            } as Complaint)
        );

        rows.sort(
          (a, b) => b.createdAt - a.createdAt
        );

        setComplaints(rows);
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.LIST,
          'complaints'
        )
    );

    return unsub;
  }, [isAdmin]);

  const loadKycQueue = async () => {
    const snap = await getDocs(
      query(
        collection(db, 'kyc'),
        where('status', '==', 'pending')
      )
    );

    const rows = snap.docs.map(
      (item) => item.data() as KYCRecord
    );

    rows.sort(
      (a, b) =>
        (b.submittedAt || 0) -
        (a.submittedAt || 0)
    );

    setKycRecords(rows);
  };

  useEffect(() => {
    if (!isAdmin) return;

    const load = async () => {
      try {
        const usersSnap = await getDocs(
          collection(db, 'users')
        );

        const users = usersSnap.docs.map(
          (item) =>
            item.data() as AdminUser
        );

        setAllUsers(users);
        await loadKycQueue();
      } catch (err) {
        console.error(err);
        setError(
          'Unable to load admin data.'
        );
      }
    };

    load();
  }, [isAdmin]);

  const refreshKyc = async () => {
    try {
      await loadKycQueue();
    } catch (err) {
      console.error(err);
      setError(
        'Unable to refresh KYC queue.'
      );
    }
  };

  const selectUser = async (
    user: AdminUser
  ) => {
    setSelectedUser(user);
    setSelectedWallet(null);
    setBalanceInput('');
    setMessage('');
    setError('');

    try {
      const snap = await getDoc(
        doc(db, 'wallets', user.uid)
      );

      if (snap.exists()) {
        const data = snap.data();

        const wallet: AdminWallet = {
          uid: user.uid,
          balance: Number(data.balance || 0),
          equity: Number(data.equity || 0),
          freeMargin: Number(
            data.freeMargin || 0
          ),
        };

        setSelectedWallet(wallet);
        setBalanceInput(
          String(wallet.balance)
        );
      }
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.GET,
        `wallets/${user.uid}`
      );
    }
  };

  const updateBalance = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!selectedUser) return;

    const newBalance =
      Number(balanceInput);

    if (
      !Number.isFinite(newBalance) ||
      newBalance < 0
    ) {
      setError(
        'Enter a valid non-negative balance.'
      );
      return;
    }

    setBusy(true);
    setMessage('');
    setError('');

    try {
      const walletRef = doc(
        db,
        'wallets',
        selectedUser.uid
      );

      const snap = await getDoc(
        walletRef
      );

      if (snap.exists()) {
        const data = snap.data();
        const current =
          Number(data.balance || 0);

        const diff = Number(
          (
            newBalance - current
          ).toFixed(2)
        );

        await updateDoc(walletRef, {
          balance: newBalance,
          equity: Number(
            (
              Number(data.equity || 0) +
              diff
            ).toFixed(2)
          ),
          freeMargin: Number(
            (
              Number(data.freeMargin || 0) +
              diff
            ).toFixed(2)
          ),
          updatedAt: Date.now(),
        });
      } else {
        await setDoc(walletRef, {
          uid: selectedUser.uid,
          balance: newBalance,
          equity: newBalance,
          margin: 0,
          freeMargin: newBalance,
          floatingPL: 0,
          updatedAt: Date.now(),
        });
      }

      const updated = await getDoc(
        walletRef
      );

      if (updated.exists()) {
        const data = updated.data();

        setSelectedWallet({
          uid: selectedUser.uid,
          balance: Number(
            data.balance || 0
          ),
          equity: Number(
            data.equity || 0
          ),
          freeMargin: Number(
            data.freeMargin || 0
          ),
        });
      }

      setMessage(
        `Wallet balance updated for ${selectedUser.email}.`
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          'Failed to update wallet.'
      );
    } finally {
      setBusy(false);
    }
  };

  const approveDeposit = async (
    deposit: FullDeposit
  ) => {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const walletRef = doc(
        db,
        'wallets',
        deposit.uid
      );

      const walletSnap =
        await getDoc(walletRef);

      if (walletSnap.exists()) {
        const data =
          walletSnap.data();

        await updateDoc(walletRef, {
          balance: Number(
            (
              Number(data.balance || 0) +
              deposit.amount
            ).toFixed(2)
          ),
          equity: Number(
            (
              Number(data.equity || 0) +
              deposit.amount
            ).toFixed(2)
          ),
          freeMargin: Number(
            (
              Number(data.freeMargin || 0) +
              deposit.amount
            ).toFixed(2)
          ),
          updatedAt: Date.now(),
        });
      } else {
        await setDoc(walletRef, {
          uid: deposit.uid,
          balance: deposit.amount,
          equity: deposit.amount,
          margin: 0,
          freeMargin: deposit.amount,
          floatingPL: 0,
          updatedAt: Date.now(),
        });
      }

      await updateDoc(
        doc(db, 'deposits', deposit.id),
        {
          status: 'approved',
          updatedAt: Date.now(),
        }
      );

      setMessage(
        `Approved ${money(
          deposit.amount
        )} deposit for ${deposit.email}.`
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          'Failed to approve deposit.'
      );
    } finally {
      setBusy(false);
    }
  };

  const rejectDeposit = async (
    deposit: FullDeposit
  ) => {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      await updateDoc(
        doc(db, 'deposits', deposit.id),
        {
          status: 'rejected',
          updatedAt: Date.now(),
        }
      );

      setMessage(
        `Rejected deposit claim for ${deposit.email}.`
      );
    } catch (err: any) {
      setError(
        err?.message ||
          'Failed to reject deposit.'
      );
    } finally {
      setBusy(false);
    }
  };

  const reviewKyc = async (
    status: 'approved' | 'rejected'
  ) => {
    if (!selectedKyc) return;

    if (
      status === 'rejected' &&
      !kycReason.trim()
    ) {
      setError(
        'Enter a rejection reason.'
      );
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      await updateDoc(
        doc(
          db,
          'kyc',
          selectedKyc.uid
        ),
        {
          status,
          rejectionReason:
            status === 'rejected'
              ? kycReason.trim()
              : '',
          reviewedAt: Date.now(),
          updatedAt: Date.now(),
        }
      );

      setSelectedKyc(null);
      setKycReason('');
      await refreshKyc();

      setMessage(
        `KYC marked ${status}.`
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          'Failed to review KYC.'
      );
    } finally {
      setBusy(false);
    }
  };

  const initiateWithdrawal = async () => {
    if (!selectedWithdrawal) return;

    setBusy(true);
    setError('');
    setMessage('');

    try {
      await updateDoc(
        doc(
          db,
          'withdrawals',
          selectedWithdrawal.id
        ),
        {
          status: 'payout_initiated',
          adminNote:
            withdrawalNote.trim() ||
            'Payout initiated for manual processing.',
          updatedAt: Date.now(),
        }
      );

      setSelectedWithdrawal(null);
      setWithdrawalNote('');

      setMessage(
        'Withdrawal marked as Payout Initiated. No automatic crypto transfer was made.'
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          'Failed to initiate payout.'
      );
    } finally {
      setBusy(false);
    }
  };

  const markWithdrawalPaid = async () => {
    if (!selectedWithdrawal) return;

    const txHash =
      withdrawalTxHash.trim();

    if (!txHash) {
      setError(
        'Enter the manual payout transaction hash before marking the withdrawal as paid.'
      );
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const walletRef = doc(
        db,
        'wallets',
        selectedWithdrawal.uid
      );

      const walletSnap =
        await getDoc(walletRef);

      if (!walletSnap.exists()) {
        throw new Error(
          'User wallet was not found.'
        );
      }

      const walletData =
        walletSnap.data();

      const currentBalance =
        Number(
          walletData.balance || 0
        );

      const amount =
        Number(
          selectedWithdrawal.amount
        );

      if (currentBalance < amount) {
        throw new Error(
          'User balance is lower than the withdrawal amount.'
        );
      }

      // This is only an internal account settlement after
      // the admin manually sends the real USDT payout.
      const nextBalance = Number(
        (
          currentBalance - amount
        ).toFixed(2)
      );

      await updateDoc(walletRef, {
        balance: nextBalance,
        equity: Number(
          (
            Number(
              walletData.equity || 0
            ) - amount
          ).toFixed(2)
        ),
        freeMargin: Number(
          (
            Number(
              walletData.freeMargin || 0
            ) - amount
          ).toFixed(2)
        ),
        updatedAt: Date.now(),
      });

      await updateDoc(
        doc(
          db,
          'withdrawals',
          selectedWithdrawal.id
        ),
        {
          status: 'paid',
          txHash,
          paidAt: Date.now(),
          updatedAt: Date.now(),
          adminNote:
            withdrawalNote.trim() ||
            'Manual payout completed.',
        }
      );

      setSelectedWithdrawal(null);
      setWithdrawalNote('');
      setWithdrawalTxHash('');

      setMessage(
        `Withdrawal of ${money(
          amount
        )} marked as Paid.`
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          'Failed to mark withdrawal as paid.'
      );
    } finally {
      setBusy(false);
    }
  };

  const rejectWithdrawal =
    async () => {
      if (!selectedWithdrawal) return;

      setBusy(true);
      setError('');
      setMessage('');

      try {
        await updateDoc(
          doc(
            db,
            'withdrawals',
            selectedWithdrawal.id
          ),
          {
            status: 'rejected',
            adminNote:
              withdrawalNote.trim() ||
              'Withdrawal request rejected.',
            updatedAt: Date.now(),
          }
        );

        setSelectedWithdrawal(null);
        setWithdrawalNote('');

        setMessage(
          'Withdrawal request rejected.'
        );
      } catch (err: any) {
        console.error(err);
        setError(
          err?.message ||
            'Failed to reject withdrawal.'
        );
      } finally {
        setBusy(false);
      }
    };


  const updateContactStatus = async (
    item: ContactMessage,
    status: ContactMessage['status']
  ) => {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      await updateDoc(
        doc(db, 'contactMessages', item.id),
        {
          status,
          adminReply: supportReply.trim() || item.adminReply || '',
          updatedAt: Date.now(),
        }
      );

      setSelectedContact(null);
      setSupportReply('');
      setMessage('Contact request updated.');
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          'Failed to update contact request.'
      );
    } finally {
      setBusy(false);
    }
  };

  const updateComplaintStatus = async (
    item: Complaint,
    status: Complaint['status']
  ) => {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      await updateDoc(
        doc(db, 'complaints', item.id),
        {
          status,
          adminReply: supportReply.trim() || item.adminReply || '',
          updatedAt: Date.now(),
        }
      );

      setSelectedComplaint(null);
      setSupportReply('');
      setMessage('Complaint updated.');
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          'Failed to update complaint.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-10 text-center bg-zinc-950 border border-zinc-900 rounded-2xl max-w-lg mx-auto mt-16">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">
          Access Denied
        </h2>
        <p className="text-sm text-zinc-400 mt-2">
          Administrative credentials are required.
        </p>
      </div>
    );
  }

  const filteredUsers =
    allUsers.filter((user) =>
      `${user.email} ${
        user.displayName || ''
      }`
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  const pendingWithdrawalCount =
    withdrawals.filter(
      (item) =>
        item.status === 'pending'
    ).length;

  const openContactCount =
    contactMessages.filter(
      (item) => item.status !== 'resolved'
    ).length;

  const openComplaintCount =
    complaints.filter(
      (item) => item.status !== 'resolved'
    ).length;

  return (
    <div className="space-y-8 animate-fade-in">

      <div className="border-b border-zinc-900 pb-6">
        <h1 className="text-3xl font-bold text-white">
          Corporate Admin Panel
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage wallet balances, deposits, withdrawals and KYC reviews.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-sm flex gap-3">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          {error}
        </div>
      )}

      {/* Wallet balance */}
      <section className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
        <h2 className="text-base font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 mb-5">
          <WalletCards className="w-5 h-5 text-amber-500" />
          User Wallet Balance
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search user by email or name"
                className="w-full pl-9 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredUsers.map(
                (user) => (
                  <button
                    key={user.uid}
                    type="button"
                    onClick={() =>
                      selectUser(user)
                    }
                    className={`w-full text-left p-3 rounded-xl border ${
                      selectedUser?.uid ===
                      user.uid
                        ? 'border-amber-500/50 bg-amber-500/5'
                        : 'border-zinc-900 bg-zinc-900/30'
                    } hover:border-zinc-700`}
                  >
                    <p className="text-sm font-semibold text-white">
                      {user.email}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {user.displayName ||
                        'Trader'}{' '}
                      ·{' '}
                      {user.uid.slice(
                        0,
                        8
                      )}
                    </p>
                  </button>
                )
              )}
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-5">
            {!selectedUser ? (
              <div className="h-full min-h-40 flex items-center justify-center text-sm text-zinc-600">
                Select a user to manage wallet.
              </div>
            ) : (
              <form
                onSubmit={updateBalance}
                className="space-y-4"
              >
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">
                    Selected Account
                  </p>

                  <p className="text-sm font-bold text-white mt-1">
                    {selectedUser.email}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-zinc-950">
                    <p className="text-[10px] text-zinc-600 uppercase">
                      Current Balance
                    </p>

                    <p className="font-mono text-lg text-white mt-1">
                      {money(
                        selectedWallet?.balance ||
                          0
                      )}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950">
                    <p className="text-[10px] text-zinc-600 uppercase">
                      Equity
                    </p>

                    <p className="font-mono text-lg text-amber-400 mt-1">
                      {money(
                        selectedWallet?.equity ||
                          0
                      )}
                    </p>
                  </div>
                </div>

                <label className="block">
                  <span className="text-xs text-zinc-500">
                    New balance (USD)
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={balanceInput}
                    onChange={(event) =>
                      setBalanceInput(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-amber-500"
                  />
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold disabled:opacity-50"
                >
                  {busy
                    ? 'Updating...'
                    : 'Update Wallet Balance'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Deposits */}
      <section className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
        <h2 className="text-base font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 mb-5">
          <Coins className="w-5 h-5 text-amber-500" />
          Pending Deposits ({pendingDeposits.length})
        </h2>

        <div className="space-y-3">
          {pendingDeposits.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-8">
              No pending deposits.
            </p>
          ) : (
            pendingDeposits.map(
              (deposit) => (
                <div
                  key={deposit.id}
                  className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-bold text-white">
                      {deposit.email}
                    </p>

                    <p className="text-xs text-zinc-500 mt-1">
                      {money(
                        deposit.amount
                      )}{' '}
                      · TXID:{' '}
                      {deposit.txHash}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        approveDeposit(
                          deposit
                        )
                      }
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        rejectDeposit(
                          deposit
                        )
                      }
                      className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </section>

      {/* Withdrawals */}
      <section className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
        <h2 className="text-base font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 mb-5">
          <ArrowDownToLine className="w-5 h-5 text-amber-500" />
          Withdrawal Requests ({withdrawals.length})
          {pendingWithdrawalCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px]">
              {pendingWithdrawalCount} pending
            </span>
          )}
        </h2>

        <div className="space-y-3">
          {withdrawals.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-8">
              No active withdrawal requests.
            </p>
          ) : (
            withdrawals.map(
              (request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() =>
                    setSelectedWithdrawal(
                      request
                    )
                  }
                  className="w-full text-left p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 hover:border-zinc-700"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {request.email ||
                          request.uid}
                      </p>

                      <p className="text-base font-mono font-bold text-amber-400 mt-1">
                        {money(
                          request.amount
                        )}
                      </p>

                      <p className="text-[10px] text-zinc-600 font-mono mt-1 break-all">
                        {request.walletAddress}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase ${
                          request.status ===
                          'pending'
                            ? 'bg-amber-950/30 border-amber-500/30 text-amber-400'
                            : 'bg-blue-950/30 border-blue-500/30 text-blue-400'
                        }`}
                      >
                        {request.status ===
                        'payout_initiated'
                          ? 'Payout Initiated'
                          : 'Pending'}
                      </span>

                      <p className="text-[10px] text-zinc-600 mt-2">
                        {dateTime(
                          request.createdAt
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              )
            )
          )}
        </div>
      </section>

      {/* Contact Messages */}
      <section className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
        <h2 className="text-base font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 mb-5">
          <Headphones className="w-5 h-5 text-amber-500" />
          Contact Requests ({contactMessages.length})
          {openContactCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px]">
              {openContactCount} open
            </span>
          )}
        </h2>

        <div className="space-y-3">
          {contactMessages.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-8">
              No contact requests.
            </p>
          ) : (
            contactMessages.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedContact(item)}
                className="w-full text-left p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 hover:border-zinc-700"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">
                      {item.name} · {item.email}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {item.category} · {item.message}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase ${
                    item.status === 'open'
                      ? 'bg-amber-950/30 border-amber-500/30 text-amber-400'
                      : item.status === 'in_progress'
                      ? 'bg-blue-950/30 border-blue-500/30 text-blue-400'
                      : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {item.status === 'in_progress'
                      ? 'In Progress'
                      : item.status}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Complaints */}
      <section className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
        <h2 className="text-base font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 mb-5">
          <MessageSquareWarning className="w-5 h-5 text-amber-500" />
          Complaints ({complaints.length})
          {openComplaintCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px]">
              {openComplaintCount} open
            </span>
          )}
        </h2>

        <div className="space-y-3">
          {complaints.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-8">
              No complaints.
            </p>
          ) : (
            complaints.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedComplaint(item)}
                className="w-full text-left p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 hover:border-zinc-700"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">
                      {item.subject}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {item.email || item.uid} · {item.category}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase ${
                    item.status === 'open'
                      ? 'bg-rose-950/30 border-rose-500/30 text-rose-400'
                      : item.status === 'in_progress'
                      ? 'bg-blue-950/30 border-blue-500/30 text-blue-400'
                      : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {item.status === 'in_progress'
                      ? 'In Progress'
                      : item.status}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      {/* KYC Queue */}
      <section className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
        <h2 className="text-base font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 mb-5">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          KYC Review Queue ({kycRecords.length})
        </h2>

        <div className="space-y-3">
          {kycRecords.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-8">
              No KYC applications waiting for review.
            </p>
          ) : (
            kycRecords.map((kyc) => (
              <button
                key={kyc.uid}
                type="button"
                onClick={() =>
                  setSelectedKyc(kyc)
                }
                className="w-full text-left p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 hover:border-zinc-700"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white">
                      {kyc.legalName ||
                        'Unnamed applicant'}
                    </p>

                    <p className="text-xs text-zinc-500 mt-1">
                      {kyc.documentType}{' '}
                      ••••{' '}
                      {kyc.documentLast4}{' '}
                      · {kyc.country}
                    </p>

                    <p className="text-[10px] text-zinc-600 mt-1">
                      Submitted:{' '}
                      {dateTime(
                        kyc.submittedAt
                      )}
                    </p>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Pending Review
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      {/* KYC Modal */}
      {selectedKyc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-h-[92vh] overflow-y-auto">

            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">
                  KYC Application
                </p>

                <h3 className="text-2xl font-bold text-white mt-1">
                  {selectedKyc.legalName ||
                    'Applicant'}
                </h3>

                <p className="text-xs text-zinc-600 mt-1">
                  Submitted{' '}
                  {dateTime(
                    selectedKyc.submittedAt
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedKyc(null)
                }
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            {/* Identity details */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white">
                  Applicant Information
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-zinc-600">
                    Legal Name
                  </p>
                  <p className="text-zinc-200 mt-1">
                    {selectedKyc.legalName ||
                      '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-600">
                    Date of Birth
                  </p>
                  <p className="text-zinc-200 mt-1">
                    {selectedKyc.dateOfBirth ||
                      '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-600">
                    Country
                  </p>
                  <p className="text-zinc-200 mt-1">
                    {selectedKyc.country ||
                      '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-600">
                    Document
                  </p>
                  <p className="text-zinc-200 mt-1">
                    {selectedKyc.documentType}{' '}
                    ••••{' '}
                    {selectedKyc.documentLast4}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-zinc-600">
                    Residential Address
                  </p>
                  <p className="text-zinc-200 mt-1 whitespace-pre-wrap">
                    {selectedKyc.address ||
                      '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    Identity Document
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    [
                      'Front',
                      selectedKyc.documentFrontUrl,
                    ],
                    [
                      'Back',
                      selectedKyc.documentBackUrl,
                    ],
                  ].map(
                    ([label, url]) => (
                      <div
                        key={String(label)}
                        className="rounded-lg border border-zinc-800 bg-black/20 overflow-hidden"
                      >
                        <div className="aspect-[4/3] bg-zinc-900 flex items-center justify-center">
                          {url ? (
                            <img
                              src={url}
                              alt={`${label} document`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-xs text-zinc-700">
                              Not uploaded
                            </span>
                          )}
                        </div>

                        <div className="p-3 flex items-center justify-between gap-2">
                          <span className="text-xs text-zinc-400">
                            {label}
                          </span>

                          {url && (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                            >
                              Open
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Selfie */}
              <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    Live Selfie Verification
                  </h4>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-black/20 overflow-hidden">
                  <div className="aspect-[4/3] bg-zinc-900 flex items-center justify-center">
                    {selectedKyc.selfieUrl ? (
                      <img
                        src={
                          selectedKyc.selfieUrl
                        }
                        alt="Live selfie"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                        <span className="text-xs text-zinc-700">
                          Selfie not uploaded
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-zinc-300">
                        Capture status
                      </p>
                      <p className="text-[10px] text-emerald-400 mt-1">
                        {selectedKyc.selfieUrl
                          ? 'Selfie captured'
                          : 'Not available'}
                      </p>
                    </div>

                    {selectedKyc.selfieUrl && (
                      <a
                        href={
                          selectedKyc.selfieUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                      >
                        Open
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
                    Verification method
                  </p>
                  <p className="text-xs text-zinc-300 mt-1">
                    {selectedKyc.selfieVerification ||
                      'basic_live_selfie'}
                  </p>
                </div>
              </div>
            </div>

            {/* Proof of address */}
            <div className="mt-5 rounded-xl border border-zinc-900 bg-zinc-900/30 p-4">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-bold text-white">
                    Proof of Address
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Review the uploaded residential address document.
                  </p>
                </div>

                {selectedKyc.proofOfAddressUrl && (
                  <a
                    href={
                      selectedKyc.proofOfAddressUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-bold text-amber-400 hover:text-amber-300"
                  >
                    Open document
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                {selectedKyc.proofOfAddressUrl ? (
                  <img
                    src={
                      selectedKyc.proofOfAddressUrl
                    }
                    alt="Proof of address"
                    className="max-h-80 w-full object-contain"
                  />
                ) : (
                  <p className="text-xs text-zinc-700 text-center py-10">
                    Proof of address not uploaded.
                  </p>
                )}
              </div>
            </div>

            {/* Review */}
            <div className="mt-5 rounded-xl border border-zinc-900 bg-zinc-900/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CircleDollarSign className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white">
                  Review Decision
                </h4>
              </div>

              <textarea
                value={kycReason}
                onChange={(event) =>
                  setKycReason(
                    event.target.value
                  )
                }
                placeholder="Rejection reason (required when rejecting)"
                className="w-full min-h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500"
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  disabled={
                    busy ||
                    !kycReason.trim()
                  }
                  onClick={() =>
                    reviewKyc('rejected')
                  }
                  className="px-5 py-3 rounded-xl border border-red-500/30 text-red-300 font-bold text-sm disabled:opacity-40"
                >
                  Reject KYC
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    reviewKyc('approved')
                  }
                  className="px-5 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm disabled:opacity-50"
                >
                  Approve KYC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-600">
                  Withdrawal Request
                </p>

                <h3 className="text-2xl font-bold text-white mt-1">
                  {money(
                    selectedWithdrawal.amount
                  )}
                </h3>

                <p className="text-xs text-zinc-500 mt-1">
                  {selectedWithdrawal.email ||
                    selectedWithdrawal.uid}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedWithdrawal(
                    null
                  )
                }
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Destination Wallet
                </p>
                <p className="text-sm text-white font-mono break-all mt-2">
                  {selectedWithdrawal.walletAddress}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Method
                  </p>
                  <p className="text-sm text-amber-400 font-bold mt-2">
                    {selectedWithdrawal.method}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Current Status
                  </p>
                  <p className="text-sm text-white font-bold mt-2">
                    {selectedWithdrawal.status ===
                    'payout_initiated'
                      ? 'Payout Initiated'
                      : 'Pending'}
                  </p>
                </div>
              </div>

              {selectedWithdrawal.status ===
                'pending' && (
                <>
                  <textarea
                    value={
                      withdrawalNote
                    }
                    onChange={(event) =>
                      setWithdrawalNote(
                        event.target
                          .value
                      )
                    }
                    placeholder="Optional admin note"
                    className="w-full min-h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500"
                  />

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={
                        rejectWithdrawal
                      }
                      className="px-5 py-3 rounded-xl border border-red-500/30 text-red-300 font-bold text-sm disabled:opacity-50"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={
                        initiateWithdrawal
                      }
                      className="px-5 py-3 rounded-xl bg-amber-500 text-black font-bold text-sm disabled:opacity-50"
                    >
                      Initiate Payout
                    </button>
                  </div>
                </>
              )}

              {selectedWithdrawal.status ===
                'payout_initiated' && (
                <>
                  <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4">
                    <div className="flex items-center gap-3">
                      <Clock3 className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Payout Initiated
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Send the USDT manually to the displayed wallet address.
                          No automatic transfer is performed by ForexArena.
                        </p>
                      </div>
                    </div>
                  </div>

                  <input
                    value={
                      withdrawalTxHash
                    }
                    onChange={(event) =>
                      setWithdrawalTxHash(
                        event.target
                          .value
                      )
                    }
                    placeholder="Enter manual payout transaction hash"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-amber-500"
                  />

                  <textarea
                    value={
                      withdrawalNote
                    }
                    onChange={(event) =>
                      setWithdrawalNote(
                        event.target
                          .value
                      )
                    }
                    placeholder="Optional payout note"
                    className="w-full min-h-20 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500"
                  />

                  <button
                    type="button"
                    disabled={
                      busy ||
                      !withdrawalTxHash.trim()
                    }
                    onClick={
                      markWithdrawalPaid
                    }
                    className="w-full py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm disabled:opacity-50"
                  >
                    Mark as Paid
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact detail modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-600">
                  Contact Request
                </p>
                <h3 className="text-xl font-bold text-white mt-1">
                  {selectedContact.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {selectedContact.email} · {selectedContact.category}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                Message
              </p>
              <p className="text-sm text-zinc-200 mt-2 whitespace-pre-wrap">
                {selectedContact.message}
              </p>
            </div>

            <textarea
              value={supportReply}
              onChange={(e) => setSupportReply(e.target.value)}
              placeholder="Admin response (optional)"
              className="mt-4 w-full min-h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => updateContactStatus(selectedContact, 'in_progress')}
                className="px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold text-xs"
              >
                In Progress
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => updateContactStatus(selectedContact, 'resolved')}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint detail modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-600">
                  Complaint
                </p>
                <h3 className="text-xl font-bold text-white mt-1">
                  {selectedComplaint.subject}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {selectedComplaint.email || selectedComplaint.uid} · {selectedComplaint.category}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                Complaint details
              </p>
              <p className="text-sm text-zinc-200 mt-2 whitespace-pre-wrap">
                {selectedComplaint.description}
              </p>
            </div>

            <textarea
              value={supportReply}
              onChange={(e) => setSupportReply(e.target.value)}
              placeholder="Admin response (optional)"
              className="mt-4 w-full min-h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => updateComplaintStatus(selectedComplaint, 'in_progress')}
                className="px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold text-xs"
              >
                In Progress
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => updateComplaintStatus(selectedComplaint, 'resolved')}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}