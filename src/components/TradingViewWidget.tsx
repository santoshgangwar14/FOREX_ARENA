import React, { useMemo } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
}

/**
 * Stable TradingView embed.
 *
 * We intentionally use a plain iframe instead of dynamically injecting
 * tv.js. TradingView's script embed can race React's unmount/remount cycle
 * (especially under Vite Fast Refresh / StrictMode) and produce:
 * "Cannot read properties of null (reading 'parentNode')".
 *
 * The iframe is isolated from the React DOM lifecycle, so changing symbol
 * or HMR cannot leave a TradingView script holding a stale DOM node.
 */
export default function TradingViewWidget({
  symbol,
}: TradingViewWidgetProps) {
  const tradingViewSymbol = useMemo(() => {
    const map: Record<string, string> = {
      XAUUSD: 'OANDA:XAUUSD',
      XAGUSD: 'OANDA:XAGUSD',
      EURUSD: 'OANDA:EURUSD',
      GBPUSD: 'OANDA:GBPUSD',
      USDJPY: 'OANDA:USDJPY',
      USDCHF: 'OANDA:USDCHF',
      USDCAD: 'OANDA:USDCAD',
      AUDUSD: 'OANDA:AUDUSD',
      NZDUSD: 'OANDA:NZDUSD',
      EURJPY: 'OANDA:EURJPY',
      GBPJPY: 'OANDA:GBPJPY',
      BTCUSD: 'BITSTAMP:BTCUSD',
      ETHUSD: 'BITSTAMP:ETHUSD',
      SOLUSD: 'COINBASE:SOLUSD',
      BNBUSD: 'BINANCE:BNBUSDT',
      XRPUSD: 'BITSTAMP:XRPUSD',
      NAS100: 'CAPITALCOM:US100',
      US30: 'CAPITALCOM:US30',
      SPX500: 'CAPITALCOM:US500',
    };

    return (
      map[symbol] ||
      `OANDA:${symbol}`
    );
  }, [symbol]);

  const src = useMemo(() => {
    const params = new URLSearchParams({
      symbol: tradingViewSymbol,
      interval: '5',
      hidesidetoolbar: '0',
      hidetoptoolbar: '0',
      hidelegend: '0',
      saveimage: '0',
      toolbarbg: '0f1115',
      theme: 'dark',
      style: '1',
      locale: 'en',
      timezone: 'Asia/Kolkata',
      withdateranges: '1',
      hideideas: '1',
      enable_publishing: '0',
      allow_symbol_change: '0',
    });

    return `https://www.tradingview.com/widgetembed/?${params.toString()}`;
  }, [tradingViewSymbol]);

  return (
    <div className="relative w-full h-full min-h-[420px] overflow-hidden rounded-xl bg-black">
      <iframe
        title={`TradingView ${symbol}`}
        src={src}
        className="absolute inset-0 w-full h-full border-0"
        loading="eager"
        allow="fullscreen"
        referrerPolicy="origin"
      />
    </div>
  );
}
