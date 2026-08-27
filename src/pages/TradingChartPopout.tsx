import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTrading } from '../context/TradingContext';
import TradingViewWidget from '../components/TradingViewWidget';
import { TrendingUp, TrendingDown, ArrowLeft, Maximize2 } from 'lucide-react';
import { TradeSymbol } from '../types';

const ALLOWED_SYMBOLS: TradeSymbol[] = [
  'XAUUSD',
  'XAGUSD',
  'BTCUSD',
  'ETHUSD',
  'SOLUSD',
  'BNBUSD',
  'XRPUSD',
];

export default function TradingChartPopout() {
  const [searchParams] = useSearchParams();

  const {
    prices,
    activeSymbol,
    setActiveSymbol,
    openPosition,
    openTrades,
    closePosition,
  } = useTrading();

  const querySymbol = searchParams.get('symbol') as TradeSymbol | null;
  const initialSymbol = querySymbol && ALLOWED_SYMBOLS.includes(querySymbol)
    ? querySymbol
    : ALLOWED_SYMBOLS.includes(activeSymbol)
      ? activeSymbol
      : 'XAUUSD';

  const [symbol, setSymbol] = React.useState<TradeSymbol>(initialSymbol);
  const [quickLots, setQuickLots] = React.useState(0.1);
  const [quickSL, setQuickSL] = React.useState('');
  const [quickTP, setQuickTP] = React.useState('');
  const [error, setError] = React.useState('');
  const [placing, setPlacing] = React.useState(false);

  React.useEffect(() => {
    if (querySymbol && ALLOWED_SYMBOLS.includes(querySymbol)) {
      setSymbol(querySymbol);
      setActiveSymbol(querySymbol);
    }
  }, [querySymbol, setActiveSymbol]);

  const activePrice = prices[symbol];
  const symbolTrades = openTrades.filter((trade) => trade.symbol === symbol);

  const dailyChange =
    activePrice?.changeStatus === 'ok'
      ? `${activePrice.changePercent >= 0 ? '+' : ''}${activePrice.changePercent.toFixed(2)}%`
      : '--';

  const normalizeLots = (value: number) =>
    Number(Math.min(50, Math.max(0.01, value)).toFixed(2));

  const handleQuickOrder = async (type: 'buy' | 'sell') => {
    try {
      setError('');
      setPlacing(true);

      const lots = normalizeLots(quickLots);
      const sl = quickSL ? Number(quickSL) : undefined;
      const tp = quickTP ? Number(quickTP) : undefined;

      if (activePrice) {
        const entry = type === 'buy' ? activePrice.ask : activePrice.bid;

        if (type === 'buy') {
          if (sl !== undefined && sl >= entry) {
            throw new Error('Stop Loss for BUY must be below the Ask Price.');
          }
          if (tp !== undefined && tp <= entry) {
            throw new Error('Take Profit for BUY must be above the Ask Price.');
          }
        } else {
          if (sl !== undefined && sl <= entry) {
            throw new Error('Stop Loss for SELL must be above the Bid Price.');
          }
          if (tp !== undefined && tp >= entry) {
            throw new Error('Take Profit for SELL must be below the Bid Price.');
          }
        }
      }

      await openPosition(type, lots, sl, tp);
      setQuickLots(lots);
      setQuickSL('');
      setQuickTP('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setPlacing(false);
    }
  };

  const handleClose = async (tradeId: string) => {
    try {
      setError('');
      await closePosition(tradeId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to close position.');
    }
  };

  const openChartWindow = () => {
    window.moveTo(0, 0);
    window.resizeTo(window.screen.availWidth, window.screen.availHeight);
  };

  return (
    <div className="w-screen h-screen min-w-0 min-h-0 overflow-hidden bg-[#050505] text-white flex flex-col">
      <header className="h-16 shrink-0 border-b border-zinc-900 bg-[#080808] px-4 lg:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => window.close()}
            className="w-9 h-9 shrink-0 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
            title="Close popout"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600">
              Trading Terminal
            </p>
            <p className="text-sm font-bold truncate">{symbol}</p>
          </div>

          <select
            value={symbol}
            onChange={(e) => {
              const next = e.target.value as TradeSymbol;
              if (!ALLOWED_SYMBOLS.includes(next)) return;
              setSymbol(next);
              setActiveSymbol(next);
              setError('');
            }}
            className="ml-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 outline-none"
          >
            {ALLOWED_SYMBOLS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-5 text-xs font-mono">
          {activePrice && (
            <>
              <div className="hidden sm:block">
                <span className="text-zinc-600 mr-2">BID</span>
                <span className="text-emerald-400">
                  {activePrice.bid.toFixed(2)}
                </span>
              </div>

              <div className="hidden sm:block">
                <span className="text-zinc-600 mr-2">ASK</span>
                <span className="text-amber-400">
                  {activePrice.ask.toFixed(2)}
                </span>
              </div>

              <div>
                <span className="text-zinc-600 mr-2">DAY</span>
                <span
                  className={
                    activePrice.changeStatus === 'ok'
                      ? activePrice.changePercent >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                      : 'text-zinc-500'
                  }
                >
                  {dailyChange}
                </span>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={openChartWindow}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white text-xs font-bold"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Maximize
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
        <section className="flex-1 min-h-0 min-w-0 p-3 overflow-hidden">
          <div className="h-full w-full min-h-0 min-w-0 rounded-2xl border border-zinc-900 bg-zinc-950 overflow-hidden">
            <div className="w-full h-full min-w-0 min-h-0">
              <TradingViewWidget symbol={symbol} />
            </div>
          </div>
        </section>

        <section className="h-[300px] shrink-0 border-t border-zinc-900 bg-[#080808] p-3 min-w-0 overflow-hidden">
          <div className="h-full min-w-0 grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-3">
            <div className="min-w-0 h-full rounded-2xl border border-zinc-900 bg-zinc-950 p-4 flex flex-col">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                    Quick Trade
                  </p>
                  <h2 className="mt-1 text-sm font-bold text-white">{symbol}</h2>
                </div>

                <div className="text-right">
                  <p className="text-[9px] uppercase text-zinc-600">Spread</p>
                  <p className="text-xs font-mono text-zinc-300">
                    {activePrice
                      ? (activePrice.ask - activePrice.bid).toFixed(2)
                      : '—'}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mt-3 rounded-lg border border-red-500/20 bg-red-950/30 p-2.5 text-[10px] text-red-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 mt-4 items-end">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-zinc-600 mb-1.5">
                    Lots
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    max="50"
                    step="0.01"
                    value={quickLots}
                    onChange={(e) => setQuickLots(normalizeLots(Number(e.target.value) || 0.01))}
                    className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-mono text-center text-zinc-200 outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setQuickLots(normalizeLots(quickLots - 0.1))}
                  className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-bold"
                >
                  −
                </button>

                <button
                  type="button"
                  onClick={() => setQuickLots(normalizeLots(quickLots + 0.1))}
                  className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-bold"
                >
                  +
                </button>

                <div className="text-[9px] uppercase tracking-wider text-zinc-600 pb-2">
                  LOT
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-zinc-600 mb-1.5">
                    Stop Loss
                  </label>
                  <input
                    type="number"
                    value={quickSL}
                    onChange={(e) => setQuickSL(e.target.value)}
                    placeholder="Optional"
                    className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-zinc-600 mb-1.5">
                    Take Profit
                  </label>
                  <input
                    type="number"
                    value={quickTP}
                    onChange={(e) => setQuickTP(e.target.value)}
                    placeholder="Optional"
                    className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button
                  type="button"
                  disabled={placing || !activePrice}
                  onClick={() => void handleQuickOrder('buy')}
                  className="h-16 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-extrabold text-xs flex flex-col items-center justify-center gap-1"
                >
                  <TrendingUp className="w-5 h-5" />
                  BUY / LONG
                  <span className="font-mono text-[10px] opacity-70">
                    Ask {activePrice?.ask.toFixed(2) ?? '—'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={placing || !activePrice}
                  onClick={() => void handleQuickOrder('sell')}
                  className="h-16 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-black font-extrabold text-xs flex flex-col items-center justify-center gap-1"
                >
                  <TrendingDown className="w-5 h-5" />
                  SELL / SHORT
                  <span className="font-mono text-[10px] opacity-70">
                    Bid {activePrice?.bid.toFixed(2) ?? '—'}
                  </span>
                </button>
              </div>
            </div>

            <div className="min-w-0 h-full rounded-2xl border border-zinc-900 bg-zinc-950 overflow-hidden flex flex-col">
              <div className="h-14 shrink-0 px-4 border-b border-zinc-900 flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                    Running Positions
                  </p>
                  <p className="text-sm font-bold mt-1">
                    {symbolTrades.length} active
                  </p>
                </div>

                <div className="text-[10px] font-mono text-zinc-600">{symbol}</div>
              </div>

              <div className="flex-1 min-h-0 overflow-auto">
                {symbolTrades.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-700">
                    No running positions for {symbol}.
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-zinc-950">
                      <tr className="text-[9px] uppercase tracking-wider text-zinc-600 border-b border-zinc-900">
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Lots</th>
                        <th className="px-4 py-3">Open</th>
                        <th className="px-4 py-3">SL</th>
                        <th className="px-4 py-3">TP</th>
                        <th className="px-4 py-3">P/L</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {symbolTrades.map((trade) => {
                        const live = prices[trade.symbol];
                        const exitPrice = live
                          ? trade.type === 'buy'
                            ? live.bid
                            : live.ask
                          : trade.openPrice;

                        const contractSize =
                          trade.symbol === 'XAUUSD'
                            ? 100
                            : trade.symbol === 'XAGUSD'
                              ? 5000
                              : 1;

                        const pnl =
                          trade.type === 'buy'
                            ? (exitPrice - trade.openPrice) * trade.lots * contractSize
                            : (trade.openPrice - exitPrice) * trade.lots * contractSize;

                        return (
                          <tr key={trade.id} className="border-b border-zinc-900/70">
                            <td className={`px-4 py-3 text-[10px] font-bold ${
                              trade.type === 'buy'
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}>
                              {trade.type.toUpperCase()}
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-zinc-300">
                              {Number(trade.lots).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-zinc-400">
                              {trade.openPrice}
                            </td>
                            <td className="px-4 py-3 text-[10px] font-mono text-zinc-500">
                              {trade.sl ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-[10px] font-mono text-zinc-500">
                              {trade.tp ?? '—'}
                            </td>
                            <td className={`px-4 py-3 text-xs font-mono font-bold ${
                              pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => void handleClose(trade.id)}
                                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-white hover:border-zinc-700"
                              >
                                Close
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
