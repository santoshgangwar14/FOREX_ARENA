import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileText,
  Info,
  LockKeyhole,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import SelfieVerification from '../components/SelfieVerification';

type KYCStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';
type DocumentType = 'PAN' | 'Passport' | 'Driving Licence' | 'Other';

interface KYCRecord {
  uid: string;
  legalName: string;
  dateOfBirth: string;
  country: string;
  address: string;
  documentType: DocumentType;
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

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const INITIAL_FORM = {
  legalName: '',
  dateOfBirth: '',
  country: 'India',
  address: '',
  documentType: 'PAN' as DocumentType,
  documentLast4: '',
};

function formatDate(timestamp?: number) {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function validateFile(file: File | null) {
  if (!file) return 'Please select a document.';
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Only JPG, PNG or PDF files are supported.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Each document must be 5 MB or smaller.';
  }
  return '';
}

export default function KYC() {
  const { currentUser } = useAuth();

  const [record, setRecord] = useState<KYCRecord | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);

  const [selfieUrl, setSelfieUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadKyc = async () => {
      setLoading(true);
      setError('');

      try {
        const snap = await getDoc(doc(db, 'kyc', currentUser.uid));

        if (cancelled) return;

        if (!snap.exists()) {
          setRecord(null);
          setForm(INITIAL_FORM);
          setSelfieUrl('');
          return;
        }

        const data = snap.data() as Partial<KYCRecord>;

        const status: KYCStatus =
          data.status === 'approved' ||
          data.status === 'pending' ||
          data.status === 'rejected'
            ? data.status
            : 'not_submitted';

        const normalized: KYCRecord = {
          uid: currentUser.uid,
          legalName: typeof data.legalName === 'string' ? data.legalName : '',
          dateOfBirth: typeof data.dateOfBirth === 'string' ? data.dateOfBirth : '',
          country: typeof data.country === 'string' ? data.country : 'India',
          address: typeof data.address === 'string' ? data.address : '',
          documentType:
            data.documentType === 'Passport' ||
            data.documentType === 'Driving Licence' ||
            data.documentType === 'Other'
              ? data.documentType
              : 'PAN',
          documentLast4:
            typeof data.documentLast4 === 'string' ? data.documentLast4 : '',
          documentFrontUrl:
            typeof data.documentFrontUrl === 'string'
              ? data.documentFrontUrl
              : undefined,
          documentBackUrl:
            typeof data.documentBackUrl === 'string'
              ? data.documentBackUrl
              : undefined,
          proofOfAddressUrl:
            typeof data.proofOfAddressUrl === 'string'
              ? data.proofOfAddressUrl
              : undefined,
          selfieUrl:
            typeof data.selfieUrl === 'string'
              ? data.selfieUrl
              : undefined,
          selfieVerification:
            typeof data.selfieVerification === 'string'
              ? data.selfieVerification
              : undefined,
          status,
          submittedAt:
            typeof data.submittedAt === 'number' ? data.submittedAt : undefined,
          reviewedAt:
            typeof data.reviewedAt === 'number' ? data.reviewedAt : undefined,
          rejectionReason:
            typeof data.rejectionReason === 'string'
              ? data.rejectionReason
              : undefined,
          updatedAt:
            typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
        };

        setRecord(normalized);
        setSelfieUrl(normalized.selfieUrl || '');
        setForm({
          legalName: normalized.legalName,
          dateOfBirth: normalized.dateOfBirth,
          country: normalized.country,
          address: normalized.address,
          documentType: normalized.documentType,
          documentLast4: normalized.documentLast4,
        });
      } catch (err: any) {
        console.error('KYC load failed:', err);
        setError(
          err?.code === 'permission-denied'
            ? 'We could not access your verification record right now.'
            : 'Unable to load your verification status.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadKyc();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const status = record?.status || 'not_submitted';

  const statusConfig = {
    not_submitted: {
      title: 'Verification required',
      subtitle: 'Complete the steps below to verify your account.',
      badge: 'Not verified',
      dot: 'bg-zinc-500',
      color: 'text-zinc-400',
    },
    pending: {
      title: 'Verification in progress',
      subtitle: 'Your documents have been submitted and are being reviewed.',
      badge: 'Under review',
      dot: 'bg-amber-400',
      color: 'text-amber-400',
    },
    approved: {
      title: 'Identity verified',
      subtitle: 'Your account identity verification has been completed.',
      badge: 'Verified',
      dot: 'bg-emerald-400',
      color: 'text-emerald-400',
    },
    rejected: {
      title: 'Action required',
      subtitle: 'Please update the requested information and resubmit.',
      badge: 'Needs attention',
      dot: 'bg-rose-400',
      color: 'text-rose-400',
    },
  }[status];

  const stepState = useMemo(() => {
    const profileDone =
      Boolean(form.legalName.trim()) &&
      Boolean(form.dateOfBirth) &&
      Boolean(form.country.trim()) &&
      Boolean(form.address.trim());

    const identityDone =
      Boolean(record?.documentFrontUrl || frontFile) &&
      Boolean(record?.documentBackUrl || backFile) &&
      /^\d{4}$/.test(form.documentLast4);

    const addressDone = Boolean(record?.proofOfAddressUrl || addressFile);
    const selfieDone = Boolean(selfieUrl);

    return {
      profileDone,
      identityDone,
      addressDone,
      selfieDone,
    };
  }, [form, record, frontFile, backFile, addressFile, selfieUrl]);

  const completedSteps = [
    stepState.profileDone,
    stepState.identityDone,
    stepState.addressDone,
    stepState.selfieDone,
  ].filter(Boolean).length;

  const locked =
    loading ||
    saving ||
    status === 'pending' ||
    status === 'approved';

  const chooseFile = (
    file: File | null,
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    const validation = validateFile(file);
    if (validation) {
      setError(validation);
      return;
    }
    setError('');
    setter(file);
  };

  const uploadDocument = async (
    file: File,
    category: 'document-front' | 'document-back' | 'proof-of-address'
  ) => {
    if (!currentUser) throw new Error('You must be signed in.');

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path =
      `kyc/${currentUser.uid}/${category}/` +
      `${Date.now()}-${safeName}`;

    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uid: currentUser.uid,
        category,
      },
    });

    return getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentUser) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!form.legalName.trim()) {
        throw new Error('Enter your full legal name.');
      }
      if (!form.dateOfBirth) {
        throw new Error('Enter your date of birth.');
      }
      if (!form.country.trim()) {
        throw new Error('Enter your country of residence.');
      }
      if (!form.address.trim()) {
        throw new Error('Enter your residential address.');
      }
      if (!/^\d{4}$/.test(form.documentLast4)) {
        throw new Error('Enter the last 4 digits of your identity document.');
      }
      if (!record?.documentFrontUrl && !frontFile) {
        throw new Error('Upload the front of your identity document.');
      }
      if (!record?.documentBackUrl && !backFile) {
        throw new Error('Upload the back of your identity document.');
      }
      if (!record?.proofOfAddressUrl && !addressFile) {
        throw new Error('Upload proof of residential address.');
      }
      if (!selfieUrl) {
        throw new Error(
          'Complete the live selfie verification before submitting your KYC.'
        );
      }

      if (status === 'pending') {
        throw new Error('Your verification is currently under review.');
      }
      if (status === 'approved') {
        throw new Error('Your identity verification is already approved.');
      }

      let documentFrontUrl = record?.documentFrontUrl;
      let documentBackUrl = record?.documentBackUrl;
      let proofOfAddressUrl = record?.proofOfAddressUrl;

      if (frontFile) {
        documentFrontUrl = await uploadDocument(frontFile, 'document-front');
      }
      if (backFile) {
        documentBackUrl = await uploadDocument(backFile, 'document-back');
      }
      if (addressFile) {
        proofOfAddressUrl = await uploadDocument(
          addressFile,
          'proof-of-address'
        );
      }

      const now = Date.now();

      const next: KYCRecord = {
        uid: currentUser.uid,
        legalName: form.legalName.trim(),
        dateOfBirth: form.dateOfBirth,
        country: form.country.trim(),
        address: form.address.trim(),
        documentType: form.documentType,
        documentLast4: form.documentLast4,
        documentFrontUrl,
        documentBackUrl,
        proofOfAddressUrl,
        selfieUrl,
        selfieVerification: 'basic_live_selfie',
        status: 'pending',
        submittedAt: record?.submittedAt || now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'kyc', currentUser.uid), next, { merge: true });

      setRecord(next);
      setFrontFile(null);
      setBackFile(null);
      setAddressFile(null);
      setSuccess(
        'Your verification request has been submitted successfully.'
      );
    } catch (err: any) {
      console.error('KYC submission failed:', err);

      if (err?.code === 'storage/unauthorized') {
        setError(
          'Document upload is not permitted by the current Storage rules.'
        );
      } else if (err?.code === 'permission-denied') {
        setError('Your verification request is not permitted.');
      } else {
        setError(err?.message || 'We could not submit your verification.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-zinc-400">
        Please sign in to continue.
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#080a0d] text-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-8">

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-semibold">
                Account verification
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Verify your identity
            </h1>

            <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
              Complete your identity, document, address and live selfie checks.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 bg-[#101318]">
            <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
            <span className={`text-xs font-semibold ${statusConfig.color}`}>
              {statusConfig.badge}
            </span>
          </div>
        </div>

        <div className="bg-[#101318] border border-zinc-800 rounded-2xl p-5 mb-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                Verification progress
              </p>
              <p className="text-lg font-bold mt-1">
                {completedSteps} of 4 steps completed
              </p>
            </div>

            <div className="flex items-center gap-2 lg:w-[420px]">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full flex-1 ${
                    index < completedSteps ? 'bg-amber-400' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
            {[
              ['01', 'Personal details', stepState.profileDone],
              ['02', 'Identity document', stepState.identityDone],
              ['03', 'Proof of address', stepState.addressDone],
              ['04', 'Live selfie check', stepState.selfieDone],
            ].map(([number, title, done]) => (
              <div
                key={String(number)}
                className={`rounded-xl border p-3 ${
                  done
                    ? 'border-emerald-900/60 bg-emerald-950/10'
                    : 'border-zinc-800 bg-zinc-950/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                      done
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      number
                    )}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">
                      {title}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      {done ? 'Complete' : 'Required'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {success && (
          <div className="mb-5 flex items-start gap-3 p-4 rounded-xl border border-emerald-900/60 bg-emerald-950/20 text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-sm">{success}</div>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 p-4 rounded-xl border border-rose-900/60 bg-rose-950/20 text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {status === 'pending' && (
          <div className="mb-5 rounded-xl border border-amber-900/50 bg-amber-950/10 p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">
                Verification is being reviewed
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Submitted {formatDate(record?.submittedAt)}.
              </p>
            </div>
          </div>
        )}

        {status === 'rejected' && record?.rejectionReason && (
          <div className="mb-5 rounded-xl border border-rose-900/50 bg-rose-950/10 p-4 text-sm text-rose-200">
            <span className="font-semibold">Review note:</span>{' '}
            {record.rejectionReason}
          </div>
        )}

        <form
          id="kyc-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_310px] gap-5"
        >
          <div className="space-y-5">

            <section className="bg-[#101318] border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800">
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-semibold">
                  Step 01
                </p>
                <h2 className="text-base font-bold mt-1">Personal details</h2>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400">
                    Full legal name
                  </span>
                  <input
                    value={form.legalName}
                    onChange={(e) =>
                      setForm({ ...form, legalName: e.target.value })
                    }
                    disabled={locked}
                    placeholder="As shown on your identity document"
                    className="w-full rounded-xl bg-[#0b0e12] border border-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-amber-500/70 disabled:opacity-60"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400">
                    Date of birth
                  </span>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) =>
                      setForm({ ...form, dateOfBirth: e.target.value })
                    }
                    disabled={locked}
                    className="w-full rounded-xl bg-[#0b0e12] border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-amber-500/70 disabled:opacity-60"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400">
                    Country of residence
                  </span>
                  <input
                    value={form.country}
                    onChange={(e) =>
                      setForm({ ...form, country: e.target.value })
                    }
                    disabled={locked}
                    className="w-full rounded-xl bg-[#0b0e12] border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-amber-500/70 disabled:opacity-60"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400">
                    Document type
                  </span>
                  <select
                    value={form.documentType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        documentType: e.target.value as DocumentType,
                      })
                    }
                    disabled={locked}
                    className="w-full rounded-xl bg-[#0b0e12] border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-amber-500/70 disabled:opacity-60"
                  >
                    <option value="PAN">PAN</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving Licence">Driving Licence</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-semibold text-zinc-400">
                    Residential address
                  </span>
                  <textarea
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    disabled={locked}
                    rows={3}
                    placeholder="Enter your current residential address"
                    className="w-full rounded-xl bg-[#0b0e12] border border-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-amber-500/70 resize-none disabled:opacity-60"
                  />
                </label>
              </div>
            </section>

            <section className="bg-[#101318] border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800">
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-semibold">
                  Step 02
                </p>
                <h2 className="text-base font-bold mt-1">Identity document</h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Upload clear, readable copies of the same document.
                </p>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Document front',
                    existing: record?.documentFrontUrl,
                    file: frontFile,
                    setter: setFrontFile,
                  },
                  {
                    title: 'Document back',
                    existing: record?.documentBackUrl,
                    file: backFile,
                    setter: setBackFile,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-zinc-800 bg-[#0b0e12] p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-1">
                          JPG, PNG or PDF · up to 5 MB
                        </p>
                      </div>
                      <FileText className="w-4 h-4 text-zinc-600" />
                    </div>

                    {item.existing && !item.file && (
                      <div className="mb-3 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800">
                        <a
                          href={item.existing}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-amber-400 hover:text-amber-300"
                        >
                          View uploaded document
                        </a>
                      </div>
                    )}

                    <label
                      className={`w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 px-4 py-4 text-xs font-semibold text-zinc-300 hover:border-amber-500/60 hover:text-white cursor-pointer transition-colors ${
                        locked ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      {item.file
                        ? item.file.name
                        : item.existing
                        ? 'Replace document'
                        : 'Choose file'}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                        disabled={locked}
                        className="hidden"
                        onChange={(e) =>
                          chooseFile(e.target.files?.[0] || null, item.setter)
                        }
                      />
                    </label>

                    {item.file && !locked && (
                      <button
                        type="button"
                        onClick={() => item.setter(null)}
                        className="mt-2 text-[10px] text-rose-400 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Remove selected file
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5">
                <label className="block space-y-2 max-w-sm">
                  <span className="text-xs font-semibold text-zinc-400">
                    Last 4 digits of document
                  </span>
                  <input
                    value={form.documentLast4}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        documentLast4: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    maxLength={4}
                    inputMode="numeric"
                    disabled={locked}
                    placeholder="1234"
                    className="w-full rounded-xl bg-[#0b0e12] border border-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-amber-500/70 disabled:opacity-60"
                  />
                </label>
              </div>
            </section>

            <section className="bg-[#101318] border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800">
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-semibold">
                  Step 03
                </p>
                <h2 className="text-base font-bold mt-1">Proof of address</h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Use a recent document showing your name and current address.
                </p>
              </div>

              <div className="p-5">
                <div className="rounded-xl border border-zinc-800 bg-[#0b0e12] p-4 max-w-xl">
                  {record?.proofOfAddressUrl && !addressFile && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <a
                        href={record.proofOfAddressUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-amber-400 hover:text-amber-300"
                      >
                        View uploaded proof of address
                      </a>
                    </div>
                  )}

                  <label
                    className={`w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 px-4 py-5 text-xs font-semibold text-zinc-300 hover:border-amber-500/60 hover:text-white cursor-pointer transition-colors ${
                      locked ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    {addressFile
                      ? addressFile.name
                      : record?.proofOfAddressUrl
                      ? 'Replace proof of address'
                      : 'Upload proof of address'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                      disabled={locked}
                      className="hidden"
                      onChange={(e) =>
                        chooseFile(
                          e.target.files?.[0] || null,
                          setAddressFile
                        )
                      }
                    />
                  </label>

                  <p className="text-[10px] text-zinc-600 mt-3 leading-relaxed">
                    Examples include a recent utility bill, bank statement or
                    other accepted proof of residence.
                  </p>
                </div>
              </div>
            </section>

            <section
              id="live-selfie"
              className="bg-[#101318] border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-zinc-800">
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-semibold">
                  Step 04
                </p>
                <h2 className="text-base font-bold mt-1">
                  Live selfie verification
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Complete the camera check before submitting your verification.
                </p>
              </div>

              <div className="p-5">
                <SelfieVerification
                  existingUrl={selfieUrl}
                  disabled={locked}
                  onVerified={(url) => {
                    setSelfieUrl(url);
                    setError('');
                    setSuccess(
                      'Live selfie check completed successfully.'
                    );
                  }}
                />
              </div>
            </section>

            <section className="bg-[#101318] border border-zinc-800 rounded-2xl p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Ready to submit?
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    All four verification steps must be completed.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    loading ||
                    status === 'pending' ||
                    status === 'approved' ||
                    !selfieUrl
                  }
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold disabled:opacity-50"
                >
                  {saving ? 'Submitting...' : 'Submit verification'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <div className="bg-[#101318] border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <LockKeyhole className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">
                  Your information is protected
                </h3>
              </div>

              <div className="space-y-3 text-xs text-zinc-500 leading-relaxed">
                <p>
                  Your submitted information is used for account verification
                  and security.
                </p>
                <p>
                  Make sure your details match the documents you upload.
                </p>
              </div>
            </div>

            <div className="bg-[#101318] border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold mb-4">
                Verification checklist
              </h3>

              <div className="space-y-3">
                {[
                  ['Personal information', stepState.profileDone],
                  ['Identity document', stepState.identityDone],
                  ['Proof of address', stepState.addressDone],
                  ['Live selfie check', stepState.selfieDone],
                ].map(([label, done]) => (
                  <div key={String(label)} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        done
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-zinc-900 text-zinc-600'
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                      )}
                    </div>

                    <span
                      className={`text-xs ${
                        done ? 'text-zinc-300' : 'text-zinc-500'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#101318] border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold mb-3">
                What happens next?
              </h3>

              <div className="space-y-3">
                {[
                  'We receive your verification request.',
                  'Your information and documents are reviewed.',
                  'Your verification status is updated in your account.',
                ].map((text, index) => (
                  <div key={text} className="flex gap-3">
                    <span className="text-[10px] font-bold text-amber-400 pt-0.5">
                      0{index + 1}
                    </span>
                    <span className="text-xs text-zinc-500 leading-relaxed">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}