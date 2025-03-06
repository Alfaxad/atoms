export interface Token {
  symbol: string;
  name: string;
  mintAddress: string;
  decimals: number;
  initialSupply: number;
  currentPrice: number;
  totalVolume: number;
  creator: string;
  createdAt: number;
  fraudScore: number; // 0-1 where 1 indicates high likelihood of fraud
}

export interface Trade {
  id: string;
  atomId: string;
  walletAddress: string;
  tokenSymbol: string;
  tokenAddress: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  transactionSignature: string;
  timestamp: number;
  success: boolean;
  error?: string;
}

export interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
}

export interface MarketState {
  tokens: Record<string, Token>;
  latestPrices: Record<string, number>;
  priceHistory: Record<string, PricePoint[]>;
  lastUpdated: number;
  globalVolume: number;
}

export interface OrderBook {
  buys: Order[];
  sells: Order[];
}

export interface Order {
  id: string;
  atomId: string;
  walletAddress: string;
  type: 'buy' | 'sell';
  tokenSymbol: string;
  tokenAddress: string;
  price: number;
  amount: number;
  timestamp: number;
  status: 'open' | 'filled' | 'cancelled';
}
