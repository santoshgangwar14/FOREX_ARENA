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

import {
  priceService,
  PriceData as ServicePriceData,
  APP_MARKET_ASSETS,
  APP_ASSET_SPREADS,
  BASELINE_PRICES,
} from '../services/priceService';

export const MARKET_ASSETS: Record<TradeSymbol, MarketAsset> = {} as Record<TradeSymbol, MarketAsset>;
(Object.keys(APP_MARKET_ASSETS) as TradeSymbol[]).forEach((sym) => {
  MARKET_ASSETS[sym] = {
    ...APP_MARKET_ASSETS[sym],
    basePrice: BASELINE_PRICES[sym],
  } as MarketAsset;
});

export const ASSET_SPREADS = APP_ASSET_SPREADS;

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

  // Prices state initialized from Price Service
  const [prices, setPrices] = useState<Record<TradeSymbol, PriceData>>(() => priceService.getLatestPrices());

  // Use a ref to keep prices fresh inside callbacks without re-triggering effects
  const pricesRef = useRef<Record<TradeSymbol, PriceData>>(prices);
  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  // Synchronize with the central Price Service singleton
  useEffect(() => {
    const unsubscribe = priceService.subscribe((freshPrices) => {
      setPrices(freshPrices);
    });
    return unsubscribe;
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

      // Safety check: Prevent temporary baseline initialization drops from liquidating trades on page refresh
      const baseline = BASELINE_PRICES[trade.symbol];
      const isStillAtBaseline = Math.abs(currentPrice - baseline) < (baseline * 0.015);
      const isTradeFarFromBaseline = Math.abs(trade.openPrice - baseline) > (baseline * 0.15);
      const isUnresolvedFetch = isStillAtBaseline && isTradeFarFromBaseline;

      // Handle SL/TP limits trigger simulation!
      // This is incredibly rich behavior: if prices hit SL/TP, the trade is automatically auto-closed!
      let shouldAutoClose = false;
      if (!isUnresolvedFetch) {
        if (trade.sl) {
          if (trade.type === 'buy' && currentPrice <= trade.sl) shouldAutoClose = true;
          if (trade.type === 'sell' && currentPrice >= trade.sl) shouldAutoClose = true;
        }
        if (trade.tp) {
          if (trade.type === 'buy' && currentPrice >= trade.tp) shouldAutoClose = true;
          if (trade.type === 'sell' && currentPrice <= trade.tp) shouldAutoClose = true;
        }
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
      if (isUnresolvedFetch) {
        // Retain saved profit/loss to prevent visual jitter or margin stopout before API response
        tradePnl = trade.pnl || 0;
      } else {
        if (trade.type === 'buy') {
          tradePnl = (currentPrice - trade.openPrice) * trade.lots * asset.contractSize;
        } else {
          tradePnl = (trade.openPrice - currentPrice) * trade.lots * asset.contractSize;
        }
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

        // Apply unresolved fetch protection here too
        const baseline = BASELINE_PRICES[t.symbol];
        const isStillAtBaseline = Math.abs(currentPrice - baseline) < (baseline * 0.015);
        const isTradeFarFromBaseline = Math.abs(t.openPrice - baseline) > (baseline * 0.15);
        if (isStillAtBaseline && isTradeFarFromBaseline) {
          return; // Skip stopout evaluation during unresolved fetch
        }

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
