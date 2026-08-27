import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTrading } from '../context/TradingContext';
import TradingViewWidget from '../components/TradingViewWidget';
import { TrendingUp, TrendingDown, X, ArrowLeft } from 'lucide-react';

export default function TradingChartPopout() {
  const [searchParams] = useSearchParams();
  const { prices, activeSymbol, setActiveSymbol, openPosition, openTrades, closePosition } =
    useTrading();

  const symbolFromQuery = searchParams.get('symbol') || activeSymbol;
  const [symbol, setSymbol] = React.useState(symbolFromQuery);

  React.useEffect(() => {
    if (symbolFromQuery && symbolFromQuery !== symbol) {
      setSymbol(symbolFromQuery);
    }
  }, [symbolFromQuery]);

  const activePrice = prices[symbol as keyof typeof prices];
  const [quickLots, setQuickLots] = React.useState(0.1);
  const [quickSL, setQuickSL] = React.useState('');
  const [quickTP, setQuickTP] = React.useState('');

  const handleQuickOrder = async (type: 'buy' | 'sell') => {
    const lots = Math.min(
      50,
      Math.max(
        0.01,
        Number(quickLots) || 0.01
      )
    );

    setQuickLots(
      Number(lots.toFixed(2))
    );

    const sl = quickSL
      ? Number(quickSL)
      : undefined;

    const tp = quickTP
      ? Number(quickTP)
      : undefined;

    if (activePrice) {
      const entry =
        type === 'buy'
          ? activePrice.ask
          : activePrice.bid;

      if (type === 'buy') {
        if (sl !== undefined && sl >= entry) {
          throw new Error(
            'Stop Loss for BUY must be below the Ask Price.'
          );
        }

        if (tp !== undefined && tp <= entry) {
          throw new Error(
            'Take Profit for BUY must be above the Ask Price.'
          );
        }
      } else {
        if (sl !== undefined && sl <= entry) {
          throw new Error(
            'Stop Loss for SELL must be above the Bid Price.'
          );
        }

        if (tp !== undefined && tp >= entry) {
          throw new Error(
            'Take Profit for SELL must be below the Bid Price.'
          );
        }
      }
    }

    await openPosition(
      type,
      lots,
      sl,
      tp
    );
  };

  const handleClose = async (tradeId: string) => {
    const price = prices[symbol as keyof typeof prices];
    if (!price) return;

    await closePosition(
      tradeId,
      price.lastPrice
    );
  };

  const symbolTrades = openTrades.filter(
    (trade: any) => trade.symbol === symbol
  );

  return (
    <div className="min-h-screen h-screen w-screen max-w-full overflow-hidden bg-[#050505] text-white flex flex-col">
      <header className="h-14 shrink-0 border-b border-zinc-900 bg-[#080808] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.close()}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            title="Close window"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">
              Trading Popout
            </div>
            <div className="text-sm font-bold">
              {symbol}
            </div>
          </div>

          <select
            value={symbol}
            onChange={(e) => {
              setSymbol(e.target.value);
              setActiveSymbol(e.target.value as any);
            }}
            className="ml-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 outline-none"
          >
            {Object.keys(prices).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {activePrice && (
          <div className="hidden md:flex items-center gap-5 text-xs font-mono">
            <div>
              <span className="text-zinc-600 mr-2">BID</span>
              <span className="text-emerald-400">
                {activePrice.bid}
              </span>
            </div>
            <div>
              <span className="text-zinc-600 mr-2">ASK</span>
              <span className="text-rose-400">
                {activePrice.ask}
              </span>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
        {/* Chart */}
        <section className="flex-1 min-h-0 min-w-0 p-3 overflow-hidden">
          <div className="h-full min-h-0 min-w-0 w-full max-w-full bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
            <div className="w-full h-full min-w-0 max-w-full">
              <TradingViewWidget symbol={symbol as any} />
            </div>
          </div>
        </section>

        {/* Quick trading + running positions */}
        <section className="shrink-0 h-[250px] border-t border-zinc-900 bg-[#080808] p-3 grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-3 min-h-0 min-w-0 overflow-hidden">
          <div className="min-w-0 bg-zinc-950 border border-zinc-900 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                  Quick Trade
                </p>
                <p className="text-sm font-bold mt-1">
                  {symbol}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setQuickLots(
                      Number(
                        Math.max(
                          0.01,
                          quickLots - 0.1
                        ).toFixed(2)
                      )
                    )
                  }
                  className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold"
                >
                  −
                </button>

                <input
                  type="number"
                  min="0.01"
                  max="50"
                  step="0.01"
                  value={quickLots}
                  onChange={(e) =>
                    setQuickLots(
                      Number(e.target.value) || 0.01
                    )
                  }
                  className="w-20 h-7 px-2 rounded-md bg-zinc-900 border border-zinc-800 text-center text-[10px] font-mono text-zinc-200 outline-none focus:border-amber-500"
                  aria-label="Quick trade lot size"
                />

                <button
                  type="button"
                  onClick={() =>
                    setQuickLots(
                      Number(
                        Math.min(
                          50,
                          quickLots + 0.1
                        ).toFixed(2)
                      )
                    )
                  }
                  className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold"
                >
                  +
                </button>

                <span className="text-[9px] font-mono text-zinc-600">
                  LOT
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-zinc-600 mb-1">
                  Stop Loss
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={quickSL}
                  onChange={(e) =>
                    setQuickSL(e.target.value)
                  }
                  placeholder="Optional"
                  className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider text-zinc-600 mb-1">
                  Take Profit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={quickTP}
                  onChange={(e) =>
                    setQuickTP(e.target.value)
                  }
                  placeholder="Optional"
                  className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickOrder('buy')}
                className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs flex flex-col items-center gap-1"
              >
                <TrendingUp className="w-4 h-4" />
                BUY {quickLots.toFixed(2)}
                <span className="text-[9px] opacity-70">
                  {activePrice?.ask ?? '—'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickOrder('sell')}
                className="py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-black font-extrabold text-xs flex flex-col items-center gap-1"
              >
                <TrendingDown className="w-4 h-4" />
                SELL {quickLots.toFixed(2)}
                <span className="text-[9px] opacity-70">
                  {activePrice?.bid ?? '—'}
                </span>
              </button>
            </div>
          </div>

          <div className="min-w-0 bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden min-h-0 flex flex-col">
            <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                  Running Positions
                </p>
                <p className="text-sm font-bold mt-1">
                  {symbolTrades.length} active
                </p>
              </div>

              <div className="text-[10px] text-zinc-600 font-mono">
                Live
              </div>
            </div>

            <div className="overflow-auto">
              {symbolTrades.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-600">
                  No running positions for {symbol}.
                </div>
              ) : (
                <table className="w-full min-w-0 text-left table-fixed">
                  <thead className="sticky top-0 bg-zinc-950 border-b border-zinc-900">
                    <tr className="text-[9px] uppercase tracking-wider text-zinc-600">
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Lots</th>
                      <th className="px-3 py-2">Open</th>
                      <th className="px-3 py-2">SL</th>
                      <th className="px-3 py-2">TP</th>
                      <th className="px-3 py-2">P/L</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {symbolTrades.map((trade: any) => (
                      <tr
                        key={trade.id}
                        className="border-b border-zinc-900/80"
                      >
                        <td className="px-3 py-2">
                          <span
                            className={`text-[10px] font-bold ${
                              trade.type === 'buy'
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {trade.type.toUpperCase()}
                          </span>
                        </td>

                        <td className="px-3 py-2 text-xs font-mono text-zinc-300">
                          {Number(trade.lots).toFixed(2)}
                        </td>

                        <td className="px-3 py-2 text-xs font-mono text-zinc-400">
                          {trade.openPrice}
                        </td>

                        <td className="px-3 py-2 text-[10px] font-mono text-zinc-500">
                          {trade.sl ?? '—'}
                        </td>

                        <td className="px-3 py-2 text-[10px] font-mono text-zinc-500">
                          {trade.tp ?? '—'}
                        </td>

                        {(() => {
                          const livePrice = prices[
                            trade.symbol as keyof typeof prices
                          ] as any;

                          const asset = (
                            // TradingContext asset metadata is not exported from
                            // this file, so use the standard lot-size convention
                            // for the supported symbols and keep the result live.
                            {
                              XAUUSD: 100,
                              XAGUSD: 5000,
                              EURUSD: 100000,
                              GBPUSD: 100000,
                              USDJPY: 100000,
                              USDCHF: 100000,
                              USDCAD: 100000,
                              AUDUSD: 100000,
                              NZDUSD: 100000,
                              EURJPY: 100000,
                              GBPJPY: 100000,
                              BTCUSD: 1,
                              ETHUSD: 1,
                              SOLUSD: 1,
                              BNBUSD: 1,
                              XRPUSD: 1,
                              NAS100: 1,
                              US30: 1,
                              SPX500: 1,
                            } as Record<string, number>
                          )[trade.symbol] ?? 100000;

                          const exitPrice =
                            livePrice
                              ? trade.type === 'buy'
                                ? livePrice.bid
                                : livePrice.ask
                              : trade.openPrice;

                          let livePnl =
                            trade.pnl ??
                            0;

                          if (livePrice) {
                            if (
                              trade.type === 'buy'
                            ) {
                              livePnl =
                                (exitPrice -
                                  trade.openPrice) *
                                Number(trade.lots) *
                                asset;
                            } else {
                              livePnl =
                                (trade.openPrice -
                                  exitPrice) *
                                Number(trade.lots) *
                                asset;
                            }

                            // JPY-quoted pairs need an approximate USD conversion.
                            if (
                              typeof trade.symbol === 'string' &&
                              trade.symbol.endsWith('JPY') &&
                              trade.symbol !== 'USDJPY'
                            ) {
                              const usdjpy =
                                prices[
                                  'USDJPY' as keyof typeof prices
                                ] as any;

                              if (
                                usdjpy?.lastPrice > 0
                              ) {
                                livePnl /= usdjpy.lastPrice;
                              }
                            }
                          }

                          return (
                            <td
                              className={`px-3 py-2 text-xs font-mono font-bold ${
                                livePnl >= 0
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {livePnl >= 0 ? '+' : ''}
                              {Number(livePnl).toFixed(2)}
                            </td>
                          );
                        })()}

                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleClose(trade.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-black text-[10px] font-bold"
                          >
                            <X className="w-3 h-3" />
                            CLOSE
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}