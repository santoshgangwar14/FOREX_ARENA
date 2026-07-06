export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: number;
  isAdmin?: boolean;
}

export interface Wallet {
  uid: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  floatingPL: number;
  updatedAt: number;
}

export interface Deposit {
  id: string;
  uid: string;
  email: string;
  amount: number;
  txHash: string;
  screenshot?: string; // base64 string
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

export type TradeSymbol =
  // Metals
  | 'XAUUSD'
  | 'XAGUSD'
  // Forex
  | 'EURUSD'
  | 'GBPUSD'
  | 'USDJPY'
  | 'USDCHF'
  | 'USDCAD'
  | 'AUDUSD'
  | 'NZDUSD'
  | 'EURJPY'
  | 'GBPJPY'
  // Crypto
  | 'BTCUSD'
  | 'ETHUSD'
  | 'SOLUSD'
  | 'BNBUSD'
  | 'XRPUSD'
  // Indices
  | 'NAS100'
  | 'US30'
  | 'SPX500';

export interface MarketAsset {
  symbol: TradeSymbol;
  name: string;
  category: 'Metals' | 'Forex' | 'Crypto' | 'Indices';
  contractSize: number;
  pipSize: number; // For pip & P/L calculation
  basePrice: number;
  digits: number; // decimals to display
}

export interface Trade {
  id: string;
  uid: string;
  symbol: TradeSymbol;
  type: 'buy' | 'sell';
  lots: number;
  openPrice: number;
  closePrice?: number;
  sl?: number;
  tp?: number;
  status: 'open' | 'closed';
  pnl: number;
  openTime: number;
  closeTime?: number;
}

export interface AppSettings {
  leverage: number; // e.g. 100 for 1:100
  maintenance: boolean;
}
