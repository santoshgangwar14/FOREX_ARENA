import React, { useState } from 'react';
import { useTrading, MARKET_ASSETS } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';
import TradingViewWidget from '../components/TradingViewWidget';
import {
  TrendingUp,
  TrendingDown,
  Info,
  ChevronDown,
  Coins,
  DollarSign,
  Layers,
  AlertCircle,
  CheckCircle,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export default function Trading() {
  const { prices, activeSymbol, setActiveSymbol, openPosition, openTrades } = useTrading();
  const { wallet } = useAuth();

  // Selected asset metadata
  const activeAsset = MARKET_ASSETS[activeSymbol];
  const activePrice = prices[activeSymbol];

  const [lots, setLots] = useState(0.1);
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [placing, setPlacing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    'All' | 'Metals' | 'Forex' | 'Crypto' | 'Indices'
  >('All');

  const FORCE_FOREX_SYMBOLS = new Set([
    'EURUSD',
    'GBPUSD',
    'USDJPY',
    'USDCHF',
    'USDCAD',
    'AUDUSD',
    'NZDUSD',
    'EURJPY',
    'GBPJPY',
  ]);
  const [isChartFullScreen, setIsChartFullScreen] = useState(false);

  const openChartPopout = () => {
    const params = new URLSearchParams({
      symbol: activeSymbol,
    });
    const popup = window.open(
      `${window.location.origin}/trade/chart?${params.toString()}`,
      'goldx-chart-popout',
      'popup=yes,width=1400,height=850,left=120,top=60,resizable=yes,scrollbars=no'
    );

    if (!popup) {
      setError('Chart pop-out was blocked by the browser. Please allow pop-ups for this site.');
      return;
    }

    popup.focus();
  };

  // Independent desktop panel widths. The user can drag the separators
  // to give more space to the watchlist/order window while the chart
  // automatically takes the remaining width.
  const [watchlistWidth, setWatchlistWidth] = useState(280);
  const [orderWidth, setOrderWidth] = useState(340);

  const startResize = (
    type: 'watchlist' | 'order',
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (window.innerWidth < 1024) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const startX = event.clientX;
    const initialWidth =
      type === 'watchlist' ? watchlistWidth : orderWidth;

    const handleMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;

      if (type === 'watchlist') {
        setWatchlistWidth(
          Math.min(
            420,
            Math.max(220, initialWidth + delta)
          )
        );
      } else {
        // Dragging the separator between chart and order window:
        // moving left increases order width, moving right decreases it.
        setOrderWidth(
          Math.min(
            460,
            Math.max(280, initialWidth - delta)
          )
        );
      }
    };

    const handleUp = () => {
      window.removeEventListener(
        'pointermove',
        handleMove
      );
      window.removeEventListener(
        'pointerup',
        handleUp
      );
    };

    window.addEventListener(
      'pointermove',
      handleMove
    );
    window.addEventListener(
      'pointerup',
      handleUp,
      { once: true }
    );
  };

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const handleLotsChange = (value: number) => {
    // Round to 2 decimal places (standard micro-lots minimum 0.01)
    const rounded = parseFloat(Math.max(0.01, Math.min(value, 50)).toFixed(2));
    setLots(rounded);
  };

  // Pre-calculate required margin for UI feedback
  let calculatedMargin = 0;
  if (activePrice) {
    const currentPrice = activePrice.lastPrice;
    const leverage = 100;
    calculatedMargin = (lots * activeAsset.contractSize * currentPrice) / leverage;

    // Convert required margin to USD
    if (activeSymbol.startsWith('EUR') && activeSymbol !== 'EURUSD') {
      calculatedMargin = calculatedMargin * (prices['EURUSD']?.lastPrice || 1.08);
    } else if (activeSymbol.startsWith('GBP') && activeSymbol !== 'GBPUSD') {
      calculatedMargin = calculatedMargin * (prices['GBPUSD']?.lastPrice || 1.27);
    } else if (activeSymbol.endsWith('JPY')) {
      const usdjpyPrice = prices['USDJPY']?.lastPrice || 156;
      calculatedMargin = calculatedMargin / usdjpyPrice;
    }
  }

  const handleOrder = async (type: 'buy' | 'sell') => {
    try {
      setError('');
      setSuccess('');
      setPlacing(true);

      const slVal = sl ? parseFloat(sl) : undefined;
      const tpVal = tp ? parseFloat(tp) : undefined;

      // Basic SL/TP logical validation
      if (activePrice) {
        if (type === 'buy') {
          if (slVal && slVal >= activePrice.ask) {
            throw new Error('Stop Loss for BUY must be below the Ask Price!');
          }
          if (tpVal && tpVal <= activePrice.ask) {
            throw new Error('Take Profit for BUY must be above the Ask Price!');
          }
        } else {
          if (slVal && slVal <= activePrice.bid) {
            throw new Error('Stop Loss for SELL must be above the Bid Price!');
          }
          if (tpVal && tpVal >= activePrice.bid) {
            throw new Error('Take Profit for SELL must be below the Bid Price!');
          }
        }
      }

      await openPosition(type, lots, slVal, tpVal);

      setSuccess(`Position placed successfully! ${type.toUpperCase()} ${lots} lot(s) of ${activeSymbol}.`);
      setSl('');
      setTp('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to open position. Please check your margin limits.');
    } finally {
      setPlacing(false);
    }
  };

  // Filter list of assets by selected category
  const filteredSymbols = (
    Object.keys(MARKET_ASSETS) as Array<keyof typeof MARKET_ASSETS>
  ).filter((sym) => {
    if (selectedCategory === 'All') return true;

    if (selectedCategory === 'Forex') {
      return FORCE_FOREX_SYMBOLS.has(sym);
    }

    return String(MARKET_ASSETS[sym].category)
      .trim()
      .toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Asset Stats Header */}
      {activePrice && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg">
              {activeSymbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight font-sans">{activeSymbol}</h1>
                <span className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {activeAsset.category}
                </span>
              </div>
              <p className="text-sm text-zinc-500 font-medium mt-0.5">{activeAsset.name}</p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-12 w-full lg:w-auto pt-4 lg:pt-0 border-t border-zinc-900 lg:border-t-0">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">BID PRICE</p>
              <p className={`text-lg font-bold font-mono mt-1 transition-colors duration-300 ${
                activePrice.direction === 'up'
                  ? 'text-emerald-400'
                  : activePrice.direction === 'down'
                    ? 'text-rose-400'
                    : 'text-zinc-300'
              }`}>{activePrice.bid.toFixed(activeAsset.digits)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">ASK PRICE</p>
              <p className={`text-lg font-bold font-mono mt-1 transition-colors duration-300 ${
                activePrice.direction === 'up'
                  ? 'text-emerald-400'
                  : activePrice.direction === 'down'
                    ? 'text-rose-400'
                    : 'text-amber-400'
              }`}>{activePrice.ask.toFixed(activeAsset.digits)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">DAILY CHANGE</p>
              <p className={`text-lg font-bold font-mono mt-1 ${activePrice.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                {activePrice.changePercent >= 0 ? '+' : ''}{activePrice.changePercent.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">CONTRACT SIZE</p>
              <p className="text-lg font-bold font-mono text-zinc-300 mt-1">{activeAsset.contractSize.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Independent Trading Workspace */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch">
        {/* Watchlist */}
        <section
          className="relative flex flex-col shrink-0 bg-zinc-950 border border-zinc-900 rounded-2xl p-4 min-h-[520px] lg:h-[600px] overflow-hidden"
          style={{
            width: `min(100%, ${watchlistWidth}px)`,
          }}
        >
          <div className="flex items-center justify-between mb-3 px-2 shrink-0">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-zinc-400">
              Market Watch
            </h2>

            <span className="hidden lg:inline-flex text-[9px] uppercase tracking-widest text-zinc-700">
              Drag edge
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-900 mb-4 shrink-0 overflow-x-auto">
            {(['All', 'Metals', 'Forex', 'Crypto', 'Indices'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-1 text-[11px] font-bold py-1.5 px-2 rounded-lg transition-all min-w-max ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-zinc-950 shadow-[0_2px_5px_rgba(245,158,11,0.2)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Symbol List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredSymbols.map((sym) => {
              const asset = MARKET_ASSETS[sym];
              const price = prices[sym];
              const isSelected = activeSymbol === sym;

              if (!price) return null;

              return (
                <button
                  key={sym}
                  id={`asset-select-${sym}`}
                  onClick={() => {
                    setActiveSymbol(sym);
                    setError('');
                    setSuccess('');
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-300 flex justify-between items-center ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/15 to-yellow-500/5 border-amber-500/40 text-white shadow-[inset_4px_0_10px_rgba(245,158,11,0.03)]'
                      : price.direction === 'up'
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-300'
                        : price.direction === 'down'
                          ? 'bg-rose-500/5 border-rose-500/20 text-zinc-300'
                          : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div>
                    <span className={`font-bold font-mono text-sm block transition-colors duration-300 ${
                      isSelected
                        ? 'text-amber-400 font-extrabold'
                        : price.direction === 'up'
                          ? 'text-emerald-400'
                          : price.direction === 'down'
                            ? 'text-rose-400'
                            : 'text-zinc-200'
                    }`}>
                      {sym}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {asset.name.split('vs')[0]}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`font-mono font-bold text-xs block transition-colors duration-300 ${
                      price.direction === 'up'
                        ? 'text-emerald-400'
                        : price.direction === 'down'
                          ? 'text-rose-400'
                          : 'text-zinc-300'
                    }`}>
                      {price.lastPrice.toFixed(asset.digits)}
                    </span>

                    <span className={`font-mono text-[10px] block mt-0.5 transition-colors duration-300 ${
                      price.direction === 'up'
                        ? 'text-emerald-400'
                        : price.direction === 'down'
                          ? 'text-rose-400'
                          : price.changePercent >= 0
                            ? 'text-emerald-400/80'
                            : 'text-rose-500/80'
                    }`}>
                      {price.changePercent >= 0 ? '+' : ''}
                      {price.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Desktop resize handle */}
          <div
            onPointerDown={(event) =>
              startResize('watchlist', event)
            }
            className="hidden lg:block absolute top-0 right-0 h-full w-2 translate-x-1/2 cursor-col-resize z-20"
            title="Resize Market Watch"
          >
            <div className="mx-auto h-full w-px bg-transparent hover:bg-amber-500/60 transition-colors" />
          </div>
        </section>

        {/* Chart */}
        <section
          className={`relative bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-col min-w-0 ${
            'flex-1 min-h-[520px] lg:h-[600px]'
          }`}
        >
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-Time Chart
            </h2>

            <div className="flex items-center gap-3">
              <div className="text-xs text-zinc-500 font-medium hidden sm:block">
                Interactive TradingView Integration
              </div>

              <button
                type="button"
                onClick={openChartPopout}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-1.5 text-xs font-bold"
                title="Open chart in new window"
              >
                <Maximize2 className="w-4 h-4 text-amber-400" />
                <span>Pop Out</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <TradingViewWidget symbol={activeSymbol} />
          </div>
        </section>

        {/* Order Window */}
        <section
          className="relative flex flex-col shrink-0 bg-zinc-950 border border-zinc-900 rounded-2xl p-5 min-h-[520px] lg:h-[600px] overflow-y-auto"
          style={{
            width: `min(100%, ${orderWidth}px)`,
          }}
        >
          <div className="space-y-5 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-zinc-400">
                Trading Engine
              </h2>

              <span className="hidden lg:inline-flex text-[9px] uppercase tracking-widest text-zinc-700">
                Drag edge
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-emerald-200 text-xs flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Lot Size Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Lot Size
                </label>
                <span className="text-xs font-mono font-bold text-amber-500">
                  Min 0.01 / Max 50.0
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleLotsChange(lots - 0.1)
                  }
                  className="px-3 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-lg text-sm hover:border-zinc-700 active:scale-95 transition-all"
                >
                  -0.1
                </button>

                <input
                  id="trade-lots-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="50"
                  value={lots}
                  onChange={(e) =>
                    handleLotsChange(
                      parseFloat(e.target.value) ||
                        0.01
                    )
                  }
                  className="flex-1 bg-zinc-950 text-white font-mono font-bold text-center border border-zinc-800 focus:border-amber-500 rounded-lg focus:outline-none text-sm py-2.5"
                />

                <button
                  onClick={() =>
                    handleLotsChange(lots + 0.1)
                  }
                  className="px-3 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-lg text-sm hover:border-zinc-700 active:scale-95 transition-all"
                >
                  +0.1
                </button>
              </div>

              <div className="flex gap-1.5 mt-2">
                {[0.01, 0.1, 0.5, 1.0, 5.0, 10.0].map(
                  (preset) => (
                    <button
                      key={preset}
                      onClick={() =>
                        handleLotsChange(preset)
                      }
                      className={`flex-1 text-[10px] font-bold py-1.5 rounded bg-zinc-900 border transition-all ${
                        lots === preset
                          ? 'border-amber-500/60 text-amber-400'
                          : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {preset.toFixed(2)}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* SL / TP Panel */}
            <div className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Stop Loss (Optional)
                </label>
                <input
                  id="trade-sl-input"
                  type="number"
                  step={activeAsset.pipSize}
                  placeholder={`e.g. ${
                    activePrice
                      ? (
                          activePrice.lastPrice *
                          0.99
                        ).toFixed(activeAsset.digits)
                      : 0
                  }`}
                  value={sl}
                  onChange={(e) =>
                    setSl(e.target.value)
                  }
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-white font-mono text-sm placeholder-zinc-700 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Take Profit (Optional)
                </label>
                <input
                  id="trade-tp-input"
                  type="number"
                  step={activeAsset.pipSize}
                  placeholder={`e.g. ${
                    activePrice
                      ? (
                          activePrice.lastPrice *
                          1.01
                        ).toFixed(activeAsset.digits)
                      : 0
                  }`}
                  value={tp}
                  onChange={(e) =>
                    setTp(e.target.value)
                  }
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-white font-mono text-sm placeholder-zinc-700 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* Pre-order Margin Feedback */}
            <div className="p-3.5 bg-zinc-900/40 border border-zinc-900 rounded-xl space-y-1.5 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Required Margin:</span>
                <span className="font-mono font-bold text-zinc-200">
                  {formatCurrency(calculatedMargin)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Free Margin:</span>
                <span className="font-mono font-bold text-amber-400">
                  {formatCurrency(wallet?.freeMargin)}
                </span>
              </div>

              <div className="flex justify-between border-t border-zinc-800/60 pt-1.5 text-[11px] text-zinc-500">
                <span>Account Leverage:</span>
                <span className="font-bold">1:100</span>
              </div>
            </div>
          </div>

          {/* Buy / Sell */}
          <div className="space-y-3 pt-4 mt-4 border-t border-zinc-900">
            <div className="grid grid-cols-2 gap-3.5">
              <button
                id="trade-buy-btn"
                onClick={() => handleOrder('buy')}
                disabled={placing}
                className="py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-zinc-950 font-extrabold rounded-xl text-sm transition-all duration-150 flex flex-col items-center justify-center gap-1 shadow-[0_4px_15px_rgba(16,185,129,0.15)]"
              >
                <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                <span className="tracking-wide">BUY / LONG</span>
                <span className="text-[10px] font-mono font-medium -mt-1 opacity-80">
                  Ask:{' '}
                  {activePrice
                    ? activePrice.ask.toFixed(
                        activeAsset.digits
                      )
                    : '—'}
                </span>
              </button>

              <button
                id="trade-sell-btn"
                onClick={() => handleOrder('sell')}
                disabled={placing}
                className="py-4 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-zinc-950 font-extrabold rounded-xl text-sm transition-all duration-150 flex flex-col items-center justify-center gap-1 shadow-[0_4px_15px_rgba(244,63,94,0.15)]"
              >
                <TrendingDown className="w-5 h-5 stroke-[2.5]" />
                <span className="tracking-wide">SELL / SHORT</span>
                <span className="text-[10px] font-mono font-medium -mt-1 opacity-80">
                  Bid:{' '}
                  {activePrice
                    ? activePrice.bid.toFixed(
                        activeAsset.digits
                      )
                    : '—'}
                </span>
              </button>
            </div>
          </div>

          {/* Desktop resize handle */}
          <div
            onPointerDown={(event) =>
              startResize('order', event)
            }
            className="hidden lg:block absolute top-0 left-0 h-full w-2 -translate-x-1/2 cursor-col-resize z-20"
            title="Resize Trading Engine"
          >
            <div className="mx-auto h-full w-px bg-transparent hover:bg-amber-500/60 transition-colors" />
          </div>
        </section>
      </div>
    </div>
  );
}