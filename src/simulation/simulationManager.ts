import { AtomManager } from '../agents/atomManager';
import { CommunicationSystem } from '../communication/communicationSystem';
import { TokenManager } from '../trading/tokenManager';
import { MarketSimulator } from '../trading/marketSimulator';
import { TradingSystem } from '../trading/tradingSystem';
import { SimulationConfig } from '../config/simulationConfig';
import * as fs from 'fs';
import * as path from 'path';

export class SimulationManager {
  private atomManager: AtomManager;
  private communicationSystem: CommunicationSystem;
  private tokenManager: TokenManager;
  private marketSimulator!: MarketSimulator;
  private tradingSystem!: TradingSystem;
  private config: SimulationConfig;
  private basePath: string;
  
  // Simulation state
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private simulationStartTime: number = 0;
  private simulationCurrentTime: number = 0;
  private realStartTime: number = 0;
  private lastUpdateTime: number = 0;
  private cycleCount: number = 0;
  private simTimeMultiplier: number;
  
  constructor(config: SimulationConfig) {
    this.config = config;
    this.simTimeMultiplier = config.timeAcceleration;
    
    this.atomManager = new AtomManager();
    this.tokenManager = new TokenManager();
    this.communicationSystem = new CommunicationSystem(this.atomManager);
    
    this.basePath = path.join(process.cwd(), 'data', 'simulation');
    
    // Ensure the simulation directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    console.log('Initializing simulation...');
    
    // Load atoms
    await this.atomManager.loadAtoms();
    
    // Load tokens
    await this.tokenManager.loadTokens();
    
    // Initialize market simulator
    this.marketSimulator = new MarketSimulator(this.tokenManager);
    await this.marketSimulator.loadMarketState();
    
    // Initialize trading system
    this.tradingSystem = new TradingSystem(
      this.tokenManager,
      this.marketSimulator,
      this.atomManager
    );
    await this.tradingSystem.loadTrades();
    await this.tradingSystem.loadOrders();
    
    // Initialize communication system
    await this.communicationSystem.initialize();
    
    // Register all atoms in communication system
    this.communicationSystem.registerAllAtoms();
    
    console.log('Simulation initialized successfully!');
  }

  start(): void {
    if (this.isRunning) {
      console.log('Simulation is already running');
      return;
    }
    
    console.log('Starting simulation...');
    
    this.isRunning = true;
    this.isPaused = false;
    this.simulationStartTime = Date.now();
    this.simulationCurrentTime = this.simulationStartTime;
    this.realStartTime = Date.now();
    this.lastUpdateTime = this.realStartTime;
    this.cycleCount = 0;
    
    // Start simulation loop
    this.runSimulationCycle();
    
    console.log('Simulation started');
  }

  pause(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }
    
    this.isPaused = true;
    console.log('Simulation paused');
  }

  resume(): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }
    
    this.isPaused = false;
    console.log('Simulation resumed');
    
    // Resume simulation loop
    this.runSimulationCycle();
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    this.isPaused = false;
    console.log('Simulation stopped');
    
    // Save final state
    this.saveSimulationState();
  }

  getStatus(): any {
    const realTimeElapsed = Date.now() - this.realStartTime;
    const simTimeElapsed = (Date.now() - this.simulationStartTime) * this.simTimeMultiplier;
    
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      cycleCount: this.cycleCount,
      realTimeElapsed: realTimeElapsed,
      simulationTimeElapsed: simTimeElapsed,
      simulationDays: simTimeElapsed / (24 * 60 * 60 * 1000),
      timeAcceleration: this.simTimeMultiplier
    };
  }

  setTimeAcceleration(multiplier: number): void {
    this.simTimeMultiplier = Math.max(1, Math.min(1000, multiplier));
    console.log(`Time acceleration set to ${this.simTimeMultiplier}x`);
  }

  private async runSimulationCycle(): Promise<void> {
    if (!this.isRunning || this.isPaused) {
      return;
    }
    
    try {
      this.cycleCount++;
      const now = Date.now();
      const realTimeDelta = now - this.lastUpdateTime;
      const simTimeDelta = realTimeDelta * this.simTimeMultiplier;
      
      this.simulationCurrentTime += simTimeDelta;
      this.lastUpdateTime = now;
      
      // Log cycle info every 10 cycles
      if (this.cycleCount % 10 === 0) {
        const status = this.getStatus();
        console.log(`Cycle ${this.cycleCount} - Sim day: ${status.simulationDays.toFixed(2)}`);
      }
      
      // 1. Update market simulation
      this.marketSimulator.simulateMarketMovement(simTimeDelta);
      
      // 2. Process trading orders
      await this.tradingSystem.processOrders();
      
      // 3. Generate atom activity
      await this.generateAtomActivity(simTimeDelta);
      
      // 4. Check for simulation end condition
      const simDays = (this.simulationCurrentTime - this.simulationStartTime) / (24 * 60 * 60 * 1000);
      if (simDays >= this.config.simulationDays) {
        console.log(`Simulation reached target duration of ${this.config.simulationDays} days`);
        this.stop();
        return;
      }
      
      // 5. Save state periodically
      if (this.cycleCount % 100 === 0) {
        this.saveSimulationState();
      }
      
      // 6. Schedule next cycle
      const cycleDelay = Math.max(100, 1000 - realTimeDelta); // Aim for ~1 second cycles
      setTimeout(() => this.runSimulationCycle(), cycleDelay);
    } catch (error) {
      console.error('Error in simulation cycle:', error);
      
      // Try to recover and continue
      setTimeout(() => this.runSimulationCycle(), 5000);
    }
  }

  private async generateAtomActivity(simTimeDelta: number): Promise<void> {
    // Scale activity with sim time - more activity as time passes faster
    const activityScale = Math.min(1, simTimeDelta / (5 * 60 * 1000)); // 5 minutes sim time = full activity
    
    // Get all atoms
    const atoms = this.atomManager.getAllAtoms();
    if (atoms.length === 0) return;
    
    // 1. Trading activity
    const tradingProbability = 0.05 * activityScale; // 5% chance per cycle scaled by time
    const tradingAtomCount = Math.floor(atoms.length * tradingProbability);
    
    if (tradingAtomCount > 0) {
      // Select random atoms for trading
      const tradingAtoms = atoms
        .sort(() => Math.random() - 0.5)
        .slice(0, tradingAtomCount);
      
      for (const atom of tradingAtoms) {
        try {
          // Determine trade parameters
          const tokenSymbols = ['ATOMS', 'ATOM1', 'ATOM2', 'ATOM3', 'USDC'];
          const tokenSymbol = tokenSymbols[Math.floor(Math.random() * tokenSymbols.length)];
          const tradeType = Math.random() < 0.5 ? 'buy' : 'sell';
          
          // Amount based on risk tolerance and experience
          const baseAmount = 10 + Math.floor(Math.random() * 90);
          const riskFactor = atom.riskTolerance * 2; // 0-2x multiplier
          const amount = Math.floor(baseAmount * riskFactor);
          
          // Execute trade
          const trade = await this.tradingSystem.executeTrade(
            atom.id,
            tokenSymbol,
            tradeType,
            amount
          );
          
          // Generate message about the trade
          await this.communicationSystem.generateTradeMessage(
            atom.id,
            tradeType,
            tokenSymbol,
            amount,
            this.marketSimulator.getTokenPrice(tokenSymbol)
          );
        } catch (error) {
          // Silently continue - not all trades will succeed
        }
      }
    }
    
    // 2. Communication activity
    const messageProbability = 0.1 * activityScale; // 10% chance per cycle scaled by time
    const messageAtomCount = Math.floor(atoms.length * messageProbability);
    
    if (messageAtomCount > 0) {
      // Select random atoms for messaging
      const messageAtoms = atoms
        .sort(() => Math.random() - 0.5)
        .slice(0, messageAtomCount);
      
      for (const atom of messageAtoms) {
        try {
          // Pick a random token to comment on
          const tokenSymbols = ['ATOMS', 'ATOM1', 'ATOM2', 'ATOM3', 'USDC'];
          const tokenSymbol = tokenSymbols[Math.floor(Math.random() * tokenSymbols.length)];
          
          // Get token price change (random for now)
          const priceChange = (Math.random() * 30) - 15; // -15% to +15%
          
          // Generate message
          await this.communicationSystem.generateMarketCommentMessage(
            atom.id,
            tokenSymbol,
            priceChange
          );
        } catch (error) {
          // Silently continue
        }
      }
    }
    
    // 3. Fraudulent activity
    const fraudulentAtoms = this.atomManager.getFraudulentAtoms();
    if (fraudulentAtoms.length > 0) {
      // Determine fraud campaign phase based on simulation progress
      const simProgress = (this.simulationCurrentTime - this.simulationStartTime) / 
                          (this.config.simulationDays * 24 * 60 * 60 * 1000);
      
      let fraudPhase: 'initial' | 'buildup' | 'peak' | 'exit';
      
      if (simProgress < 0.25) {
        fraudPhase = 'initial';
      } else if (simProgress < 0.6) {
        fraudPhase = 'buildup';
      } else if (simProgress < 0.8) {
        fraudPhase = 'peak';
      } else {
        fraudPhase = 'exit';
      }
      
      // 10% chance for a fraud message in a cycle, scaled by time
      const fraudProbability = 0.1 * activityScale;
      
      if (Math.random() < fraudProbability) {
        // Select a target token for the fraud campaign
        const targetToken = 'ATOM1'; // For simplicity, use ATOM1 as the target
        
        // Generate fraud messages
        await this.communicationSystem.generateFraudCampaignMessages(
          targetToken,
          fraudPhase
        );
        
        // Manipulate market if in peak or exit phase
        if (fraudPhase === 'peak') {
          this.marketSimulator.simulateTokenPump(targetToken, 2.0);
        } else if (fraudPhase === 'exit') {
          this.marketSimulator.simulateTokenDump(targetToken, 3.0);
        }
      }
    }
  }

  private saveSimulationState(): void {
    const state = {
      timestamp: Date.now(),
      cycleCount: this.cycleCount,
      simulationStartTime: this.simulationStartTime,
      simulationCurrentTime: this.simulationCurrentTime,
      realStartTime: this.realStartTime,
      lastUpdateTime: this.lastUpdateTime,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      simTimeMultiplier: this.simTimeMultiplier,
      status: this.getStatus()
    };
    
    const filePath = path.join(this.basePath, 'simulation_state.json');
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
  }

  async loadSimulationState(): Promise<boolean> {
    const filePath = path.join(this.basePath, 'simulation_state.json');
    
    if (fs.existsSync(filePath)) {
      try {
        const stateData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        this.cycleCount = stateData.cycleCount;
        this.simulationStartTime = stateData.simulationStartTime;
        this.simulationCurrentTime = stateData.simulationCurrentTime;
        this.realStartTime = stateData.realStartTime;
        this.lastUpdateTime = Date.now(); // Reset last update time
        this.simTimeMultiplier = stateData.simTimeMultiplier;
        
        // Don't automatically resume
        this.isRunning = false;
        this.isPaused = false;
        
        console.log('Loaded simulation state from disk');
        return true;
      } catch (error) {
        console.error('Error loading simulation state:', error);
        return false;
      }
    }
    
    return false;
  }
}
