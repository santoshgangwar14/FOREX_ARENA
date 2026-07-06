import React, { useState } from 'react';
import { useTrading, MARKET_ASSETS } from '../context/TradingContext';
import { Activity, Clock, FileText, CheckCircle2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function History() {
  const { openTrades, closedTrades, prices } = useTrading();
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');

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
      second: '2-digit',
    });
  };

  // Calculate stats
  const totalTradesCount = closedTrades.length;
  const profitableTrades = closedTrades.filter((t) => t.pnl > 0).length;
  const winRate = totalTradesCount > 0 ? (profitableTrades / totalTradesCount) * 100 : 0;
  const totalNetPL = closedTrades.reduce((sum, t) => sum + t.pnl, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Title & Stats Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Trading History</h1>
          <p className="text-sm text-zinc-400 mt-1">Review your active contracts and historical prop performance metrics.</p>
        </div>
      </div>

      {/* Mini Performance Cards for Closed Trades */}
      {closedTrades.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Closed Trades</p>
            <p className="text-2xl font-bold font-mono text-white mt-1.5">{totalTradesCount}</p>
          </div>
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Win Rate</p>
            <p className="text-2xl font-bold font-mono text-amber-400 mt-1.5">{winRate.toFixed(1)}%</p>
            <p className="text-[10px] text-zinc-500 mt-1">
              {profitableTrades} won of {totalTradesCount} total
            </p>
          </div>
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-sans">Accumulated P/L</p>
            <p className={`text-2xl font-bold font-mono mt-1.5 ${totalNetPL >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {totalNetPL >= 0 ? '+' : ''}
              {formatCurrency(totalNetPL)}
            </p>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex border-b border-zinc-900">
        <button
          onClick={() => setActiveTab('open')}
          className={`px-6 py-3.5 text-sm font-bold tracking-wide border-b-2 transition-all ${
            activeTab === 'open'
              ? 'border-amber-500 text-amber-400 font-extrabold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Open Positions ({openTrades.length})
        </button>
        <button
          onClick={() => setActiveTab('closed')}
          className={`px-6 py-3.5 text-sm font-bold tracking-wide border-b-2 transition-all ${
            activeTab === 'closed'
              ? 'border-amber-500 text-amber-400 font-extrabold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Closed Trades ({closedTrades.length})
        </button>
      </div>

      {/* Main List Table */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
        {activeTab === 'open' ? (
          openTrades.length === 0 ? (
            <div className="p-16 text-center text-zinc-500">
              <Activity className="w-12 h-12 text-zinc-850 mx-auto mb-4 stroke-[1]" />
              <p className="text-base font-semibold text-zinc-300">No open positions</p>
              <p className="text-xs text-zinc-500 mt-1">
                Your currently active contracts will appear here. Go to the Trade tab to place an order.
              </p>
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
                    <th className="px-6 py-4">Open Time</th>
                    <th className="px-6 py-4 text-right">Profit / Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {openTrades.map((trade) => {
                    const freshPrice = prices[trade.symbol];
                    const asset = MARKET_ASSETS[trade.symbol];
                    if (!freshPrice) return null;

                    const currentPrice = trade.type === 'buy' ? freshPrice.bid : freshPrice.ask;

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
                      <tr key={trade.id} className="hover:bg-zinc-900/10 transition-colors">
                        <td className="px-6 py-4 font-bold text-white font-mono">{trade.symbol}</td>
                        <td className="px-6 py-4">
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
                        <td className="px-6 py-4 font-mono text-sm text-zinc-300">{trade.lots.toFixed(2)}</td>
                        <td className="px-6 py-4 font-mono text-sm text-zinc-300">{trade.openPrice.toFixed(asset.digits)}</td>
                        <td className="px-6 py-4 font-mono text-sm text-amber-400">{currentPrice.toFixed(asset.digits)}</td>
                        <td className="px-6 py-4 text-xs text-zinc-500 font-semibold">{formatDate(trade.openTime)}</td>
                        <td className={`px-6 py-4 font-mono text-right font-bold text-sm ${
                          isProfit ? 'text-emerald-400' : 'text-rose-500'
                        }`}>
                          {isProfit ? '+' : ''}
                          {formatCurrency(tradePnl)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : closedTrades.length === 0 ? (
          <div className="p-16 text-center text-zinc-500">
            <Clock className="w-12 h-12 text-zinc-850 mx-auto mb-4 stroke-[1]" />
            <p className="text-base font-semibold text-zinc-300">No closed trades yet</p>
            <p className="text-xs text-zinc-500 mt-1">
              Close an active position inside the Dashboard or Trading Board to start generating records.
            </p>
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
                  <th className="px-6 py-4">Close Price</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 text-right">Profit / Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {closedTrades.map((trade) => {
                  const asset = MARKET_ASSETS[trade.symbol];
                  const isProfit = trade.pnl >= 0;

                  // Calculate simple duration representation
                  const durationMs = (trade.closeTime || Date.now()) - trade.openTime;
                  const seconds = Math.floor(durationMs / 1000);
                  const minutes = Math.floor(seconds / 60);
                  const durationStr = minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;

                  return (
                    <tr key={trade.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-white font-mono">{trade.symbol}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{formatDate(trade.openTime)}</div>
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
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-zinc-300">{trade.lots.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-zinc-300">{trade.openPrice.toFixed(asset.digits)}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-zinc-300">
                        {trade.closePrice ? trade.closePrice.toFixed(asset.digits) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-400 font-semibold font-mono">{durationStr}</td>
                      <td className={`px-6 py-4 whitespace-nowrap font-mono text-right font-bold text-sm ${
                        isProfit ? 'text-emerald-400' : 'text-rose-500'
                      }`}>
                        {isProfit ? '+' : ''}
                        {formatCurrency(trade.pnl)}
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
