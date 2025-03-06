import { SolanaAgentKit } from 'solana-agent-kit';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Trade, Token, Order } from './types';
import { TokenManager } from './tokenManager';
import { MarketSimulator } from './marketSimulator';
import { AtomManager } from '../agents/atomManager';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { env } from '../utils/environment';

export class TradingSystem {
  private solanaAgent: SolanaAgentKit;
  private tokenManager: TokenManager;
  private marketSimulator: MarketSimulator;
  private atomManager: AtomManager;
  private trades: Trade[] = [];
  private orders: Order[] = [];
  private basePath: string;

  constructor(
    tokenManager: TokenManager,
    marketSimulator: MarketSimulator,
    atomManager: AtomManager
  ) {
    // Create a separate agent instance if needed; alternatively, you could re-use the one from tokenManager.
    this.solanaAgent = new SolanaAgentKit(
      env.SOLANA_PRIVATE_KEY,
      env.RPC_URL,
      env.OPENAI_API_KEY
    );

    this.tokenManager = tokenManager;
    this.marketSimulator = marketSimulator;
    this.atomManager = atomManager;
    
    this.basePath = path.join(process.cwd(), 'data', 'trading');
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
      fs.mkdirSync(path.join(this.basePath, 'trades'), { recursive: true });
      fs.mkdirSync(path.join(this.basePath, 'orders'), { recursive: true });
    }
  }

  async executeTrade(
    atomId: string,
    tokenSymbol: string,
    type: 'buy' | 'sell',
    amount: number,
    maxSlippage: number = 0.01 // 1% max slippage
  ): Promise<Trade> {
    const atom = this.atomManager.getAtom(atomId);
    if (!atom) {
      throw new Error(`Atom with ID ${atomId} not found`);
    }
    
    const token = this.tokenManager.getToken(tokenSymbol);
    if (!token) {
      throw new Error(`Token with symbol ${tokenSymbol} not found`);
    }
    
    // Get current price from the market simulator (assumed in USDC per token)
    let currentPrice = this.marketSimulator.getTokenPrice(tokenSymbol);
    
    // Ensure price is not zero - use default price if needed
    if (currentPrice <= 0) {
      currentPrice = token.symbol === 'USDC' ? 1.0 : 0.5; // Default prices
      this.tokenManager.updateTokenPrice(tokenSymbol, currentPrice);
    }
    
    // Generate a unique ID for the trade
    const tradeId = uuidv4();
    
    // Create trade object (store extra details for simulation records)
    const trade: Trade = {
      id: tradeId,
      atomId,
      walletAddress: atom.walletAddress,
      tokenSymbol,
      tokenAddress: token.mintAddress,
      type,
      amount,
      price: currentPrice,
      transactionSignature: '',
      timestamp: Date.now(),
      success: false
    };
    
    try {
      console.log(`Executing ${type} trade for ${amount} ${tokenSymbol} at $${currentPrice.toFixed(4)} by atom ${atomId}`);
      
      // For simplicity, we'll assume USDC as the quote token
      const usdcToken = this.tokenManager.getToken('USDC');
      if (!usdcToken) {
        throw new Error('USDC token not found for trading');
      }
      
      // Create a mock signature for simulation purposes
      // In a real environment, this would be a Solana transaction signature
      const signature = `sim_tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Update trade with success and signature
      trade.transactionSignature = signature;
      trade.success = true;
      
      // Add trade to the list
      this.trades.push(trade);
      
      // Save trade to disk
      this.saveTrade(trade);
      
      // Simulate market impact
      this.simulateMarketImpact(tokenSymbol, type, amount, currentPrice);
      
      return trade;
    } catch (error) {
      // Update trade with error
      trade.success = false;
      trade.error = error instanceof Error ? error.message : 'Unknown error';
      
      // Still add to the list for record-keeping
      this.trades.push(trade);
      
      // Save trade to disk
      this.saveTrade(trade);
      
      console.error(`Error executing trade:`, error);
      throw error;
    }
  }

  async placeOrder(
    atomId: string,
    tokenSymbol: string,
    type: 'buy' | 'sell',
    price: number,
    amount: number
  ): Promise<Order> {
    const atom = this.atomManager.getAtom(atomId);
    if (!atom) {
      throw new Error(`Atom with ID ${atomId} not found`);
    }
    
    const token = this.tokenManager.getToken(tokenSymbol);
    if (!token) {
      throw new Error(`Token with symbol ${tokenSymbol} not found`);
    }
    
    // Generate a unique ID for the order
    const orderId = uuidv4();
    
    // Create order object
    const order: Order = {
      id: orderId,
      atomId,
      walletAddress: atom.walletAddress,
      type,
      tokenSymbol,
      tokenAddress: token.mintAddress,
      price,
      amount,
      timestamp: Date.now(),
      status: 'open'
    };
    
    // Add order to the list
    this.orders.push(order);
    
    // Save order to disk
    this.saveOrder(order);
    
    console.log(`Placed ${type} order for ${amount} ${tokenSymbol} at $${price.toFixed(4)} by atom ${atomId}`);
    
    return order;
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return false;
    
    const order = this.orders[orderIndex];
    if (order.status !== 'open') return false;
    
    // Update order status
    order.status = 'cancelled';
    
    // Save order to disk
    this.saveOrder(order);
    
    console.log(`Cancelled order ${orderId}`);
    
    return true;
  }

  async processOrders(): Promise<Trade[]> {
    const executedTrades: Trade[] = [];
    const openOrders = this.orders.filter(o => o.status === 'open');
    
    for (const order of openOrders) {
      const currentPrice = this.marketSimulator.getTokenPrice(order.tokenSymbol);
      
      // Check if order should be executed
      let shouldExecute = false;
      
      if (order.type === 'buy' && currentPrice <= order.price) {
        // For buy orders, execute when current price is less than or equal to order price
        shouldExecute = true;
      } else if (order.type === 'sell' && currentPrice >= order.price) {
        // For sell orders, execute when current price is greater than or equal to order price
        shouldExecute = true;
      }
      
      if (shouldExecute) {
        try {
          // Execute trade
          const trade = await this.executeTrade(
            order.atomId,
            order.tokenSymbol,
            order.type,
            order.amount
          );
          
          executedTrades.push(trade);
          
          // Update order status
          order.status = 'filled';
          this.saveOrder(order);
        } catch (error) {
          console.error(`Error executing order ${order.id}:`, error);
        }
      }
    }
    
    return executedTrades;
  }

  getRecentTrades(limit: number = 50): Trade[] {
    // Sort by timestamp (newest first) and apply limit
    return [...this.trades]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getTradesByAtom(atomId: string, limit: number = 50): Trade[] {
    return this.trades
      .filter(t => t.atomId === atomId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getTradesByToken(tokenSymbol: string, limit: number = 50): Trade[] {
    return this.trades
      .filter(t => t.tokenSymbol === tokenSymbol)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getOpenOrders(): Order[] {
    return this.orders.filter(o => o.status === 'open');
  }

  getOrdersByAtom(atomId: string): Order[] {
    return this.orders.filter(o => o.atomId === atomId);
  }

  private simulateMarketImpact(
    tokenSymbol: string,
    tradeType: 'buy' | 'sell',
    amount: number,
    price: number
  ): void {
    const token = this.tokenManager.getToken(tokenSymbol);
    if (!token) return;
    
    // Get total market volume for the token (creates more realistic impact)
    const historicalVolume = Math.max(token.totalVolume, 100); // Avoid division by zero
    
    // Calculate trade value
    const tradeValue = amount * price;
    
    // Calculate relative size of this trade compared to token's typical volume
    // Larger trades relative to token's volume have more impact
    const relativeTradeSize = tradeValue / historicalVolume;
    
    // Non-linear impact function - larger trades have disproportionately more impact
    const impactFactor = Math.pow(relativeTradeSize, 0.75) * 0.5;
    
    // Cap the impact at reasonable levels
    const cappedImpact = Math.min(0.1, impactFactor); // Max 10% price impact
    
    // For USDC, drastically reduce impact (stablecoin)
    const finalImpact = tokenSymbol === 'USDC' ? cappedImpact * 0.01 : cappedImpact;
    
    // Apply the impact with direction based on trade type
    if (tradeType === 'buy') {
      // Buying tends to increase price
      this.marketSimulator.simulateTokenPump(tokenSymbol, finalImpact);
      
      // Sometimes buying one token affects related tokens (market correlation)
      if (finalImpact > 0.01 && tokenSymbol.startsWith('ATOM') && tokenSymbol !== 'ATOMS') {
        // Small positive effect on the main ATOMS token
        this.marketSimulator.simulateTokenPump('ATOMS', finalImpact * 0.1);
      }
    } else {
      // Selling tends to decrease price
      this.marketSimulator.simulateTokenDump(tokenSymbol, finalImpact);
      
      // Sometimes selling one token affects related tokens (market correlation)
      if (finalImpact > 0.01 && tokenSymbol.startsWith('ATOM') && tokenSymbol !== 'ATOMS') {
        // Small negative effect on the main ATOMS token
        this.marketSimulator.simulateTokenDump('ATOMS', finalImpact * 0.1);
      }
    }
    
    // Record the impact for analysis
    if (finalImpact > 0.001) {
      console.log(`Trade impact: ${tradeType} ${amount} ${tokenSymbol} caused ~${(finalImpact * 100).toFixed(2)}% price movement`);
    }
  }

  private saveTrade(trade: Trade): void {
    const filePath = path.join(this.basePath, 'trades', `${trade.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(trade, null, 2));
  }

  private saveOrder(order: Order): void {
    const filePath = path.join(this.basePath, 'orders', `${order.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(order, null, 2));
  }

  async loadTrades(): Promise<void> {
    // Clear existing trades
    this.trades = [];
    
    // Load trades from disk
    const tradesDir = path.join(this.basePath, 'trades');
    if (fs.existsSync(tradesDir)) {
      const files = fs.readdirSync(tradesDir).filter(file => file.endsWith('.json'));
      
      for (const file of files) {
        const filePath = path.join(tradesDir, file);
        const trade = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Trade;
        this.trades.push(trade);
      }
    }
    
    console.log(`Loaded ${this.trades.length} trades from disk`);
  }

  async loadOrders(): Promise<void> {
    // Clear existing orders
    this.orders = [];
    
    // Load orders from disk
    const ordersDir = path.join(this.basePath, 'orders');
    if (fs.existsSync(ordersDir)) {
      const files = fs.readdirSync(ordersDir).filter(file => file.endsWith('.json'));
      
      for (const file of files) {
        const filePath = path.join(ordersDir, file);
        const order = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Order;
        this.orders.push(order);
      }
    }
    
    console.log(`Loaded ${this.orders.length} orders from disk`);
  }
}
