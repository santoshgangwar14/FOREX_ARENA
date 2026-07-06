import React, { useState, useRef } from 'react';
import { useTrading } from '../context/TradingContext';
import { Download, Upload, Coins, CheckCircle, Info, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Deposit() {
  const { deposits, createDeposit } = useTrading();

  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Convert uploaded image to base64 for persistent Firestore storage
  const handleFileChange = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, JPEG).');
      return;
    }

    // Limit size to 1MB to avoid Firestore doc payload overflow limit (1MB max doc limit)
    if (file.size > 800 * 1024) {
      setError('Screenshot is too large. Please upload an image under 800 KB.');
      return;
    }

    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setScreenshot(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => {
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid deposit amount.');
      return;
    }

    if (!txHash.trim()) {
      setError('Transaction Hash is required to verify the deposit.');
      return;
    }

    if (!screenshot) {
      setError('Please upload or drop a screenshot of the transaction.');
      return;
    }

    try {
      setSubmitting(true);
      await createDeposit(numericAmount, txHash.trim(), screenshot);

      setSuccess('Your deposit request has been submitted successfully! An administrator will review and approve it shortly.');
      setAmount('');
      setTxHash('');
      setScreenshot(null);
      setFileName('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit deposit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="border-b border-zinc-900 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Account Deposit</h1>
        <p className="text-sm text-zinc-400 mt-1">Fund your demo trading balance via secure TRC20 USDT payments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Instructions & Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* TRC20 Payment Instructions banner */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-500 pointer-events-none">
              <Coins className="w-48 h-48 -mr-12 -mt-12" />
            </div>
            
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4 font-sans">
              <Coins className="w-5 h-5 text-amber-500" />
              USDT (TRC-20) Payment Details
            </h2>

            <div className="space-y-4 text-sm text-zinc-400">
              <p>
                To fund your demo trading desk account, send the desired USDT TRC20 amount to the corporate escrow wallet address listed below. 
              </p>

              <div className="bg-zinc-900/60 border border-zinc-850 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">TRC20 Wallet Address</p>
                  <p className="text-sm font-mono font-bold text-amber-400 select-all mt-1">
                    TXN9fM1U2cQ8vM5T6rB4eG9sY2zK5wV8pH
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('TXN9fM1U2cQ8vM5T6rB4eG9sY2zK5wV8pH');
                    alert('USDT TRC20 address copied to clipboard!');
                  }}
                  className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-xs font-bold text-zinc-300 hover:border-zinc-700 hover:text-white rounded-lg transition-all shrink-0"
                >
                  Copy Address
                </button>
              </div>

              <div className="flex gap-2 text-xs text-amber-500/80 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Ensure you only send **USDT on the TRON network (TRC-20)**. Sending any other asset or utilizing other networks (e.g., ERC-20, BSC) will result in irreversible loss of capital.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 font-sans">Submit Deposit Claim</h2>

            {error && (
              <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-sm flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Deposit Amount (USDT)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-500 font-mono text-sm">$</span>
                    <input
                      id="deposit-amount"
                      type="number"
                      min="10"
                      max="100000"
                      step="1"
                      placeholder="1,500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-zinc-950 border border-zinc-850 rounded-xl text-white text-sm font-mono placeholder-zinc-700 focus:outline-none focus:border-amber-500"
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Transaction Hash (TXID)
                  </label>
                  <input
                    id="deposit-hash"
                    type="text"
                    placeholder="e.g. 7f0a8c4b2d5e..."
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-850 rounded-xl text-white text-sm font-mono placeholder-zinc-700 focus:outline-none focus:border-amber-500"
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              {/* Drag and Drop Screenshot block */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Transaction Screenshot Proof
                </label>
                
                <div
                  id="dropzone"
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-amber-500 bg-amber-500/5'
                      : screenshot
                      ? 'border-zinc-850 bg-zinc-900/10'
                      : 'border-zinc-850 hover:border-zinc-800 bg-zinc-950'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                    className="hidden"
                  />

                  {screenshot ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-sm">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-200">Screenshot Loaded Successfully</p>
                        <p className="text-xs text-zinc-500 font-mono mt-1">{fileName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setScreenshot(null);
                          setFileName('');
                        }}
                        className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        Remove Screenshot
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-400 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-300">Drag & drop transaction screenshot here</p>
                        <p className="text-xs text-zinc-500 mt-1">or click to browse from computer (Max 800 KB)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                id="deposit-submit-btn"
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#D4AF37] hover:bg-[#F9E29B] text-[#050505] font-extrabold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.15)] disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {submitting ? 'Submitting Claims...' : 'Submit Deposit Request'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Personal Deposit Claim History */}
        <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900 rounded-2xl p-5 h-[620px] flex flex-col overflow-hidden">
          <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-zinc-400">Claims History</h2>

          {deposits.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-center p-6">
              <Download className="w-10 h-10 text-zinc-850 mb-3 stroke-[1]" />
              <p className="text-sm font-bold text-zinc-350">No deposit claims found</p>
              <p className="text-xs text-zinc-500 mt-1">Any submitted USDT deposit requests will appear here for audit tracking.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {deposits.map((dep) => (
                <div key={dep.id} className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-zinc-500 font-semibold">{formatDate(dep.createdAt)}</p>
                      <p className="text-base font-extrabold font-mono text-white mt-1">
                        {formatCurrency(dep.amount)}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        dep.status === 'pending'
                          ? 'bg-amber-950/40 border border-amber-500/30 text-amber-400'
                          : dep.status === 'approved'
                          ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-950/40 border border-rose-500/30 text-rose-400'
                      }`}
                    >
                      {dep.status}
                    </span>
                  </div>

                  <div className="border-t border-zinc-850/60 pt-2.5 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">TXID:</span>
                      <span className="font-mono text-zinc-300 font-bold truncate max-w-[120px]" title={dep.txHash}>
                        {dep.txHash}
                      </span>
                    </div>
                    {dep.status === 'approved' && (
                      <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Funded to Wallet
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
