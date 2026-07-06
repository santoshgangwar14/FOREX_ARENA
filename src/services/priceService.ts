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

// Professional Prop Firm spreads (in absolute terms)
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
  XAUUSD: 2350.00,
  XAGUSD: 28.500,
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

    // Trigger initial polls
    this.pollFastAssets();
    this.pollSlowAssets();

    // Fast Polling: Crypto and Indices (every 4 seconds)
    this.fastPollIntervalId = setInterval(() => {
      this.pollFastAssets();
    }, 4000);

    // Slow Polling: Forex and Metals (every 12 seconds)
    this.slowPollIntervalId = setInterval(() => {
      this.pollSlowAssets();
    }, 12000);

    // High frequency micro tick updates for active and dynamic UI feel
    this.startMicroTicks();
  }

  public stop() {
    this.isRunning = false;
    if (this.fastPollIntervalId) clearInterval(this.fastPollIntervalId);
    if (this.slowPollIntervalId) clearInterval(this.slowPollIntervalId);
    if (this.microTickIntervalId) clearInterval(this.microTickIntervalId);
  }

  private startMicroTicks() {
    if (this.microTickIntervalId) clearInterval(this.microTickIntervalId);
    
    this.microTickIntervalId = setInterval(() => {
      let hasChanges = false;
      const freshPrices = { ...this.prices };

      (Object.keys(freshPrices) as TradeSymbol[]).forEach((sym) => {
        const prev = freshPrices[sym];
        const spread = APP_ASSET_SPREADS[sym];
        const digits = APP_MARKET_ASSETS[sym].digits;

        // Apply a subtle, ultra-realistic jitter based on spread (scaled to 15%)
        // Ensures the prices move live on the UI every 500ms
        const jitter = (Math.random() - 0.5) * spread * 0.15;
        let newPrice = prev.lastPrice + jitter;

        // Constrain it close to the baseline to prevent runaways if API is offline
        const base = BASELINE_PRICES[sym];
        const maxDev = base * 0.12;
        if (newPrice > base + maxDev) {
          newPrice = base + maxDev;
        } else if (newPrice < base - maxDev) {
          newPrice = base - maxDev;
        }

        newPrice = parseFloat(newPrice.toFixed(digits));

        if (newPrice !== prev.lastPrice) {
          hasChanges = true;
          const bid = parseFloat((newPrice - spread / 2).toFixed(digits));
          const ask = parseFloat((newPrice + spread / 2).toFixed(digits));
          const direction = newPrice > prev.lastPrice ? 'up' : 'down';

          freshPrices[sym] = {
            ...prev,
            bid,
            ask,
            lastPrice: newPrice,
            direction,
            lastUpdate: Date.now(),
          };
        }
      });

      if (hasChanges) {
        this.prices = freshPrices;
        this.notifyListeners();
      }
    }, 500);
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

    // 2. Fetch Indices and Metals (SPX500, US30, NAS100, XAUUSD, XAGUSD) from Yahoo Finance Spark API
    try {
      const symbols = '%5EGSPC,%5EDJI,%5ENDX,GC%3DF,SI%3DF';
      const url = `https://api.allorigins.win/get?url=${encodeURIComponent(
        `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${symbols}`
      )}`;
      const response = await this.fetchWithRetry(url);
      const data = await response.json();
      if (data?.contents) {
        const parsed = JSON.parse(data.contents);
        const result = parsed?.spark?.result;
        if (Array.isArray(result)) {
          const indexMappings: Record<string, TradeSymbol> = {
            '^GSPC': 'SPX500',
            '^DJI': 'US30',
            '^NDX': 'NAS100',
            'GC=F': 'XAUUSD',
            'SI=F': 'XAGUSD',
          };

          result.forEach((item: any) => {
            const sym = indexMappings[item.symbol];
            if (sym) {
              const meta = item.response?.[0]?.meta;
              if (meta) {
                const price = parseFloat(meta.regularMarketPrice);
                const prevClose = parseFloat(meta.chartPreviousClose);
                if (!isNaN(price)) {
                  updatedPrices[sym] = price;
                  if (!isNaN(prevClose) && prevClose > 0) {
                    updatedChanges[sym] = ((price - prevClose) / prevClose) * 100;
                  }
                }
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn('Yahoo Finance Spark query failed, trying individual chart endpoints:', err);
      const tickers = [
        { sym: 'SPX500' as TradeSymbol, yahooSym: '%5EGSPC' },
        { sym: 'US30' as TradeSymbol, yahooSym: '%5EDJI' },
        { sym: 'NAS100' as TradeSymbol, yahooSym: '%5ENDX' },
        { sym: 'XAUUSD' as TradeSymbol, yahooSym: 'GC%3DF' },
        { sym: 'XAGUSD' as TradeSymbol, yahooSym: 'SI%3DF' },
      ];

      await Promise.all(
        tickers.map(async ({ sym, yahooSym }) => {
          try {
            const chartUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
              `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?interval=1m&range=1d`
            )}`;
            const res = await this.fetchWithRetry(chartUrl);
            const json = await res.json();
            if (json?.contents) {
              const body = JSON.parse(json.contents);
              const meta = body?.chart?.result?.[0]?.meta;
              if (meta) {
                const price = parseFloat(meta.regularMarketPrice);
                const prevClose = parseFloat(meta.chartPreviousClose || meta.previousClose);
                if (!isNaN(price)) {
                  updatedPrices[sym] = price;
                  if (!isNaN(prevClose) && prevClose > 0) {
                    updatedChanges[sym] = ((price - prevClose) / prevClose) * 100;
                  }
                }
              }
            }
          } catch (e) {
            console.error(`Yahoo chart individual fallback failed for ${sym}:`, e);
          }
        })
      );
    }

    // Apply fast prices
    this.updatePriceCache(updatedPrices, updatedChanges);
  }

  // Slow Assets: Forex and Metals
  private async pollSlowAssets() {
    const updatedPrices: Partial<Record<TradeSymbol, number>> = {};
    const updatedChanges: Partial<Record<TradeSymbol, number>> = {};

    try {
      const response = await this.fetchWithRetry('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      if (data?.rates) {
        const rates = data.rates;
        
        if (rates.EUR) updatedPrices['EURUSD'] = 1 / rates.EUR;
        if (rates.GBP) updatedPrices['GBPUSD'] = 1 / rates.GBP;
        if (rates.JPY) updatedPrices['USDJPY'] = rates.JPY;
        if (rates.CHF) updatedPrices['USDCHF'] = rates.CHF;
        if (rates.CAD) updatedPrices['USDCAD'] = rates.CAD;
        if (rates.AUD) updatedPrices['AUDUSD'] = 1 / rates.AUD;
        if (rates.NZD) updatedPrices['NZDUSD'] = 1 / rates.NZD;
        
        if (rates.EUR && rates.JPY) updatedPrices['EURJPY'] = (1 / rates.EUR) * rates.JPY;
        if (rates.GBP && rates.JPY) updatedPrices['GBPJPY'] = (1 / rates.GBP) * rates.JPY;

        if (rates.XAU) updatedPrices['XAUUSD'] = 1 / rates.XAU;
        if (rates.XAG) updatedPrices['XAGUSD'] = 1 / rates.XAG;
      }
    } catch (err) {
      console.warn('ER-API Forex fetch failed, falling back to Frankfurter API:', err);
      try {
        const res = await this.fetchWithRetry('https://api.frankfurter.app/latest?from=USD');
        const data = await res.json();
        if (data?.rates) {
          const rates = data.rates;
          if (rates.EUR) updatedPrices['EURUSD'] = 1 / rates.EUR;
          if (rates.GBP) updatedPrices['GBPUSD'] = 1 / rates.GBP;
          if (rates.JPY) updatedPrices['USDJPY'] = rates.JPY;
          if (rates.CHF) updatedPrices['USDCHF'] = rates.CHF;
          if (rates.CAD) updatedPrices['USDCAD'] = rates.CAD;
          if (rates.AUD) updatedPrices['AUDUSD'] = 1 / rates.AUD;
          if (rates.NZD) updatedPrices['NZDUSD'] = 1 / rates.NZD;

          if (rates.EUR && rates.JPY) updatedPrices['EURJPY'] = (1 / rates.EUR) * rates.JPY;
          if (rates.GBP && rates.JPY) updatedPrices['GBPJPY'] = (1 / rates.GBP) * rates.JPY;
        }
      } catch (e) {
        console.error('Frankfurter fallback also failed. Using existing cache for slow assets.', e);
      }
    }

    // Apply slow prices
    this.updatePriceCache(updatedPrices, updatedChanges);
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
        if (newChanges && newChanges[sym] !== undefined) {
          changePercent = parseFloat(newChanges[sym]!.toFixed(2));
        } else if (sym.endsWith('USD') && sym !== 'BTCUSD' && sym !== 'ETHUSD' && sym !== 'SOLUSD' && sym !== 'BNBUSD' && sym !== 'XRPUSD' && sym !== 'XAUUSD' && sym !== 'XAGUSD') {
          // If slow forex change percent is missing, generate a tiny fluctuation to daily change
          changePercent = parseFloat((changePercent + (Math.random() * 0.02 - 0.01)).toFixed(2));
        }

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
