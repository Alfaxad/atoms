import { SimulationManager } from './simulationManager';
import { TokenManager } from '../trading/tokenManager';
import { MarketSimulator } from '../trading/marketSimulator';
import { TradingSystem } from '../trading/tradingSystem';
import { CommunicationSystem } from '../communication/communicationSystem';
import * as fs from 'fs';
import * as path from 'path';

export class SimulationMonitor {
  private simulationManager: SimulationManager;
  private tokenManager: TokenManager;
  private marketSimulator: MarketSimulator;
  private tradingSystem: TradingSystem;
  private communicationSystem: CommunicationSystem;
  private basePath: string;
  private snapshotInterval: NodeJS.Timeout | null = null;
  
  constructor(
    simulationManager: SimulationManager,
    tokenManager: TokenManager,
    marketSimulator: MarketSimulator,
    tradingSystem: TradingSystem,
    communicationSystem: CommunicationSystem
  ) {
    this.simulationManager = simulationManager;
    this.tokenManager = tokenManager;
    this.marketSimulator = marketSimulator;
    this.tradingSystem = tradingSystem;
    this.communicationSystem = communicationSystem;
    
    this.basePath = path.join(process.cwd(), 'data', 'monitoring');
    
    // Ensure the monitoring directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  startMonitoring(snapshotFrequencyMs: number = 60000): void {
    // Stop any existing monitoring
    this.stopMonitoring();
    
    console.log(`Starting simulation monitoring with snapshots every ${snapshotFrequencyMs / 1000} seconds`);
    
    // Take initial snapshot
    this.takeSnapshot();
    
    // Schedule regular snapshots
    this.snapshotInterval = setInterval(() => {
      this.takeSnapshot();
    }, snapshotFrequencyMs);
  }

  stopMonitoring(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
      console.log('Simulation monitoring stopped');
    }
  }

  takeSnapshot(): void {
    const now = Date.now();
    
    try {
      // 1. Get simulation status
      const simulationStatus = this.simulationManager.getStatus();
      
      // 2. Get market state
      const marketState = this.marketSimulator.getMarketState();
      
      // 3. Get recent trades
      const recentTrades = this.tradingSystem.getRecentTrades(100);
      
      // 4. Get recent messages
      const recentMessages = this.communicationSystem.getRecentMessages(100);
      
      // 5. Get trending topics
      const trendingTopics = this.communicationSystem.getTopicTrends(10);
      
      // Combine data into snapshot
      const snapshot = {
        timestamp: now,
        simulation: simulationStatus,
        market: {
          tokens: Object.keys(marketState.tokens).map(symbol => ({
            symbol,
            price: this.marketSimulator.getTokenPrice(symbol),
            priceHistory: this.tokenManager.getPriceHistory(symbol, 20)
          })),
          globalVolume: marketState.globalVolume
        },
        trading: {
          recentTrades: recentTrades.map(trade => ({
            id: trade.id,
            atomId: trade.atomId,
            tokenSymbol: trade.tokenSymbol,
            type: trade.type,
            amount: trade.amount,
            price: trade.price,
            timestamp: trade.timestamp
          }))
        },
        communication: {
          recentMessages: recentMessages.map(msg => ({
            id: msg.id,
            atomId: msg.atomId,
            content: msg.content,
            timestamp: msg.timestamp
          })),
          trendingTopics
        }
      };
      
      // Save snapshot
      const filename = `snapshot_${now}.json`;
      const filePath = path.join(this.basePath, filename);
      fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
      
      // Save latest snapshot reference
      const latestPath = path.join(this.basePath, 'latest_snapshot.json');
      fs.writeFileSync(latestPath, JSON.stringify({ latestSnapshot: filename, timestamp: now }, null, 2));
      
      console.log(`Monitoring snapshot taken at ${new Date(now).toISOString()}`);
    } catch (error) {
      console.error('Error taking monitoring snapshot:', error);
    }
  }

  generateReport(): any {
    try {
      // Find all snapshots
      const files = fs.readdirSync(this.basePath)
        .filter(file => file.startsWith('snapshot_') && file.endsWith('.json'))
        .sort();
      
      if (files.length === 0) {
        return { error: 'No snapshots available' };
      }
      
      // Load the first and latest snapshots
      const firstSnapshot = JSON.parse(fs.readFileSync(path.join(this.basePath, files[0]), 'utf-8'));
      const latestSnapshot = JSON.parse(fs.readFileSync(path.join(this.basePath, files[files.length - 1]), 'utf-8'));
      
      // Generate report data
      const report = {
        simulationTime: {
          startTime: new Date(firstSnapshot.timestamp).toISOString(),
          currentTime: new Date(latestSnapshot.timestamp).toISOString(),
          elapsedDays: latestSnapshot.simulation.simulationDays,
          realElapsedHours: (latestSnapshot.timestamp - firstSnapshot.timestamp) / (60 * 60 * 1000)
        },
        marketSummary: {
          tokens: latestSnapshot.market.tokens.map((token: any) => ({
            symbol: token.symbol,
            currentPrice: token.price,
            priceChange: this.calculatePriceChange(firstSnapshot, latestSnapshot, token.symbol)
          })),
          tradingVolume: latestSnapshot.trading.recentTrades.reduce((sum: number, trade: any) => 
            sum + (trade.amount * trade.price), 0)
        },
        communicationSummary: {
          totalMessages: latestSnapshot.communication.recentMessages.length,
          trendingTopics: latestSnapshot.communication.trendingTopics
        }
      };
      
      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      return { error: 'Failed to generate report' };
    }
  }

  private calculatePriceChange(firstSnapshot: any, latestSnapshot: any, symbol: string): number {
    try {
      const firstToken = firstSnapshot.market.tokens.find((t: any) => t.symbol === symbol);
      const latestToken = latestSnapshot.market.tokens.find((t: any) => t.symbol === symbol);
      
      if (!firstToken || !latestToken) return 0;
      
      const firstPrice = firstToken.price;
      const latestPrice = latestToken.price;
      
      return ((latestPrice - firstPrice) / firstPrice) * 100;
    } catch (error) {
      return 0;
    }
  }
}
