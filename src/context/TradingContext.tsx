import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  setDoc,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Trade, TradeSymbol, MarketAsset, Wallet, Deposit } from '../types';

export const MARKET_ASSETS: Record<TradeSymbol, MarketAsset> = {
  XAUUSD: { symbol: 'XAUUSD', name: 'Gold', category: 'Metals', contractSize: 100, pipSize: 0.01, basePrice: 2352.45, digits: 2 },
  XAGUSD: { symbol: 'XAGUSD', name: 'Silver', category: 'Metals', contractSize: 5000, pipSize: 0.001, basePrice: 28.35, digits: 3 },
  EURUSD: { symbol: 'EURUSD', name: 'Euro vs US Dollar', category: 'Forex', contractSize: 100000, pipSize: 0.0001, basePrice: 1.0852, digits: 5 },
  GBPUSD: { symbol: 'GBPUSD', name: 'Great Britain Pound vs US Dollar', category: 'Forex', contractSize: 100000, pipSize: 0.0001, basePrice: 1.2743, digits: 5 },
  USDJPY: { symbol: 'USDJPY', name: 'US Dollar vs Japanese Yen', category: 'Forex', contractSize: 100000, pipSize: 0.01, basePrice: 156.42, digits: 3 },
  USDCHF: { symbol: 'USDCHF', name: 'US Dollar vs Swiss Franc', category: 'Forex', contractSize: 100000, pipSize: 0.0001, basePrice: 0.8924, digits: 5 },
  USDCAD: { symbol: 'USDCAD', name: 'US Dollar vs Canadian Dollar', category: 'Forex', contractSize: 100000, pipSize: 0.0001, basePrice: 1.3654, digits: 5 },
  AUDUSD: { symbol: 'AUDUSD', name: 'Australian Dollar vs US Dollar', category: 'Forex', contractSize: 100000, pipSize: 0.0001, basePrice: 0.6672, digits: 5 },
  NZDUSD: { symbol: 'NZDUSD', name: 'New Zealand Dollar vs US Dollar', category: 'Forex', contractSize: 100000, pipSize: 0.0001, basePrice: 0.6125, digits: 5 },
  EURJPY: { symbol: 'EURJPY', name: 'Euro vs Japanese Yen', category: 'Forex', contractSize: 100000, pipSize: 0.01, basePrice: 169.54, digits: 3 },
  GBPJPY: { symbol: 'GBPJPY', name: 'Great Britain Pound vs Japanese Yen', category: 'Forex', contractSize: 100000, pipSize: 0.01, basePrice: 199.15, digits: 3 },
  BTCUSD: { symbol: 'BTCUSD', name: 'Bitcoin', category: 'Crypto', contractSize: 1, pipSize: 1, basePrice: 68425.0, digits: 2 },
  ETHUSD: { symbol: 'ETHUSD', name: 'Ethereum', category: 'Crypto', contractSize: 1, pipSize: 0.01, basePrice: 3552.4, digits: 2 },
  SOLUSD: { symbol: 'SOLUSD', name: 'Solana', category: 'Crypto', contractSize: 10, pipSize: 0.01, basePrice: 145.65, digits: 2 },
  BNBUSD: { symbol: 'BNBUSD', name: 'BNB', category: 'Crypto', contractSize: 10, pipSize: 0.01, basePrice: 582.3, digits: 2 },
  XRPUSD: { symbol: 'XRPUSD', name: 'Ripple', category: 'Crypto', contractSize: 1000, pipSize: 0.0001, basePrice: 0.4855, digits: 4 },
};

// Simulated spreads in pips/points
export const ASSET_SPREADS: Record<TradeSymbol, number> = {
  XAUUSD: 0.35, // 35 cents
  XAGUSD: 0.02, // 2 cents
  EURUSD: 0.00012, // 1.2 pips
  GBPUSD: 0.00018, // 1.8 pips
  USDJPY: 0.015, // 1.5 pips
  USDCHF: 0.00016,
  USDCAD: 0.00017,
  AUDUSD: 0.00015,
  NZDUSD: 0.00018,
  EURJPY: 0.018,
  GBPJPY: 0.025,
  BTCUSD: 12.5, // $12.50 spread
  ETHUSD: 1.2, // $1.20 spread
  SOLUSD: 0.15, // 15 cents
  BNBUSD: 0.4,
  XRPUSD: 0.0008,
};

interface PriceData {
  bid: number;
  ask: number;
  lastPrice: number;
  changePercent: number;
}

interface TradingContextType {
  prices: Record<TradeSymbol, PriceData>;
  activeSymbol: TradeSymbol;
  setActiveSymbol: (symbol: TradeSymbol) => void;
  openTrades: Trade[];
  closedTrades: Trade[];
  deposits: Deposit[];
  loadingTrades: boolean;
  openPosition: (type: 'buy' | 'sell', lots: number, sl?: number, tp?: number) => Promise<void>;
  closePosition: (tradeId: string) => Promise<void>;
  createDeposit: (amount: number, txHash: string, screenshot: string) => Promise<void>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export function useTrading() {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
}

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, wallet, updateLocalWallet } = useAuth();
  const [activeSymbol, setActiveSymbol] = useState<TradeSymbol>('XAUUSD');
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [closedTrades, setClosedTrades] = useState<Trade[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(true);

  // Prices state initialized with base prices
  const [prices, setPrices] = useState<Record<TradeSymbol, PriceData>>(() => {
    const initialPrices = {} as Record<TradeSymbol, PriceData>;
    (Object.keys(MARKET_ASSETS) as TradeSymbol[]).forEach((sym) => {
      const asset = MARKET_ASSETS[sym];
      const spread = ASSET_SPREADS[sym];
      initialPrices[sym] = {
        bid: asset.basePrice - spread / 2,
        ask: asset.basePrice + spread / 2,
        lastPrice: asset.basePrice,
        changePercent: (Math.random() * 4 - 2), // random starting daily change %
      };
    });
    return initialPrices;
  });

  // Use a ref to keep prices fresh inside callbacks without re-triggering effects
  const pricesRef = useRef<Record<TradeSymbol, PriceData>>(prices);
  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  // Fetch real-world prices to anchor our live tick simulator
  const syncWithRealPrices = async () => {
    try {
      const erResponse = await fetch('https://open.er-api.com/v6/latest/USD');
      let erData: any = null;
      if (erResponse.ok) {
        erData = await erResponse.json();
      }

      const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
      const cryptoPrices: Record<string, number> = {};

      await Promise.all(
        cryptoSymbols.map(async (coin) => {
          try {
            const res = await fetch(`https://api.coinbase.com/v2/prices/${coin}-USD/spot`);
            if (res.ok) {
              const data = await res.json();
              const price = parseFloat(data?.data?.amount);
              if (!isNaN(price)) {
                cryptoPrices[`${coin}USD`] = price;
              }
            }
          } catch (e) {
            console.error(`Error fetching Coinbase price for ${coin}:`, e);
          }
        })
      );

      const updatedBasePrices: Partial<Record<TradeSymbol, number>> = {};

      if (erData && erData.rates) {
        const rates = erData.rates;
        if (rates.EUR) updatedBasePrices['EURUSD'] = 1 / rates.EUR;
        if (rates.GBP) updatedBasePrices['GBPUSD'] = 1 / rates.GBP;
        if (rates.JPY) updatedBasePrices['USDJPY'] = rates.JPY;
        if (rates.CHF) updatedBasePrices['USDCHF'] = rates.CHF;
        if (rates.CAD) updatedBasePrices['USDCAD'] = rates.CAD;
        if (rates.AUD) updatedBasePrices['AUDUSD'] = 1 / rates.AUD;
        if (rates.NZD) updatedBasePrices['NZDUSD'] = 1 / rates.NZD;
        
        if (rates.EUR && rates.JPY) updatedBasePrices['EURJPY'] = (1 / rates.EUR) * rates.JPY;
        if (rates.GBP && rates.JPY) updatedBasePrices['GBPJPY'] = (1 / rates.GBP) * rates.JPY;

        if (rates.XAU) {
          updatedBasePrices['XAUUSD'] = 1 / rates.XAU;
        }
        if (rates.XAG) {
          updatedBasePrices['XAGUSD'] = 1 / rates.XAG;
        }
      }

      cryptoSymbols.forEach((coin) => {
        const sym = `${coin}USD` as TradeSymbol;
        if (cryptoPrices[sym]) {
          updatedBasePrices[sym] = cryptoPrices[sym];
        }
      });

      setPrices((prevPrices) => {
        const nextPrices = { ...prevPrices };
        (Object.keys(updatedBasePrices) as TradeSymbol[]).forEach((sym) => {
          const realPrice = updatedBasePrices[sym];
          if (realPrice === undefined || isNaN(realPrice)) return;

          // Mutate MARKET_ASSETS dynamically so standard limits check in the tick simulator works
          if (MARKET_ASSETS[sym]) {
            MARKET_ASSETS[sym].basePrice = realPrice;
          }

          const asset = MARKET_ASSETS[sym];
          const spread = ASSET_SPREADS[sym];
          const digits = asset?.digits ?? 2;

          const bid = parseFloat((realPrice - spread / 2).toFixed(digits));
          const ask = parseFloat((realPrice + spread / 2).toFixed(digits));
          const prevChange = prevPrices[sym]?.changePercent ?? (Math.random() * 4 - 2);

          nextPrices[sym] = {
            bid,
            ask,
            lastPrice: realPrice,
            changePercent: prevChange,
          };
        });
        return nextPrices;
      });
    } catch (error) {
      console.error('Error syncing real-world prices:', error);
    }
  };

  // Sync real-world prices on mount and every 15 seconds
  useEffect(() => {
    syncWithRealPrices();
    const syncInterval = setInterval(syncWithRealPrices, 15000);
    return () => clearInterval(syncInterval);
  }, []);

  // Real-time market tick generator simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prevPrices) => {
        const nextPrices = { ...prevPrices };
        (Object.keys(MARKET_ASSETS) as TradeSymbol[]).forEach((sym) => {
          const prev = prevPrices[sym];
          const asset = MARKET_ASSETS[sym];
          const spread = ASSET_SPREADS[sym];

          // Small random volatility factor based on asset category
          let volatility = 0.0003; // Forex standard
          if (asset.category === 'Metals') volatility = 0.0008;
          if (asset.category === 'Crypto') volatility = 0.0025;

          const changeFactor = 1 + (Math.random() - 0.5) * volatility;
          let newPrice = prev.lastPrice * changeFactor;

          // Stay within +/- 15% of the base price to keep it realistic
          if (newPrice > asset.basePrice * 1.2) {
            newPrice = asset.basePrice * 1.15;
          } else if (newPrice < asset.basePrice * 0.8) {
            newPrice = asset.basePrice * 0.85;
          }

          // Format to correct decimal digits
          newPrice = parseFloat(newPrice.toFixed(asset.digits));

          const bid = parseFloat((newPrice - spread / 2).toFixed(asset.digits));
          const ask = parseFloat((newPrice + spread / 2).toFixed(asset.digits));
          const changePercent = prev.changePercent + (Math.random() * 0.1 - 0.05);

          nextPrices[sym] = {
            bid,
            ask,
            lastPrice: newPrice,
            changePercent: parseFloat(Math.min(Math.max(changePercent, -6), 6).toFixed(2)),
          };
        });
        return nextPrices;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Listen for user's trades and deposits from Firestore
  useEffect(() => {
    if (!currentUser) {
      setOpenTrades([]);
      setClosedTrades([]);
      setDeposits([]);
      setLoadingTrades(false);
      return;
    }

    setLoadingTrades(true);

    // Query active open trades
    const tradesCol = collection(db, 'trades');
    const qOpen = query(
      tradesCol,
      where('uid', '==', currentUser.uid),
      where('status', '==', 'open')
    );

    const unsubOpen = onSnapshot(qOpen, (snap) => {
      const active: Trade[] = [];
      snap.forEach((doc) => {
        active.push({ id: doc.id, ...doc.data() } as Trade);
      });
      setOpenTrades(active);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'trades');
    });

    // Query closed trades
    const qClosed = query(
      tradesCol,
      where('uid', '==', currentUser.uid),
      where('status', '==', 'closed')
    );

    const unsubClosed = onSnapshot(qClosed, (snap) => {
      const done: Trade[] = [];
      snap.forEach((doc) => {
        done.push({ id: doc.id, ...doc.data() } as Trade);
      });
      // Sort closed trades by closeTime descending
      done.sort((a, b) => (b.closeTime || 0) - (a.closeTime || 0));
      setClosedTrades(done);
      setLoadingTrades(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'trades');
    });

    // Query deposits
    const depositsCol = collection(db, 'deposits');
    const qDeposits = query(depositsCol, where('uid', '==', currentUser.uid));
    const unsubDeposits = onSnapshot(qDeposits, (snap) => {
      const userDeposits: Deposit[] = [];
      snap.forEach((doc) => {
        userDeposits.push({ id: doc.id, ...doc.data() } as Deposit);
      });
      userDeposits.sort((a, b) => b.createdAt - a.createdAt);
      setDeposits(userDeposits);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'deposits');
    });

    return () => {
      unsubOpen();
      unsubClosed();
      unsubDeposits();
    };
  }, [currentUser]);

  // Recalculate and update wallet locally whenever open trades floating prices change
  useEffect(() => {
    if (!currentUser || !wallet) return;

    let floatingPLSum = 0;
    let marginSum = 0;

    openTrades.forEach((trade) => {
      const freshPrice = prices[trade.symbol];
      if (!freshPrice) return;

      const asset = MARKET_ASSETS[trade.symbol];
      let currentPrice = trade.type === 'buy' ? freshPrice.bid : freshPrice.ask;

      // Handle SL/TP limits trigger simulation!
      // This is incredibly rich behavior: if prices hit SL/TP, the trade is automatically auto-closed!
      let shouldAutoClose = false;
      if (trade.sl) {
        if (trade.type === 'buy' && currentPrice <= trade.sl) shouldAutoClose = true;
        if (trade.type === 'sell' && currentPrice >= trade.sl) shouldAutoClose = true;
      }
      if (trade.tp) {
        if (trade.type === 'buy' && currentPrice >= trade.tp) shouldAutoClose = true;
        if (trade.type === 'sell' && currentPrice <= trade.tp) shouldAutoClose = true;
      }

      if (shouldAutoClose) {
        // Trigger auto close position asynchronously
        closePosition(trade.id);
        return;
      }

      // Standard P/L Calculation
      // pnl = (CurrentBid - OpenPrice) * Lots * ContractSize for buy
      // pnl = (OpenPrice - CurrentAsk) * Lots * ContractSize for sell
      let tradePnl = 0;
      if (trade.type === 'buy') {
        tradePnl = (currentPrice - trade.openPrice) * trade.lots * asset.contractSize;
      } else {
        tradePnl = (trade.openPrice - currentPrice) * trade.lots * asset.contractSize;
      }

      // Convert JPY pairs P/L to USD for standard quote currency simplicity
      if (trade.symbol.endsWith('JPY')) {
        // EURJPY or GBPJPY or USDJPY: divide JPY by current USDJPY rate
        const usdjpyPrice = prices['USDJPY']?.lastPrice || 156;
        tradePnl = tradePnl / usdjpyPrice;
      }

      floatingPLSum += tradePnl;

      // Leverage = 1:100. Margin required: (Lots * ContractSize * OpenPrice) / Leverage
      // For Crypto/Metals: standardizing margin requirements beautifully
      const leverage = 100;
      let requiredMargin = (trade.lots * asset.contractSize * trade.openPrice) / leverage;

      // Convert to USD margin if base is not USD
      if (trade.symbol.startsWith('EUR') && trade.symbol !== 'EURUSD') {
        requiredMargin = requiredMargin * (prices['EURUSD']?.lastPrice || 1.08);
      } else if (trade.symbol.startsWith('GBP') && trade.symbol !== 'GBPUSD') {
        requiredMargin = requiredMargin * (prices['GBPUSD']?.lastPrice || 1.27);
      } else if (trade.symbol.startsWith('USDJPY') || trade.symbol.endsWith('JPY')) {
        // Convert JPY margin back to USD
        const usdjpyPrice = prices['USDJPY']?.lastPrice || 156;
        requiredMargin = requiredMargin / usdjpyPrice;
      }

      marginSum += requiredMargin;
    });

    const calculatedEquity = wallet.balance + floatingPLSum;
    const calculatedFreeMargin = calculatedEquity - marginSum;

    // Trigger stop-out margin level: if Equity falls below 50% of Used Margin and we have active margin
    // Trigger stopout: close worst trade
    if (marginSum > 0 && (calculatedEquity / marginSum) < 0.5) {
      // Find trade with biggest loss
      let worstTrade: Trade | null = null;
      let worstLoss = 0;
      openTrades.forEach((t) => {
        const freshPrice = prices[t.symbol];
        if (!freshPrice) return;
        const asset = MARKET_ASSETS[t.symbol];
        let currentPrice = t.type === 'buy' ? freshPrice.bid : freshPrice.ask;
        let tradePnl = t.type === 'buy' ? (currentPrice - t.openPrice) : (t.openPrice - currentPrice);
        tradePnl = tradePnl * t.lots * asset.contractSize;
        if (tradePnl < worstLoss) {
          worstLoss = tradePnl;
          worstTrade = t;
        }
      });

      if (worstTrade) {
        closePosition((worstTrade as Trade).id);
      }
    }

    // Sync state locally to update UI instantly without writing constantly to Firestore
    if (
      Math.abs(wallet.floatingPL - floatingPLSum) > 0.05 ||
      Math.abs(wallet.equity - calculatedEquity) > 0.05 ||
      Math.abs(wallet.margin - marginSum) > 0.05 ||
      Math.abs(wallet.freeMargin - calculatedFreeMargin) > 0.05
    ) {
      updateLocalWallet({
        ...wallet,
        equity: parseFloat(calculatedEquity.toFixed(2)),
        freeMargin: parseFloat(calculatedFreeMargin.toFixed(2)),
        margin: parseFloat(marginSum.toFixed(2)),
        floatingPL: parseFloat(floatingPLSum.toFixed(2)),
        updatedAt: Date.now(),
      });
    }
  }, [prices, openTrades, wallet]);

  // Open interactive trade
  const openPosition = async (type: 'buy' | 'sell', lots: number, sl?: number, tp?: number) => {
    if (!currentUser || !wallet) return;

    const freshPrice = prices[activeSymbol];
    const asset = MARKET_ASSETS[activeSymbol];
    if (!freshPrice) return;

    // Open price is Bid for sell, Ask for buy
    const openPrice = type === 'buy' ? freshPrice.ask : freshPrice.bid;

    // Check margin availability
    const leverage = 100;
    let requiredMargin = (lots * asset.contractSize * openPrice) / leverage;

    // Convert required margin to USD
    if (activeSymbol.startsWith('EUR') && activeSymbol !== 'EURUSD') {
      requiredMargin = requiredMargin * (prices['EURUSD']?.lastPrice || 1.08);
    } else if (activeSymbol.startsWith('GBP') && activeSymbol !== 'GBPUSD') {
      requiredMargin = requiredMargin * (prices['GBPUSD']?.lastPrice || 1.27);
    } else if (activeSymbol.endsWith('JPY')) {
      const usdjpyPrice = prices['USDJPY']?.lastPrice || 156;
      requiredMargin = requiredMargin / usdjpyPrice;
    }

    if (wallet.freeMargin < requiredMargin) {
      throw new Error('Insufficient Free Margin to open this lot size!');
    }

    const tradeDoc: Omit<Trade, 'id'> = {
      uid: currentUser.uid,
      symbol: activeSymbol,
      type,
      lots,
      openPrice,
      sl: sl || null,
      tp: tp || null,
      status: 'open',
      pnl: 0,
      openTime: Date.now(),
    };

    try {
      await addDoc(collection(db, 'trades'), tradeDoc);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'trades');
    }
  };

  // Close trade position
  const closePosition = async (tradeId: string) => {
    if (!currentUser || !wallet) return;

    // Find the trade in our open list
    const trade = openTrades.find((t) => t.id === tradeId);
    if (!trade) return;

    const freshPrice = prices[trade.symbol];
    if (!freshPrice) return;

    const asset = MARKET_ASSETS[trade.symbol];
    const closePrice = trade.type === 'buy' ? freshPrice.bid : freshPrice.ask;

    // Calculate final P/L
    let finalPnl = 0;
    if (trade.type === 'buy') {
      finalPnl = (closePrice - trade.openPrice) * trade.lots * asset.contractSize;
    } else {
      finalPnl = (trade.openPrice - closePrice) * trade.lots * asset.contractSize;
    }

    // Convert JPY to USD
    if (trade.symbol.endsWith('JPY')) {
      const usdjpyPrice = prices['USDJPY']?.lastPrice || 156;
      finalPnl = finalPnl / usdjpyPrice;
    }

    finalPnl = parseFloat(finalPnl.toFixed(2));

    // Update the trade in Firestore
    const tradeRef = doc(db, 'trades', tradeId);
    try {
      await updateDoc(tradeRef, {
        status: 'closed',
        closePrice,
        pnl: finalPnl,
        closeTime: Date.now(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `trades/${tradeId}`);
    }

    // Update user's wallet in Firestore persistently
    const newBalance = parseFloat((wallet.balance + finalPnl).toFixed(2));
    const walletRef = doc(db, 'wallets', currentUser.uid);
    try {
      await updateDoc(walletRef, {
        balance: newBalance,
        equity: newBalance,
        floatingPL: 0,
        margin: 0,
        freeMargin: newBalance,
        updatedAt: Date.now(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `wallets/${currentUser.uid}`);
    }

    // Also update locally immediately for visual fluidity
    updateLocalWallet({
      ...wallet,
      balance: newBalance,
      equity: newBalance,
      floatingPL: 0,
      margin: 0,
      freeMargin: newBalance,
      updatedAt: Date.now(),
    });
  };

  // Create real deposit
  const createDeposit = async (amount: number, txHash: string, screenshot: string) => {
    if (!currentUser) return;

    const depositDoc: Omit<Deposit, 'id'> = {
      uid: currentUser.uid,
      email: currentUser.email || '',
      amount,
      txHash,
      screenshot, // base64 string
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await addDoc(collection(db, 'deposits'), depositDoc);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'deposits');
    }
  };

  const value: TradingContextType = {
    prices,
    activeSymbol,
    setActiveSymbol,
    openTrades,
    closedTrades,
    deposits,
    loadingTrades,
    openPosition,
    closePosition,
    createDeposit,
  };

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
}
