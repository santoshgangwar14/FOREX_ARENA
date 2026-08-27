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
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { wallet, userProfile } = useAuth();
  const { openTrades, prices, closePosition } = useTrading();

  const formatCurrency = (val: number | undefined) => {
    const value = Number(val || 0);

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const balance = Number(wallet?.balance || 0);
  const equity = Number(wallet?.equity ?? balance);
  const margin = Number(wallet?.margin || 0);
  const freeMargin = Number(
    wallet?.freeMargin ?? Math.max(0, equity - margin)
  );
  const floatingPL = Number(wallet?.floatingPL || 0);

  const marginLevel =
    margin > 0 ? (equity / margin) * 100 : null;

  const totalOpenLots = openTrades.reduce(
    (sum, trade) => sum + trade.lots,
    0
  );

  // Replace with closed-trade history when available.
  const todayClosedPL = 0;
  const todayTotalPL = todayClosedPL + floatingPL;

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Trading Dashboard
          </h1>

          <p className="text-sm text-zinc-400 mt-1">
            Welcome back,{' '}
            <span className="text-amber-400 font-semibold">
              {userProfile?.displayName || 'Trader'}
            </span>
            . Monitor your trading account and positions.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/deposit"
            className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-sm font-semibold hover:border-zinc-700 transition-all flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            Deposit
          </Link>

          <Link
            to="/trade"
            className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#F9E29B] text-[#050505] font-extrabold rounded-xl text-sm transition-all hover:scale-[1.01] flex items-center gap-2 shadow-[0_4px_15px_rgba(212,175,55,0.15)]"
          >
            <PlusCircle className="w-4 h-4" />
            Open Trade
          </Link>
        </div>
      </div>

      {/* Account Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Balance */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40 group-hover:text-amber-500/10 transition-colors">
            <DollarSign className="w-12 h-12 -mr-2 -mt-2 stroke-[1]" />
          </div>

          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Balance
          </p>

          <p className="text-2xl font-bold text-white font-mono mt-1.5">
            {formatCurrency(balance)}
          </p>

          <div className="mt-3 text-[11px] text-zinc-500">
            Account balance
          </div>
        </div>

        {/* Equity */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40">
            <Briefcase className="w-12 h-12 -mr-2 -mt-2 stroke-[1]" />
          </div>

          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Equity
          </p>

          <p className="text-2xl font-bold text-amber-400 font-mono mt-1.5">
            {formatCurrency(equity)}
          </p>

          <div className="mt-3 text-[11px] text-zinc-500">
            Balance + floating P/L
          </div>
        </div>

        {/* Floating P/L */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40">
            {floatingPL >= 0 ? (
              <TrendingUp className="w-12 h-12 -mr-2 -mt-2 stroke-[1] text-emerald-500/10" />
            ) : (
              <TrendingDown className="w-12 h-12 -mr-2 -mt-2 stroke-[1] text-rose-500/10" />
            )}
          </div>

          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Floating P/L
          </p>

          <p
            className={`text-2xl font-bold font-mono mt-1.5 ${
              floatingPL >= 0
                ? 'text-emerald-400'
                : 'text-rose-500'
            }`}
          >
            {floatingPL >= 0 ? '+' : ''}
            {formatCurrency(floatingPL)}
          </p>

          <div className="mt-3 text-[11px] text-zinc-500">
            Active Positions:{' '}
            <span className="font-semibold text-zinc-300">
              {openTrades.length}
            </span>
          </div>
        </div>

        {/* Today's P/L */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40">
            {todayTotalPL >= 0 ? (
              <TrendingUp className="w-12 h-12 -mr-2 -mt-2 stroke-[1] text-emerald-500/10" />
            ) : (
              <TrendingDown className="w-12 h-12 -mr-2 -mt-2 stroke-[1] text-rose-500/10" />
            )}
          </div>

          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Today's P/L
          </p>

          <p
            className={`text-2xl font-bold font-mono mt-1.5 ${
              todayTotalPL >= 0
                ? 'text-emerald-400'
                : 'text-rose-500'
            }`}
          >
            {todayTotalPL >= 0 ? '+' : ''}
            {formatCurrency(todayTotalPL)}
          </p>

          <div className="mt-3 text-[11px] text-zinc-500">
            Closed + Floating
          </div>
        </div>

        {/* Used Margin */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40">
            <Layers className="w-12 h-12 -mr-2 -mt-2 stroke-[1]" />
          </div>

          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Used Margin
          </p>

          <p className="text-2xl font-bold text-white font-mono mt-1.5">
            {formatCurrency(margin)}
          </p>

          <div className="mt-3 text-[11px] text-zinc-500">
            Margin currently in use
          </div>
        </div>

        {/* Free Margin */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40">
            <Layers className="w-12 h-12 -mr-2 -mt-2 stroke-[1]" />
          </div>

          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Free Margin
          </p>

          <p className="text-2xl font-bold text-white font-mono mt-1.5">
            {formatCurrency(freeMargin)}
          </p>

          <div className="mt-3 text-[11px] text-zinc-500">
            Available for new positions
          </div>
        </div>

        {/* Margin Level */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40">
            <Activity className="w-12 h-12 -mr-2 -mt-2 stroke-[1]" />
          </div>

          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Margin Level
          </p>

          <p className="text-2xl font-bold text-white font-mono mt-1.5">
            {marginLevel !== null
              ? `${marginLevel.toFixed(1)}%`
              : '—'}
          </p>

          <div className="mt-3 text-[11px] text-zinc-500">
            Equity / Used Margin
          </div>
        </div>

        {/* Leverage */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40">
            <Activity className="w-12 h-12 -mr-2 -mt-2 stroke-[1]" />
          </div>

          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Leverage
          </p>

          <p className="text-2xl font-bold text-white font-mono mt-1.5">
            1:100
          </p>

          <div className="mt-3 text-[11px] text-zinc-500">
            Account leverage
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-zinc-800/40">
            <Briefcase className="w-12 h-12 -mr-2 -mt-2 stroke-[1]" />
          </div>

          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Account Status
          </p>

          <p className="text-2xl font-bold text-emerald-400 mt-1.5">
            Active
          </p>

          <div className="mt-3 text-[11px] text-zinc-500">
            Trading account is active
          </div>
        </div>
      </div>

      {/* Margin Warning */}
      {marginLevel !== null && marginLevel < 150 && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3.5">
          <Activity className="w-5 h-5 text-amber-500 animate-pulse shrink-0 mt-0.5" />

          <div>
            <p className="text-sm font-semibold text-amber-400">
              Margin Level Low
            </p>

            <p className="text-xs text-zinc-400 mt-1">
              Your available margin is getting low. Consider
              reducing exposure or adding funds to your account.
            </p>
          </div>
        </div>
      )}

      {/* Open Positions */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-lg">

        <div className="px-6 py-5 border-b border-zinc-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />

            <h2 className="text-lg font-bold tracking-tight text-white">
              Open Positions ({openTrades.length})
            </h2>
          </div>

          {openTrades.length > 0 && (
            <div className="text-xs text-zinc-500 font-semibold font-mono">
              Total Lots: {totalOpenLots.toFixed(2)}
            </div>
          )}
        </div>

        {openTrades.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Activity className="w-12 h-12 text-zinc-800 mx-auto mb-4 stroke-[1]" />

            <p className="text-base font-semibold text-zinc-300">
              No open positions
            </p>

            <p className="text-xs text-zinc-500 mt-1 mb-5">
              Select an asset on the trading terminal to place
              a market order.
            </p>

            <Link
              to="/trade"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#F9E29B] text-[#050505] font-extrabold rounded-xl text-xs transition-all"
            >
              Open Trading Terminal
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
                  <th className="px-6 py-4">SL</th>
                  <th className="px-6 py-4">TP</th>
                  <th className="px-6 py-4 text-right">
                    P/L (USD)
                  </th>
                  <th className="px-6 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-900">

                {openTrades.map((trade) => {
                  const freshPrice = prices[trade.symbol];
                  const asset = MARKET_ASSETS[trade.symbol];

                  if (!freshPrice || !asset) return null;

                  const currentPrice =
                    trade.type === 'buy'
                      ? freshPrice.bid
                      : freshPrice.ask;

                  let tradePnl = 0;

                  if (trade.type === 'buy') {
                    tradePnl =
                      (currentPrice - trade.openPrice) *
                      trade.lots *
                      asset.contractSize;
                  } else {
                    tradePnl =
                      (trade.openPrice - currentPrice) *
                      trade.lots *
                      asset.contractSize;
                  }

                  if (trade.symbol.endsWith('JPY')) {
                    const usdjpyPrice =
                      prices['USDJPY']?.lastPrice || 156;

                    tradePnl /= usdjpyPrice;
                  }

                  const isProfit = tradePnl >= 0;

                  return (
                    <tr
                      key={trade.id}
                      className="hover:bg-zinc-900/30 transition-colors"
                    >
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
                        {trade.sl
                          ? trade.sl.toFixed(asset.digits)
                          : '—'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-zinc-500">
                        {trade.tp
                          ? trade.tp.toFixed(asset.digits)
                          : '—'}
                      </td>

                      <td
                        className={`px-6 py-4 whitespace-nowrap font-mono text-right font-bold text-sm ${
                          isProfit
                            ? 'text-emerald-400'
                            : 'text-rose-500'
                        }`}
                      >
                        {isProfit ? '+' : ''}
                        {formatCurrency(tradePnl)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() =>
                            closePosition(trade.id)
                          }
                          className="px-3.5 py-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-lg text-xs font-bold transition-all"
                        >
                          Close
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
    </div>
  );
}