import React, { useEffect, useRef } from 'react';
import { TradeSymbol } from '../types';

interface TradingViewWidgetProps {
  symbol: TradeSymbol;
}

export default function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const getTradingViewSymbol = (sym: TradeSymbol) => {
    switch (sym) {
      case 'XAUUSD':
        return 'OANDA:XAUUSD';
      case 'XAGUSD':
        return 'OANDA:XAGUSD';
      case 'BTCUSD':
        return 'BINANCE:BTCUSDT';
      case 'ETHUSD':
        return 'BINANCE:ETHUSDT';
      case 'SOLUSD':
        return 'BINANCE:SOLUSDT';
      case 'BNBUSD':
        return 'BINANCE:BNBUSDT';
      case 'XRPUSD':
        return 'BINANCE:XRPUSDT';
      default:
        return `FX_IDC:${sym}`;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: getTradingViewSymbol(symbol),
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          container_id: containerRef.current?.id,
          studies: ['RSI@tv-basicstudies', 'MASimple@tv-basicstudies'],
          colors: {
            palette: {
              background: '#050505', // zinc-950 match
            },
          },
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [symbol]);

  return (
    <div className="w-full h-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
      <div
        id={`tradingview_chart_${symbol}`}
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '380px' }}
      />
    </div>
  );
}
