import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTrading, MARKET_ASSETS } from '../context/TradingContext';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  PlusCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { wallet, userProfile } = useAuth();
  const { openTrades, prices, closePosition } = useTrading();

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  // Margin level percentage
  const marginLevel = wallet && wallet.margin > 0 ? (wallet.equity / wallet.margin) * 100 : null;

  // Let's count open positions and average lots
  const totalOpenLots = openTrades.reduce((sum, trade) => sum + trade.lots, 0);

  // Today's closed profit/loss simulation or calculation based on history
  const todayClosedPL = 0; // standard closed trades P/L on active account
  const todayFloatingPL = wallet?.floatingPL || 0;
  const todayTotalPL = todayClosedPL + todayFloatingPL;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">
            Trading Dashboard
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Welcome back, <span className="text-amber-400 font-semibold">{userProfile?.displayName || 'Trader'}</span>. Keep track of your demo equity and float.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/deposit"
            className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-sm font-semibold hover:border-zinc-700 transition-all flex items-center gap-2"
          >
            Deposit USDT
          </Link>
          <Link
            to="/trade"
            className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#F9E29B] text-[#050505] font-extrabold rounded-xl text-sm transition-all hover:scale-[1.01] flex items-center gap-2 shadow-[0_4px_15px_rgba(212,175,55,0.15)] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Open Trade
          </Link>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Balance Card */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40 group-hover:text-amber-500/10 transition-colors">
            <DollarSign className="w-12 h-12 -mr-2 -mt-2 stroke-[1]" />
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Balance
          </p>
          <p className="text-2xl font-bold text-white font-mono mt-1.5">
            {formatCurrency(wallet?.balance)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="text-zinc-500">Starting:</span>
            <span className="font-semibold font-mono text-zinc-300">$10,000.00</span>
          </div>
        </div>

        {/* Equity Card */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group shadow-[0_0_20px_rgba(245,158,11,0.02)]">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40 group-hover:text-amber-500/10 transition-colors">
            <Briefcase className="w-12 h-12 -mr-2 -mt-2 stroke-[1]" />
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Equity
          </p>
          <p className="text-2xl font-bold text-amber-400 font-mono mt-1.5">
            {formatCurrency(wallet?.equity)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="text-zinc-500">Net Value:</span>
            <span className="font-semibold font-mono text-zinc-300">{formatCurrency(wallet?.equity)}</span>
          </div>
        </div>

        {/* Floating P/L Card */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40">
            {todayFloatingPL >= 0 ? (
              <TrendingUp className="w-12 h-12 -mr-2 -mt-2 stroke-[1] text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors" />
            ) : (
              <TrendingDown className="w-12 h-12 -mr-2 -mt-2 stroke-[1] text-rose-500/5 group-hover:text-rose-500/10 transition-colors" />
            )}
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Floating P/L
          </p>
          <p className={`text-2xl font-bold font-mono mt-1.5 ${todayFloatingPL >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            {todayFloatingPL >= 0 ? '+' : ''}{formatCurrency(todayFloatingPL)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="text-zinc-500">Active Positions:</span>
            <span className="font-semibold font-mono text-zinc-300">{openTrades.length}</span>
          </div>
        </div>

        {/* Today's P/L Card */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40">
            {todayTotalPL >= 0 ? (
              <TrendingUp className="w-12 h-12 -mr-2 -mt-2 stroke-[1] text-emerald-500/5" />
            ) : (
              <TrendingDown className="w-12 h-12 -mr-2 -mt-2 stroke-[1] text-rose-500/5" />
            )}
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Today's P/L
          </p>
          <p className={`text-2xl font-bold font-mono mt-1.5 ${todayTotalPL >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            {todayTotalPL >= 0 ? '+' : ''}{formatCurrency(todayTotalPL)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="text-zinc-500">Closed + Floating:</span>
            <span className={`font-semibold font-mono ${todayTotalPL >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {todayTotalPL >= 0 ? '+' : ''}{formatCurrency(todayTotalPL)}
            </span>
          </div>
        </div>

        {/* Used Margin Card */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40">
            <Layers className="w-12 h-12 -mr-2 -mt-2 stroke-[1]" />
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Used Margin
          </p>
          <p className="text-2xl font-bold text-white font-mono mt-1.5">
            {formatCurrency(wallet?.margin)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="text-zinc-500">Reserved Cap:</span>
            <span className="font-semibold font-mono text-zinc-300">1:100 Leverage</span>
          </div>
        </div>

        {/* Free Margin Card */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40">
            <Layers className="w-12 h-12 -mr-2 -mt-2 stroke-[1]" />
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Free Margin
          </p>
          <p className="text-2xl font-bold text-white font-mono mt-1.5">
            {formatCurrency(wallet?.freeMargin)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="text-zinc-500">Available to open:</span>
            <span className="font-semibold font-mono text-zinc-300">{formatCurrency(wallet?.freeMargin)}</span>
          </div>
        </div>

        {/* Margin Level % Card */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40">
            <Activity className="w-12 h-12 -mr-2 -mt-2 stroke-[1]" />
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Margin Level %
          </p>
          <p className="text-2xl font-bold text-white font-mono mt-1.5">
            {marginLevel !== null ? `${marginLevel.toFixed(1)}%` : '∞'}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="text-zinc-500">Stop-out Level:</span>
            <span className="font-semibold font-mono text-rose-500">50.0%</span>
          </div>
        </div>

        {/* Evaluation Target Card */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40">
            <ArrowUpRight className="w-12 h-12 -mr-2 -mt-2 stroke-[1]" />
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Funded Target
          </p>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-1.5">
            {wallet ? `${Math.min(100, Math.max(0, (wallet.balance / 11000) * 100)).toFixed(1)}%` : '0%'}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="text-zinc-500">Target:</span>
            <span className="font-semibold font-mono text-zinc-300">$11,000.00 (+10%)</span>
          </div>
        </div>
      </div>

      {/* Prop Firm Target Progress / Evaluation Alerts */}
      {marginLevel !== null && marginLevel < 150 && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3.5 shadow-[inset_0_0_15px_rgba(245,158,11,0.02)]">
          <Activity className="w-5 h-5 text-amber-500 animate-pulse shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Warning: Margin Level Low</p>
            <p className="text-xs text-zinc-400 mt-1">
              Your margin level is under 150%. A Margin Call triggers if it drops below 100%. If your level falls below 50%, the system will execute an automatic **Stop Out (Liquidation)** to prevent negative balances.
            </p>
          </div>
        </div>
      )}

      {/* Open Positions Panel */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-6 py-5 border-b border-zinc-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h2 className="text-lg font-bold tracking-tight text-white font-sans">
              Open Positions ({openTrades.length})
            </h2>
          </div>
          {openTrades.length > 0 && (
            <div className="text-xs text-zinc-500 font-semibold font-mono">
              Total Lots Active: {totalOpenLots.toFixed(2)}
            </div>
          )}
        </div>

        {openTrades.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Activity className="w-12 h-12 text-zinc-800 mx-auto mb-4 stroke-[1]" />
            <p className="text-base font-semibold text-zinc-300">No open positions found</p>
            <p className="text-xs text-zinc-500 mt-1 mb-5">
              Select an asset on the trading board to place a market order.
            </p>
            <Link
              to="/trade"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#F9E29B] text-[#050505] font-extrabold rounded-xl text-xs hover:scale-[1.01] transition-all shadow-[0_4px_15px_rgba(212,175,55,0.15)] cursor-pointer"
            >
              Start Trading Now
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950 text-zinc-500 text-[10px] font-bold tracking-wider uppercase border-b border-zinc-900">
                  <th className="px-6 py-4">Symbol</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Lots</th>
                  <th className="px-6 py-4">Open Price</th>
                  <th className="px-6 py-4">Current Price</th>
                  <th className="px-6 py-4">Stop Loss (SL)</th>
                  <th className="px-6 py-4">Take Profit (TP)</th>
                  <th className="px-6 py-4 text-right">Profit / Loss (USD)</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {openTrades.map((trade) => {
                  const freshPrice = prices[trade.symbol];
                  const asset = MARKET_ASSETS[trade.symbol];
                  if (!freshPrice) return null;

                  const currentPrice = trade.type === 'buy' ? freshPrice.bid : freshPrice.ask;

                  // Dynamic live calculations
                  let tradePnl = 0;
                  if (trade.type === 'buy') {
                    tradePnl = (currentPrice - trade.openPrice) * trade.lots * asset.contractSize;
                  } else {
                    tradePnl = (trade.openPrice - currentPrice) * trade.lots * asset.contractSize;
                  }

                  if (trade.symbol.endsWith('JPY')) {
                    const usdjpyPrice = prices['USDJPY']?.lastPrice || 156;
                    tradePnl = tradePnl / usdjpyPrice;
                  }

                  const isProfit = tradePnl >= 0;

                  return (
                    <tr key={trade.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-white flex items-center gap-2">
                          {trade.symbol}
                          <span className="text-[10px] font-medium text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                            {asset.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            trade.type === 'buy'
                              ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400'
                              : 'bg-rose-950/40 border border-rose-500/30 text-rose-400'
                          }`}
                        >
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-zinc-300">
                        {trade.lots.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-zinc-300">
                        {trade.openPrice.toFixed(asset.digits)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-amber-400">
                        {currentPrice.toFixed(asset.digits)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-zinc-500">
                        {trade.sl ? trade.sl.toFixed(asset.digits) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-zinc-500">
                        {trade.tp ? trade.tp.toFixed(asset.digits) : '—'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap font-mono text-right font-bold text-sm ${
                        isProfit ? 'text-emerald-400' : 'text-rose-500'
                      }`}>
                        {isProfit ? '+' : ''}
                        {formatCurrency(tradePnl)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          id={`close-btn-${trade.id}`}
                          onClick={() => closePosition(trade.id)}
                          className="px-3.5 py-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-lg text-xs font-bold transition-all duration-150"
                        >
                          Close Out
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account Trading Rules & Limits Reference */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4">ForexArena Prop Evaluation Program</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-zinc-400">
          <div className="p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/40">
            <p className="font-bold text-zinc-200 mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Maximum Daily Loss (5%)
            </p>
            <p className="text-xs">
              Do not let your equity drop more than $500 in a single day. Maintain strict stop losses to secure your evaluation track.
            </p>
          </div>
          <div className="p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/40">
            <p className="font-bold text-zinc-200 mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Evaluation Profit Target (10%)
            </p>
            <p className="text-xs">
              Grow your account balance to $11,000 (+10%) to unlock funded mode and obtain professional proprietary capital.
            </p>
          </div>
          <div className="p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/40">
            <p className="font-bold text-zinc-200 mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Max Leverage (1:100)
            </p>
            <p className="text-xs">
              Use up to 1:100 leverage on majors, 1:50 on metals, and 1:10 on cryptocurrencies, simulating real institutional pricing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
