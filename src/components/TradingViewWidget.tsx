import React, { useEffect, useRef } from 'react';
import { TradeSymbol } from '../types';

interface TradingViewWidgetProps {
  symbol: TradeSymbol;
}

/**
 * Forex Arena market chart.
 * Chart data is supplied visually by TradingView; order execution remains
 * simulated inside TradingContext.
 */
export default function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const getTradingViewSymbol = (sym: TradeSymbol) => {
    switch (sym) {
      case 'XAUUSD': return 'OANDA:XAUUSD';
      case 'XAGUSD': return 'OANDA:XAGUSD';
      case 'EURUSD': return 'OANDA:EURUSD';
      case 'GBPUSD': return 'OANDA:GBPUSD';
      case 'USDJPY': return 'OANDA:USDJPY';
      case 'USDCHF': return 'OANDA:USDCHF';
      case 'USDCAD': return 'OANDA:USDCAD';
      case 'AUDUSD': return 'OANDA:AUDUSD';
      case 'NZDUSD': return 'OANDA:NZDUSD';
      case 'EURJPY': return 'OANDA:EURJPY';
      case 'GBPJPY': return 'OANDA:GBPJPY';
      case 'BTCUSD': return 'BINANCE:BTCUSDT';
      case 'ETHUSD': return 'BINANCE:ETHUSDT';
      case 'SOLUSD': return 'BINANCE:SOLUSDT';
      case 'BNBUSD': return 'BINANCE:BNBUSDT';
      case 'XRPUSD': return 'BINANCE:XRPUSDT';
      default: return `FX_IDC:${sym}`;
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.type = 'text/javascript';
    script.async = true;

    const widgetContainerId = `tradingview_chart_${symbol}`;
    container.id = widgetContainerId;

    script.onload = () => {
      if (!container.isConnected) return;
      const TradingView = (window as any).TradingView;
      if (!TradingView) return;

      new TradingView.widget({
        autosize: true,
        symbol: getTradingViewSymbol(symbol),
        // One-minute candles keep the current market session visibly live.
        interval: '1',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        enable_publishing: false,
        allow_symbol_change: false,
        hide_side_toolbar: false,
        hide_top_toolbar: false,
        save_image: false,
        withdateranges: true,
        details: true,
        hotlist: false,
        calendar: false,
        studies: ['RSI@tv-basicstudies', 'MASimple@tv-basicstudies'],
        container_id: widgetContainerId,
        overrides: {
          'paneProperties.background': '#050505',
          'paneProperties.backgroundType': 'solid',
          'scalesProperties.textColor': '#a1a1aa',
        },
      });
    };

    document.head.appendChild(script);

    return () => {
      container.innerHTML = '';
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [symbol]);

  return (
    <div className="w-full h-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 relative">
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '380px' }}
      />
      <div className="absolute top-2 right-2 z-10 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-zinc-950/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live Market Chart
        </span>
      </div>
    </div>
  );
}
