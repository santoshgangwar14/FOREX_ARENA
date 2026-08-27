import { TradeSymbol, MarketAsset } from '../types';

export interface PriceData {
  bid: number;
  ask: number;
  lastPrice: number;
  changePercent: number;
  direction?: 'up' | 'down' | 'neutral';
  high: number;
  low: number;
  lastUpdate: number;
}

// Single Source of Truth for Asset Meta Config
export const APP_MARKET_ASSETS: Record<TradeSymbol, Omit<MarketAsset, 'basePrice'>> = {
  // Metals
  XAUUSD: { symbol: 'XAUUSD', name: 'Gold vs US Dollar', category: 'Metals', contractSize: 100, pipSize: 0.01, digits: 2 },
  XAGUSD: { symbol: 'XAGUSD', name: 'Silver vs US Dollar', category: 'Metals', contractSize: 5000, pipSize: 0.001, digits: 3 },
  // Forex
  EURUSD: { symbol: 'EURUSD', name: 'Euro vs US Dollar', category: 'Forex', contractSize: 100000, pipSize: 0.0001, digits: 5 },
  GBPUSD: { symbol: 'GBPUSD', name: 'Great Britain Pound vs US Dollar', category: 'Forex', contractSize: 100000, pipSize: 0.0001, digits: 5 },
  USDJPY: { symbol: 'USDJPY', name: 'US Dollar vs Japanese Yen', category: 'Forex', contractSize: 100000, pipSize: 0.01, digits: 3 },
  USDCHF: { symbol: 'USDCHF', name: 'US Dollar vs Swiss Franc', category: 'Forex', contractSize: 100000, pipSize: 0.0001, digits: 5 },
  USDCAD: { symbol: 'USDCAD', name: 'US Dollar vs Canadian Dollar', category: 'Forex', contractSize: 100000, pipSize: 0.0001, digits: 5 },
  AUDUSD: { symbol: 'AUDUSD', name: 'Australian Dollar vs US Dollar', category: 'Forex', contractSize: 100000, pipSize: 0.0001, digits: 5 },
  NZDUSD: { symbol: 'NZDUSD', name: 'New Zealand Dollar vs US Dollar', category: 'Forex', contractSize: 100000, pipSize: 0.0001, digits: 5 },
  EURJPY: { symbol: 'EURJPY', name: 'Euro vs Japanese Yen', category: 'Forex', contractSize: 100000, pipSize: 0.01, digits: 3 },
  GBPJPY: { symbol: 'GBPJPY', name: 'Great Britain Pound vs Japanese Yen', category: 'Forex', contractSize: 100000, pipSize: 0.01, digits: 3 },
  // Crypto
  BTCUSD: { symbol: 'BTCUSD', name: 'Bitcoin vs US Dollar', category: 'Crypto', contractSize: 1, pipSize: 1, digits: 2 },
  ETHUSD: { symbol: 'ETHUSD', name: 'Ethereum vs US Dollar', category: 'Crypto', contractSize: 1, pipSize: 0.01, digits: 2 },
  SOLUSD: { symbol: 'SOLUSD', name: 'Solana vs US Dollar', category: 'Crypto', contractSize: 10, pipSize: 0.01, digits: 2 },
  BNBUSD: { symbol: 'BNBUSD', name: 'BNB vs US Dollar', category: 'Crypto', contractSize: 10, pipSize: 0.01, digits: 2 },
  XRPUSD: { symbol: 'XRPUSD', name: 'Ripple vs US Dollar', category: 'Crypto', contractSize: 1000, pipSize: 0.0001, digits: 4 },
  // Indices
  NAS100: { symbol: 'NAS100', name: 'Nasdaq 100 Index', category: 'Indices', contractSize: 10, pipSize: 1, digits: 1 },
  US30: { symbol: 'US30', name: 'Dow Jones Industrial Average', category: 'Indices', contractSize: 10, pipSize: 1, digits: 1 },
  SPX500: { symbol: 'SPX500', name: 'S&P 500 Index', category: 'Indices', contractSize: 100, pipSize: 0.1, digits: 2 },
};

// Professional spreads (in absolute terms)
export const APP_ASSET_SPREADS: Record<TradeSymbol, number> = {
  XAUUSD: 0.28,    // tight Gold spread
  XAGUSD: 0.015,   // tight Silver spread
  EURUSD: 0.00008, // 0.8 pips
  GBPUSD: 0.00012, // 1.2 pips
  USDJPY: 0.011,   // 1.1 pips
  USDCHF: 0.00012,
  USDCAD: 0.00013,
  AUDUSD: 0.00011,
  NZDUSD: 0.00013,
  EURJPY: 0.014,
  GBPJPY: 0.019,
  BTCUSD: 8.50,    // tight Crypto spread
  ETHUSD: 0.75,
  SOLUSD: 0.08,
  BNBUSD: 0.25,
  XRPUSD: 0.0004,
  NAS100: 1.5,     // tight index spread
  US30: 2.5,
  SPX500: 0.4,
};

// Default fallbacks / baseline prices
export const BASELINE_PRICES: Record<TradeSymbol, number> = {
  XAUUSD: 4150.00,
  XAGUSD: 61.500,
  EURUSD: 1.08500,
  GBPUSD: 1.27500,
  USDJPY: 156.500,
  USDCHF: 0.89500,
  USDCAD: 1.36500,
  AUDUSD: 0.66500,
  NZDUSD: 0.61500,
  EURJPY: 169.500,
  GBPJPY: 199.500,
  BTCUSD: 68500.00,
  ETHUSD: 3550.00,
  SOLUSD: 145.00,
  BNBUSD: 580.00,
  XRPUSD: 0.4850,
  NAS100: 19800.0,
  US30: 39500.0,
  SPX500: 5450.00,
};

const TWELVE_DATA_STREAM_MAP: Record<string, TradeSymbol> = {
  'XAU/USD': 'XAUUSD',
  'XAG/USD': 'XAGUSD',
  'EUR/USD': 'EURUSD',
  'GBP/USD': 'GBPUSD',
  'USD/JPY': 'USDJPY',
  'USD/CHF': 'USDCHF',
  'USD/CAD': 'USDCAD',
  'AUD/USD': 'AUDUSD',
  'NZD/USD': 'NZDUSD',
  'EUR/JPY': 'EURJPY',
  'GBP/JPY': 'GBPJPY',
  'NDX': 'NAS100',
  'DJI': 'US30',
  'GSPC': 'SPX500',
};

type TwelveDataSubscriber =
  (message: Record<string, unknown>) => void;

interface TwelveDataBridge {
  ws: WebSocket | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  subscribers: Set<TwelveDataSubscriber>;
  connecting: boolean;
}

const GOLDX_TWELVE_DATA_BRIDGE_KEY =
  '__GOLDX_TWELVE_DATA_BRIDGE__';

function getTwelveDataBridge(): TwelveDataBridge {
  const root = globalThis as typeof globalThis & {
    __GOLDX_TWELVE_DATA_BRIDGE__?: TwelveDataBridge;
  };

  if (!root[GOLDX_TWELVE_DATA_BRIDGE_KEY]) {
    root[GOLDX_TWELVE_DATA_BRIDGE_KEY] = {
      ws: null,
      reconnectTimer: null,
      subscribers: new Set<TwelveDataSubscriber>(),
      connecting: false,
    };
  }

  return root[GOLDX_TWELVE_DATA_BRIDGE_KEY]!;
}

type PriceListener = (prices: Record<TradeSymbol, PriceData>) => void;

class PriceService {
  private prices: Record<TradeSymbol, PriceData>;
  private listeners: Set<PriceListener> = new Set();
  private isRunning: boolean = false;
  private fastPollIntervalId: NodeJS.Timeout | null = null;
  private slowPollIntervalId: NodeJS.Timeout | null = null;
  private microTickIntervalId: NodeJS.Timeout | null = null;
constructor() {
    this.prices = {} as Record<TradeSymbol, PriceData>;
    // Initialize cache with baseline prices
    (Object.keys(BASELINE_PRICES) as TradeSymbol[]).forEach((sym) => {
      const base = BASELINE_PRICES[sym];
      const spread = APP_ASSET_SPREADS[sym];
      const digits = APP_MARKET_ASSETS[sym].digits;
      this.prices[sym] = {
        bid: parseFloat((base - spread / 2).toFixed(digits)),
        ask: parseFloat((base + spread / 2).toFixed(digits)),
        lastPrice: base,
        changePercent: 0,
        direction: 'neutral',
        high: parseFloat((base * 1.01).toFixed(digits)),
        low: parseFloat((base * 0.99).toFixed(digits)),
        lastUpdate: Date.now(),
      };
    });
  }

  // Get active price cache synchronously
  public getLatestPrices(): Record<TradeSymbol, PriceData> {
    return { ...this.prices };
  }

  // Event subscription helper
  public subscribe(listener: PriceListener): () => void {
    this.listeners.add(listener);
    // Emit current prices immediately upon subscribe
    listener({ ...this.prices });

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const freshPrices = { ...this.prices };
    this.listeners.forEach((listener) => {
      try {
        listener(freshPrices);
      } catch (err) {
        console.error('Error executing price listener:', err);
      }
    });
  }

  // Robust Fetch with retry & backoff
  private async fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (response.ok) return response;
      } catch (err) {
        if (i === retries - 1) throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
    throw new Error(`Failed to fetch ${url} after ${retries} retries`);
  }

  // Polling starter
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Crypto + index REST quotes run periodically.
    // XAUUSD is streamed through Twelve Data WebSocket.
    this.pollFastAssets();
    this.pollSlowAssets();

    this.fastPollIntervalId = setInterval(() => {
      this.pollFastAssets();
    }, 10000);

    this.slowPollIntervalId = setInterval(() => {
      this.pollSlowAssets();
    }, 12000);

    // Fetch the actual previous trading-session close once, then refresh
    // periodically. The WebSocket continues to provide the live ticks.
    this.dailyChangeRefreshTimer = setInterval(() => {
    }, 60 * 1000);
    

    // Real-time XAU/USD stream. No artificial Gold movement.
    this.startTwelveDataGoldStream();
    // Recalculate daily change from the saved previous close every second.
    this.dailyChangeRefreshTimer = setInterval(() => {
    }, 1000);

    // Check for the once-per-day rollover capture.
    this.dailyCloseCaptureTimer = setInterval(() => {
      const now = new Date();
      if (
        now.getUTCHours() === 23 &&
        now.getUTCMinutes() === 59 &&
        now.getUTCSeconds() >= 55
      ) {
        this.captureDailyCloseIfNeeded();
      }
    }, 1000);

    // Keep UI micro-ticks for non-metal assets only.
    this.startMicroTicks();
  }

  public stop() {
    this.isRunning = false;

    if (this.fastPollIntervalId) {
      clearInterval(
        this.fastPollIntervalId
      );
      this.fastPollIntervalId = null;
    }

    if (this.slowPollIntervalId) {
      clearInterval(
        this.slowPollIntervalId
      );
      this.slowPollIntervalId = null;
    }

    if (this.microTickIntervalId) {
      clearInterval(
        this.microTickIntervalId
      );
      this.microTickIntervalId = null;
    }
  }

  /**
   * Automatically capture the last live price at UTC 23:59:59 once per day.
   * without requiring manual input.
   */

  /**
   * Daily rollover is based on the live price already received by the
   * GoldX WebSocket. No external quote API is used for the close.
   *
   * The browser checks continuously and captures the last valid platform
   * price once the configured UTC rollover window is reached.
   */
  private getRolloverDate(): string {
    return new Date()
      .toISOString()
      .slice(0, 10);
  }

  /**
   * Recalculate Daily Change from the saved platform close.
   */

  /**
   * Twelve Data real-time XAU/USD stream.
   *
   * The API key is read from Vite's environment at build/runtime:
   * VITE_TWELVE_DATA_API_KEY
   *
   * We deliberately do not generate synthetic Gold ticks. If the stream
   * disconnects, the last real price remains in cache until a real tick
   * arrives again.
   */
  private handleTwelveDataMessage(
    message: Record<string, unknown>
  ) {
    const symbol =
      String(message?.symbol || '')
        .toUpperCase();

    const price = Number(
      message?.price ??
      message?.close ??
      message?.last_price
    );

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return;
    }

    const bidValue = Number(message?.bid);
    const askValue = Number(message?.ask);

    const normalizedSymbol =
      symbol.includes('/')
        ? symbol
        : Object.keys(
            TWELVE_DATA_STREAM_MAP
          ).find(
            (key) =>
              key.replace('/', '') ===
              symbol
          );

    const mappedSymbol =
      normalizedSymbol
        ? TWELVE_DATA_STREAM_MAP[
            normalizedSymbol
          ]
        : undefined;

    if (!mappedSymbol) {
      return;
    }

    this.updateLiveTick(
      mappedSymbol,
      price,
      Number.isFinite(bidValue)
        ? bidValue
        : undefined,
      Number.isFinite(askValue)
        ? askValue
        : undefined
    );
  }

  private startTwelveDataGoldStream() {
    const bridge =
      getTwelveDataBridge();

    const subscriber: TwelveDataSubscriber =
      (message) =>
        this.handleTwelveDataMessage(
          message
        );

    bridge.subscribers.add(
      subscriber
    );

    const apiKey =
      import.meta.env.VITE_TWELVE_DATA_API_KEY;

    if (!apiKey) {
      console.error(
        'Twelve Data API key is missing. Add VITE_TWELVE_DATA_API_KEY to .env.local.'
      );
      return;
    }

    if (
      bridge.ws &&
      (
        bridge.ws.readyState ===
          WebSocket.OPEN ||
        bridge.ws.readyState ===
          WebSocket.CONNECTING
      )
    ) {
      return;
    }

    if (bridge.connecting) {
      return;
    }

    bridge.connecting = true;

    const wsUrl =
      `wss://ws.twelvedata.com/v1/quotes/price?apikey=${encodeURIComponent(apiKey)}`;

    try {
      const ws =
        new WebSocket(wsUrl);

      bridge.ws = ws;

      ws.onopen = () => {
        bridge.connecting = false;

        ws.send(
          JSON.stringify({
            action: 'subscribe',
            params: {
              symbols:
                Object.keys(
                  TWELVE_DATA_STREAM_MAP
                ).join(','),
            },
          })
        );

        console.info(
          'Twelve Data WebSocket connected: XAU/USD + FX + indices'
        );
      };

      ws.onmessage = (event) => {
        try {
          const message =
            JSON.parse(event.data);

          bridge.subscribers.forEach(
            (subscriber) => {
              try {
                subscriber(
                  message
                );
              } catch (
                subscriberError
              ) {
                console.warn(
                  'Twelve Data subscriber error:',
                  subscriberError
                );
              }
            }
          );
        } catch (error) {
          console.warn(
            'Invalid Twelve Data WebSocket message:',
            error
          );
        }
      };

      ws.onerror = (error) => {
        console.warn(
          'Twelve Data WebSocket error:',
          error
        );
      };

      ws.onclose = () => {
        bridge.connecting = false;

        if (bridge.ws === ws) {
          bridge.ws = null;
        }

        if (
          bridge.subscribers.size ===
            0 ||
          bridge.reconnectTimer
        ) {
          return;
        }

        bridge.reconnectTimer =
          setTimeout(() => {
            bridge.reconnectTimer =
              null;

            const latest =
              getTwelveDataBridge();

            if (
              latest.ws &&
              (
                latest.ws.readyState ===
                  WebSocket.OPEN ||
                latest.ws.readyState ===
                  WebSocket.CONNECTING
              )
            ) {
              return;
            }

            const serviceInstance =
              this;

            serviceInstance.startTwelveDataGoldStream();
          }, 3000);
      };
    } catch (error) {
      bridge.connecting = false;
      console.error(
        'Unable to create Twelve Data WebSocket:',
        error
      );
    }
  }

  private updateLiveTick(
    sym: TradeSymbol,
    realPrice: number,
    liveBid?: number,
    liveAsk?: number
  ) {
    const prev = this.prices[sym];
    const asset = APP_MARKET_ASSETS[sym];
    const fallbackSpread = APP_ASSET_SPREADS[sym];
    const digits = asset.digits;

    const bid = Number.isFinite(liveBid)
      ? liveBid!
      : realPrice - fallbackSpread / 2;

    const ask = Number.isFinite(liveAsk)
      ? liveAsk!
      : realPrice + fallbackSpread / 2;

    const direction =
      realPrice > prev.lastPrice
        ? 'up'
        : realPrice < prev.lastPrice
          ? 'down'
          : 'neutral';

    const high = Math.max(prev.high, realPrice);
    const low = Math.min(prev.low, realPrice);
    const changePercent = prev.changePercent;

this.prices[sym] = {
      ...prev,
      bid: parseFloat(bid.toFixed(digits)),
      ask: parseFloat(ask.toFixed(digits)),
      lastPrice: parseFloat(realPrice.toFixed(digits)),
      changePercent: parseFloat(
        Math.min(Math.max(changePercent, -100), 100).toFixed(2)
      ),
      direction,
      high: parseFloat(high.toFixed(digits)),
      low: parseFloat(low.toFixed(digits)),
      lastUpdate: Date.now(),
    };

    this.notifyListeners();
  }

  private startMicroTicks() {
    // Deliberately disabled.
    // Market prices must only change from an actual market-data source.
    if (this.microTickIntervalId) {
      clearInterval(this.microTickIntervalId);
      this.microTickIntervalId = null;
    }
  }

  // Fast Assets: Cryptos and Indices
  private async pollFastAssets() {
    const updatedPrices: Partial<Record<TradeSymbol, number>> = {};
    const updatedChanges: Partial<Record<TradeSymbol, number>> = {};

    // 1. Fetch Cryptocurrencies (BTC, ETH, SOL, BNB, XRP) from Binance Ticker Price API
    try {
      const response = await this.fetchWithRetry('https://api.binance.com/api/v3/ticker/24hr');
      const data = await response.json();
      if (Array.isArray(data)) {
        const cryptoMappings: Record<string, TradeSymbol> = {
          BTCUSDT: 'BTCUSD',
          ETHUSDT: 'ETHUSD',
          SOLUSDT: 'SOLUSD',
          BNBUSDT: 'BNBUSD',
          XRPUSDT: 'XRPUSD',
        };

        data.forEach((ticker: any) => {
          const sym = cryptoMappings[ticker.symbol];
          if (sym) {
            const price = parseFloat(ticker.lastPrice);
            const changePercent = parseFloat(ticker.priceChangePercent);
            if (!isNaN(price)) {
              updatedPrices[sym] = price;
            }
            if (!isNaN(changePercent)) {
              updatedChanges[sym] = changePercent;
            }
          }
        });
      }
    } catch (err) {
      console.warn('Binance fetch failed, falling back to Coinbase spot prices:', err);
      // Fallback to Coinbase individual fetches
      const coins = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
      await Promise.all(
        coins.map(async (coin) => {
          try {
            const res = await this.fetchWithRetry(`https://api.coinbase.com/v2/prices/${coin}-USD/spot`);
            const json = await res.json();
            const price = parseFloat(json?.data?.amount);
            if (!isNaN(price)) {
              updatedPrices[`${coin}USD` as TradeSymbol] = price;
            }
          } catch (e) {
            console.error(`Coinbase fallback failed for ${coin}:`, e);
          }
        })
      );
    }

    // 2. XAUUSD is supplied by the Twelve Data WebSocket.
    // Do NOT poll Gold-API here; REST polling caused stale 30-50s Gold prices.

    // 3. Indices are streamed through the same Twelve Data WebSocket
    // as XAU/USD. Do not call the /quote REST endpoint here.
    // Repeated REST calls caused HTTP 429 rate-limit errors.
    // Apply fast prices
    this.updatePriceCache(updatedPrices, updatedChanges);
  }

  // Slow Assets: Forex only. XAUUSD is streamed separately via Twelve Data.
  private async pollSlowAssets() {
    // Forex and indices are streamed by Twelve Data.
    return;
  }

  // Update in-memory cache and trigger listeners
  private updatePriceCache(
    newPrices: Partial<Record<TradeSymbol, number>>,
    newChanges?: Partial<Record<TradeSymbol, number>>
  ) {
    let hasChanges = false;

    (Object.keys(newPrices) as TradeSymbol[]).forEach((sym) => {
      const realPrice = newPrices[sym];
      if (realPrice === undefined || isNaN(realPrice)) return;

      const prev = this.prices[sym];
      const asset = APP_MARKET_ASSETS[sym];
      const spread = APP_ASSET_SPREADS[sym];
      const digits = asset.digits;

      if (realPrice !== prev.lastPrice) {
        hasChanges = true;
        const bid = parseFloat((realPrice - spread / 2).toFixed(digits));
        const ask = parseFloat((realPrice + spread / 2).toFixed(digits));
        
        const direction = realPrice > prev.lastPrice ? 'up' : realPrice < prev.lastPrice ? 'down' : 'neutral';
        const high = realPrice > prev.high ? realPrice : prev.high;
        const low = realPrice < prev.low ? realPrice : prev.low;
        
        let changePercent = prev.changePercent;
this.prices[sym] = {
          bid,
          ask,
          lastPrice: realPrice,
          changePercent: parseFloat(Math.min(Math.max(changePercent, -10), 10).toFixed(2)),
          direction,
          high,
          low,
          lastUpdate: Date.now(),
        };
      }
    });

    if (hasChanges) {
      this.notifyListeners();
    }
  }
}

// Export single global instance of PriceService
export const priceService = new PriceService();

// Start it immediately
priceService.start();
