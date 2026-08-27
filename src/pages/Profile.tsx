import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';

type KYCStatus =
  | 'not_submitted'
  | 'pending'
  | 'approved'
  | 'rejected';

export default function Profile() {
  const { currentUser, userProfile } = useAuth();

  const [phone, setPhone] = useState('');
  const [kycStatus, setKycStatus] =
    useState<KYCStatus>('not_submitted');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const userSnap = await getDoc(
          doc(db, 'users', currentUser.uid)
        );

        if (!cancelled && userSnap.exists()) {
          const data = userSnap.data();

          setPhone(
            typeof data.phone === 'string'
              ? data.phone
              : ''
          );
        }
      } catch (err) {
        console.error('Profile read failed:', err);

        if (!cancelled) {
          setError(
            'Unable to load your profile information.'
          );
        }
      }

      try {
        const kycSnap = await getDoc(
          doc(db, 'kyc', currentUser.uid)
        );

        if (!cancelled && kycSnap.exists()) {
          const status = kycSnap.data().status;

          if (
            status === 'approved' ||
            status === 'pending' ||
            status === 'rejected'
          ) {
            setKycStatus(status);
          } else {
            setKycStatus('not_submitted');
          }
        } else if (!cancelled) {
          setKycStatus('not_submitted');
        }
      } catch (err) {
        console.error('KYC status read failed:', err);

        if (!cancelled) {
          setKycStatus('not_submitted');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const saveProfile = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!currentUser) return;

    setSaving(true);
    setSuccess('');
    setError('');

    try {
      await updateDoc(
        doc(db, 'users', currentUser.uid),
        {
          phone: phone.trim(),
          updatedAt: Date.now(),
        }
      );

      setSuccess(
        'Profile updated successfully.'
      );
    } catch (err) {
      console.error('Profile update failed:', err);

      setError(
        'Unable to update your profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  const kycLabel = {
    not_submitted: 'Not verified',
    pending: 'Under review',
    approved: 'Verified',
    rejected: 'Action required',
  }[kycStatus];

  const kycColor = {
    not_submitted: 'text-zinc-400',
    pending: 'text-amber-400',
    approved: 'text-emerald-400',
    rejected: 'text-rose-400',
  }[kycStatus];

  const kycDot = {
    not_submitted: 'bg-zinc-600',
    pending: 'bg-amber-400',
    approved: 'bg-emerald-400',
    rejected: 'bg-rose-400',
  }[kycStatus];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-zinc-900 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Trader Profile
        </h1>

        <p className="text-sm text-zinc-400 mt-1">
          Manage your account information and verification status.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-sm flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-10 text-center text-sm text-zinc-500">
          Loading profile...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Account summary */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-2 border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-3xl font-bold mt-4">
                {(
                  userProfile?.displayName ||
                  currentUser?.displayName ||
                  'T'
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <h2 className="text-xl font-bold text-white text-center mt-4">
                {userProfile?.displayName ||
                  currentUser?.displayName ||
                  'Active Trader'}
              </h2>

              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider text-center mt-1">
                GoldxArena Client
              </p>

              <div className="border-t border-zinc-900 mt-6 pt-6 space-y-5">

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-zinc-500 shrink-0" />

                  <div className="min-w-0">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Email Address
                    </p>

                    <p className="text-sm font-semibold text-zinc-300 truncate">
                      {currentUser?.email || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-zinc-500 shrink-0" />

                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Account
                    </p>

                    <p className="text-sm font-semibold text-zinc-300">
                      Active
                    </p>
                  </div>
                </div>

                {/* KYC status */}
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />

                  <div className="flex-1">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Identity Verification
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`w-2 h-2 rounded-full ${kycDot}`}
                      />

                      <span
                        className={`text-xs font-bold uppercase tracking-wide ${kycColor}`}
                      >
                        {kycLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* KYC CTA */}
              <div className="mt-6 pt-5 border-t border-zinc-900">
                <Link
                  to="/kyc"
                  className="w-full inline-flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-amber-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />

                    <div className="text-left">
                      <p className="text-xs font-bold text-white">
                        {kycStatus === 'approved'
                          ? 'View verification'
                          : 'Complete verification'}
                      </p>

                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {kycStatus === 'pending'
                          ? 'Your documents are under review'
                          : kycStatus === 'approved'
                          ? 'Identity verification is complete'
                          : 'Identity and document verification'}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Account information */}
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                Account Information
              </h2>

              <form
                onSubmit={saveProfile}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>

                  <input
                    value={currentUser?.email || ''}
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Mobile Number
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    placeholder="Enter mobile number"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Dedicated KYC card */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-white">
                      Identity Verification
                    </h2>

                    <p className="text-xs text-zinc-500 mt-1 max-w-xl leading-relaxed">
                      Verify your identity by submitting your personal
                      information, identity documents, proof of address,
                      and live selfie check.
                    </p>

                    <div className="flex items-center gap-2 mt-3">
                      <span
                        className={`w-2 h-2 rounded-full ${kycDot}`}
                      />

                      <span
                        className={`text-xs font-bold ${kycColor}`}
                      >
                        {kycLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/kyc"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold whitespace-nowrap"
                >
                  {kycStatus === 'approved'
                    ? 'View KYC'
                    : 'Start KYC'}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}