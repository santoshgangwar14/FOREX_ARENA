import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AlertTriangle, CheckCircle2, FileCheck2, ShieldCheck } from 'lucide-react';

interface KYCRecord {
  uid: string;
  legalName: string;
  dateOfBirth: string;
  country: string;
  address: string;
  documentType: 'PAN' | 'Passport' | 'Driving Licence' | 'Other';
  documentLast4: string;
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  submittedAt?: number;
  reviewedAt?: number;
  rejectionReason?: string;
  updatedAt: number;
}

const initialForm = {
  legalName: '',
  dateOfBirth: '',
  country: 'India',
  address: '',
  documentType: 'PAN' as KYCRecord['documentType'],
  documentLast4: '',
};

export default function KYC() {
  const { currentUser } = useAuth();
  const [record, setRecord] = useState<KYCRecord | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'kyc', currentUser.uid));
        if (snap.exists()) {
          const data = snap.data() as KYCRecord;
          setRecord(data);
          setForm({
            legalName: data.legalName || '',
            dateOfBirth: data.dateOfBirth || '',
            country: data.country || 'India',
            address: data.address || '',
            documentType: data.documentType || 'PAN',
            documentLast4: data.documentLast4 || '',
          });
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load your KYC status.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    setMessage('');
    setError('');

    if (!form.legalName.trim() || !form.dateOfBirth || !form.country.trim() || !form.address.trim()) {
      setError('Please complete all required identity and address fields.');
      setSaving(false);
      return;
    }

    if (!/^\d{4}$/.test(form.documentLast4)) {
      setError('Enter the last 4 characters/digits of your identity document only.');
      setSaving(false);
      return;
    }

    const next: KYCRecord = {
      uid: currentUser.uid,
      ...form,
      status: 'pending',
      submittedAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await setDoc(doc(db, 'kyc', currentUser.uid), next, { merge: true });
      setRecord(next);
      setMessage('KYC submitted successfully. Your application is now pending review.');
    } catch (err) {
      console.error(err);
      setError('KYC submission failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const status = record?.status || 'not_submitted';
  const statusLabel = {
    not_submitted: 'Not Submitted',
    pending: 'Under Review',
    approved: 'Verified',
    rejected: 'Rejected',
  }[status];

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-amber-500" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Identity Verification</h1>
            <p className="text-sm text-zinc-400 mt-1">Complete your account verification before using restricted platform features.</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          {message}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          {error}
        </div>
      )}

      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">KYC Status</p>
            <p className="text-xl font-bold text-white mt-1">{statusLabel}</p>
          </div>
          <div className="px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-300 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-amber-500" />
            {status === 'approved' ? 'Verified' : status === 'pending' ? 'Review Pending' : 'Action Required'}
          </div>
        </div>

        {status === 'rejected' && record?.rejectionReason && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-sm text-red-200">
            <span className="font-bold">Review note:</span> {record.rejectionReason}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Legal Full Name *</span>
            <input value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} disabled={saving || status === 'pending' || status === 'approved'} className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-amber-500 disabled:opacity-60" />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Date of Birth *</span>
            <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} disabled={saving || status === 'pending' || status === 'approved'} className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-amber-500 disabled:opacity-60" />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Country *</span>
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} disabled={saving || status === 'pending' || status === 'approved'} className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-amber-500 disabled:opacity-60" />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Document Type *</span>
            <select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value as KYCRecord['documentType'] })} disabled={saving || status === 'pending' || status === 'approved'} className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-amber-500 disabled:opacity-60">
              <option>PAN</option>
              <option>Passport</option>
              <option>Driving Licence</option>
              <option>Other</option>
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Residential Address *</span>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} disabled={saving || status === 'pending' || status === 'approved'} rows={3} className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-amber-500 disabled:opacity-60 resize-none" />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Document Last 4 *</span>
            <input inputMode="numeric" maxLength={4} value={form.documentLast4} onChange={(e) => setForm({ ...form, documentLast4: e.target.value.replace(/\D/g, '') })} disabled={saving || status === 'pending' || status === 'approved'} className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-amber-500 disabled:opacity-60" />
            <p className="text-[11px] text-zinc-600">For now, do not enter the full document number here.</p>
          </label>

          <div className="md:col-span-2 flex justify-end pt-2">
            {status !== 'approved' && status !== 'pending' && (
              <button type="submit" disabled={saving || loading} className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm disabled:opacity-50">
                {saving ? 'Submitting...' : 'Submit KYC for Review'}
              </button>
            )}
          </div>
        </form>
      </div>

      <p className="text-xs text-zinc-600 leading-relaxed">This page is an application-level KYC workflow and does not by itself establish regulatory KYC/AML compliance. Before production use, connect it to the required regulated identity-verification provider, document storage controls, retention policy, and compliance review process.</p>
    </div>
  );
}
