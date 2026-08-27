import React, { useRef, useState } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  Download,
  Upload,
  Coins,
  CheckCircle,
  Info,
  FileText,
  AlertCircle,
} from 'lucide-react';

const WALLET_ADDRESS =
  '0x1b75e27fDc4d88B12e82F8F35752953971F980E7';

export default function Deposit() {
  const { deposits, createDeposit } = useTrading();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatCurrency = (value: number | undefined) =>
    value === undefined
      ? '$0.00'
      : new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleFileChange = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, JPEG).');
      return;
    }

    if (file.size > 800 * 1024) {
      setError('Screenshot is too large. Please upload an image under 800 KB.');
      return;
    }

    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setScreenshot(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(WALLET_ADDRESS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy the address. Please copy it manually.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const numericAmount = Number.parseFloat(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid deposit amount.');
      return;
    }

    if (!txHash.trim()) {
      setError('Transaction Hash is required to verify the deposit.');
      return;
    }

    if (!screenshot) {
      setError('Please upload a screenshot of the transaction.');
      return;
    }

    try {
      setSubmitting(true);
      await createDeposit(numericAmount, txHash.trim(), screenshot);

      setSuccess(
        'Your deposit request has been submitted successfully. An administrator will review it shortly.'
      );
      setAmount('');
      setTxHash('');
      setScreenshot(null);
      setFileName('');
    } catch (submitError: unknown) {
      console.error('Deposit submission error:', submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to submit deposit request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-zinc-900 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">
          Account Deposit
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Fund your trading balance via secure USDT BEP-20 payments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-500 pointer-events-none">
              <Coins className="w-48 h-48 -mr-12 -mt-12" />
            </div>

            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
              <Coins className="w-5 h-5 text-amber-500" />
              USDT (BEP-20) Payment Details
            </h2>

            <div className="space-y-5 text-sm text-zinc-400">
              <p>
                Send the desired USDT amount to the wallet below using the
                BNB Smart Chain (BEP-20) network.
              </p>

              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="shrink-0 rounded-2xl bg-white p-3">
                    <img
                      src="/goldxarena-bep20-qr.jpeg"
                      alt="GoldXArena USDT BEP-20 wallet QR code"
                      className="w-36 h-36 object-contain rounded-xl"
                    />
                  </div>

                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400">
                        USDT
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] font-bold text-zinc-400">
                        BNB Smart Chain
                      </span>
                    </div>

                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      BEP-20 Wallet Address
                    </p>
                    <p className="text-sm font-mono font-bold text-amber-400 break-all select-all mt-2">
                      {WALLET_ADDRESS}
                    </p>

                    <button
                      type="button"
                      onClick={copyAddress}
                      className={`mt-4 px-4 py-2 border text-xs font-bold rounded-lg transition-all ${
                        copied
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      {copied ? 'Copied!' : 'Copy Address'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 text-xs text-amber-500/90 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Send <strong className="text-amber-400">USDT on BNB Smart Chain (BEP-20) only</strong>.
                  Verify both the network and address before confirming the transfer.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-6">
              Submit Deposit Claim
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-sm flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="deposit-amount" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Deposit Amount (USDT)
                  </label>
                  <input
                    id="deposit-amount"
                    type="number"
                    min="10"
                    max="100000"
                    step="1"
                    placeholder="1,500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm font-mono placeholder-zinc-700 focus:outline-none focus:border-amber-500"
                    disabled={submitting}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="deposit-hash" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Transaction Hash (TXID)
                  </label>
                  <input
                    id="deposit-hash"
                    type="text"
                    placeholder="Paste your BEP-20 transaction hash"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm font-mono placeholder-zinc-700 focus:outline-none focus:border-amber-500"
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Transaction Screenshot Proof
                </label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-amber-500 bg-amber-500/5'
                      : screenshot
                        ? 'border-zinc-700 bg-zinc-900/10'
                        : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileChange(file);
                    }}
                    className="hidden"
                  />

                  {screenshot ? (
                    <div className="space-y-4">
                      <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                        <FileText className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-200">
                          Screenshot Loaded Successfully
                        </p>
                        <p className="text-xs text-zinc-500 font-mono mt-1">
                          {fileName}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setScreenshot(null);
                          setFileName('');
                        }}
                        className="text-xs font-bold text-rose-400 hover:text-rose-300"
                      >
                        Remove Screenshot
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-zinc-300">
                        Drag & drop transaction screenshot here
                      </p>
                      <p className="text-xs text-zinc-500">
                        or click to browse from computer (Max 800 KB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#D4AF37] hover:bg-[#F9E29B] text-[#050505] font-extrabold rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting Claim...' : 'Submit Deposit Request'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900 rounded-2xl p-5 h-[620px] flex flex-col overflow-hidden">
          <h2 className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-wider">
            Claims History
          </h2>

          {deposits.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <Download className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-sm font-bold text-zinc-400">
                No deposit claims found
              </p>
              <p className="text-xs mt-1">
                Submitted BEP-20 USDT requests will appear here.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {deposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl space-y-3"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="text-xs text-zinc-500 font-semibold">
                        {formatDate(deposit.createdAt)}
                      </p>
                      <p className="text-base font-extrabold font-mono text-white mt-1">
                        {formatCurrency(deposit.amount)}
                      </p>
                    </div>

                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      deposit.status === 'pending'
                        ? 'bg-amber-950/40 border border-amber-500/30 text-amber-400'
                        : deposit.status === 'approved'
                          ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-950/40 border border-rose-500/30 text-rose-400'
                    }`}>
                      {deposit.status}
                    </span>
                  </div>

                  <div className="border-t border-zinc-800/60 pt-2.5 text-xs flex justify-between gap-3">
                    <span className="text-zinc-500">TXID:</span>
                    <span className="font-mono text-zinc-300 font-bold truncate max-w-[150px]" title={deposit.txHash}>
                      {deposit.txHash}
                    </span>
                  </div>

                  {deposit.status === 'approved' && (
                    <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Funded to Wallet
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
