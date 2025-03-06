import { Token, PricePoint, MarketState } from './types';
import { TokenManager } from './tokenManager';
import * as fs from 'fs';
import * as path from 'path';

export class MarketSimulator {
  private tokenManager: TokenManager;
  private basePath: string;
  private marketState: MarketState;
  
  // Parameters for price simulation
  private volatilityFactors: Map<string, number> = new Map();
  private trendFactors: Map<string, number> = new Map();
  private lastUpdateTime: number;
  private updateInterval: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
    this.basePath = path.join(process.cwd(), 'data', 'market');
    
    // Ensure the market directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
    
    // Initialize market state
    this.marketState = {
      tokens: {},
      latestPrices: {},
      priceHistory: {},
      lastUpdated: Date.now(),
      globalVolume: 0
    };
    
    this.lastUpdateTime = Date.now();
  }

  async initialize(): Promise<void> {
    // Load tokens
    const tokens = this.tokenManager.getAllTokens();
    
    // Initialize market state
    for (const token of tokens) {
      // Set initial prices based on token type
      let initialPrice: number;
      
      switch(token.symbol) {
        case 'USDC':
          initialPrice = 1.0; // Stablecoin pegged to $1
          break;
        case 'ATOMS':
          initialPrice = 2.5 + (Math.random() * 1.5); // $2.5-$4 range
          break;
        case 'ATOM1':
          initialPrice = 0.75 + (Math.random() * 0.5); // $0.75-$1.25 range
          break;
        case 'ATOM2':
          initialPrice = 1.25 + (Math.random() * 0.75); // $1.25-$2 range
          break;
        case 'ATOM3':
          initialPrice = 0.5 + (Math.random() * 0.25); // $0.5-$0.75 range
          break;
        default:
          initialPrice = 0.1 + (Math.random() * 4.9); // $0.1-$5 range
      }
      
      this.marketState.tokens[token.symbol] = token;
      this.marketState.latestPrices[token.symbol] = initialPrice;
      token.currentPrice = initialPrice;
      
      // Update token price in manager
      this.tokenManager.updateTokenPrice(token.symbol, initialPrice);
      
      // Get price history
      const history = this.tokenManager.getPriceHistory(token.symbol);
      this.marketState.priceHistory[token.symbol] = history;
      
      // Initialize volatility factor (different for each token)
      let volatilityBase = 0.005;
      if (token.symbol === 'USDC') {
        volatilityBase = 0.0005; // Stablecoin has very low volatility
      } else if (token.symbol === 'ATOMS') {
        volatilityBase = 0.015; // Main token is moderately volatile
      } else if (token.symbol === 'ATOM1' && Math.random() < 0.7) {
        volatilityBase = 0.025; // This token is more volatile (potential fraud target)
      }
      
      this.volatilityFactors.set(token.symbol, volatilityBase + Math.random() * 0.02);
      
      // Initialize trend factor (different for each token)
      const trendBase = token.symbol === 'USDC' ? 0 : -0.001 + (Math.random() * 0.002);
      this.trendFactors.set(token.symbol, trendBase);
    }
    
    // Save market state
    this.saveMarketState();
    
    console.log(`Market simulator initialized with ${tokens.length} tokens`);
  }

  simulateMarketMovement(deltaTimeMs: number = this.updateInterval): void {
    const now = Date.now();
    const timeFactor = deltaTimeMs / this.updateInterval; // Scale movement based on time
    
    // Update each token price
    for (const symbol of Object.keys(this.marketState.tokens)) {
      const currentPrice = this.marketState.latestPrices[symbol];
      const volatilityFactor = this.volatilityFactors.get(symbol) || 0.01;
      const trendFactor = this.trendFactors.get(symbol) || 0;
      
      // Apply more complex price movement algorithms
      let percentChange = 0;
      
      // Special cases for different tokens
      if (symbol === 'USDC') {
        // Stablecoin should stay very close to $1
        const deviation = currentPrice - 1.0;
        percentChange = -deviation * 0.1 * timeFactor; // Return to peg
      } else {
        // Use a normal-like distribution centered around the trend
        const r1 = Math.random();
        const r2 = Math.random();
        const normalRandom = Math.sqrt(-2 * Math.log(r1)) * Math.cos(2 * Math.PI * r2);
        
        // Base change on volatility, trend, and random factor
        percentChange = (normalRandom * volatilityFactor + trendFactor) * timeFactor;
        
        // Occasionally add larger market movements
        if (Math.random() < 0.02 * timeFactor) {  // 2% chance per interval
          // Market shock - much larger movement
          const shockFactor = (Math.random() * 0.05) * (Math.random() < 0.5 ? -1 : 1);
          percentChange += shockFactor;
          
          // Log significant price movements
          if (Math.abs(shockFactor) > 0.02) {
            console.log(`Significant price movement for ${symbol}: ${(shockFactor * 100).toFixed(2)}%`);
          }
        }
      }
      
      // Calculate new price with a minimum floor
      const minPrice = symbol === 'USDC' ? 0.95 : 0.01;
      const newPrice = Math.max(minPrice, currentPrice * (1 + percentChange));
      
      // Simulate volume - higher volume when price changes more
      const volumeBase = Math.pow(Math.abs(percentChange) * 100, 1.5);
      const volume = currentPrice * (100 + volumeBase * 900 * volatilityFactor);
      
      // Update token price
      this.marketState.latestPrices[symbol] = newPrice;
      this.marketState.globalVolume += volume;
      
      // Update token in manager
      this.tokenManager.updateTokenPrice(symbol, newPrice, volume);
      
      // Occasionally change trend (more likely when market is more volatile)
      const trendChangeChance = 0.05 * timeFactor * (volatilityFactor * 10);
      if (Math.random() < trendChangeChance) {
        // Shift the trend
        const newTrend = trendFactor + (Math.random() * 0.004 - 0.002);
        // Limit the trend range
        const maxTrend = 0.003;
        const boundedTrend = Math.max(-maxTrend, Math.min(maxTrend, newTrend));
        this.trendFactors.set(symbol, boundedTrend);
      }
    }
    
    // Update last update time
    this.lastUpdateTime = now;
    this.marketState.lastUpdated = now;
    
    // Save market state
    this.saveMarketState();
  }

  simulateTokenPump(symbol: string, intensity: number = 1): void {
    const token = this.marketState.tokens[symbol];
    if (!token) return;
    
    // Set a strong positive trend
    const currentTrend = this.trendFactors.get(symbol) || 0;
    const newTrend = currentTrend + (0.002 * intensity); 
    this.trendFactors.set(symbol, Math.min(0.005, newTrend)); // Cap at 0.5% growth per interval
    
    // Increase volatility
    const currentVolatility = this.volatilityFactors.get(symbol) || 0.01;
    this.volatilityFactors.set(symbol, currentVolatility * (1 + intensity * 0.2));
    
    // Immediate price bump
    const currentPrice = this.marketState.latestPrices[symbol];
    const newPrice = currentPrice * (1 + 0.01 * intensity);
    this.marketState.latestPrices[symbol] = newPrice;
    this.tokenManager.updateTokenPrice(symbol, newPrice);
    
    // Log if significant
    if (intensity > 0.5) {
      console.log(`Simulated pump for ${symbol} with intensity ${intensity.toFixed(2)}`);
    }
  }

  simulateTokenDump(symbol: string, intensity: number = 1): void {
    const token = this.marketState.tokens[symbol];
    if (!token) return;
    
    // Set a strong negative trend
    const currentTrend = this.trendFactors.get(symbol) || 0;
    const newTrend = currentTrend - (0.002 * intensity);
    this.trendFactors.set(symbol, Math.max(-0.005, newTrend)); // Cap at -0.5% decline per interval
    
    // Increase volatility
    const currentVolatility = this.volatilityFactors.get(symbol) || 0.01;
    this.volatilityFactors.set(symbol, currentVolatility * (1 + intensity * 0.2));
    
    // Immediate price drop
    const currentPrice = this.marketState.latestPrices[symbol];
    const newPrice = currentPrice * (1 - 0.01 * intensity);
    this.marketState.latestPrices[symbol] = newPrice;
    this.tokenManager.updateTokenPrice(symbol, newPrice);
    
    // Log if significant
    if (intensity > 0.5) {
      console.log(`Simulated dump for ${symbol} with intensity ${intensity.toFixed(2)}`);
    }
  }

  getMarketState(): MarketState {
    return { ...this.marketState };
  }

  getTokenPrice(symbol: string): number {
    return this.marketState.latestPrices[symbol] || 0;
  }

  private saveMarketState(): void {
    const filePath = path.join(this.basePath, 'market_state.json');
    fs.writeFileSync(filePath, JSON.stringify(this.marketState, null, 2));
  }

  async loadMarketState(): Promise<void> {
    const filePath = path.join(this.basePath, 'market_state.json');
    
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as MarketState;
        this.marketState = data;
        
        // Reinitialize volatility and trend factors if they don't exist
        for (const symbol of Object.keys(this.marketState.tokens)) {
          if (!this.volatilityFactors.has(symbol)) {
            let volatilityBase = 0.005;
            
            if (symbol === 'USDC') {
              volatilityBase = 0.0005; // Stablecoin has very low volatility
            } else if (symbol === 'ATOMS') {
              volatilityBase = 0.015; // Main token is moderately volatile
            } else if (symbol === 'ATOM1') {
              volatilityBase = 0.025; // Higher volatility for this token
            }
            
            this.volatilityFactors.set(symbol, volatilityBase + Math.random() * 0.02);
          }
          
          if (!this.trendFactors.has(symbol)) {
            const trendBase = symbol === 'USDC' ? 0 : -0.001 + (Math.random() * 0.002);
            this.trendFactors.set(symbol, trendBase);
          }
        }
        
        this.lastUpdateTime = this.marketState.lastUpdated;
        
        console.log(`Loaded market state with ${Object.keys(this.marketState.tokens).length} tokens`);
      } catch (error) {
        console.error('Error loading market state:', error);
        // Initialize new state
        await this.initialize();
      }
    } else {
      console.log('No existing market state found, initializing new state');
      await this.initialize();
    }
  }
}
