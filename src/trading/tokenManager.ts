import { SolanaAgentKit, createSolanaTools } from 'solana-agent-kit';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Token, PricePoint } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { env } from '../utils/environment';

export class TokenManager {
  private solanaAgent: SolanaAgentKit;
  private tokens: Map<string, Token> = new Map();
  private priceHistory: Map<string, PricePoint[]> = new Map();
  private basePath: string;

  constructor() {
    // Initialize the SolanaAgentKit instance (its constructor creates the connection)
    this.solanaAgent = new SolanaAgentKit(
      env.SOLANA_PRIVATE_KEY,
      env.RPC_URL,
      env.OPENAI_API_KEY
    );

    this.basePath = path.join(process.cwd(), 'data', 'tokens');
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  // Asynchronously initialize agent tools (if required by other functionality)
  async init(): Promise<void> {
    await createSolanaTools(this.solanaAgent);
    console.log("Agent tools initialized.");
  }

  // Public method to request faucet funds with a retry mechanism
  public async requestFaucetFunds(): Promise<void> {
    const maxAttempts = 5;
    const delayMs = 3000; // 3 seconds delay between attempts
    let attempt = 0;
    let funded = false;
    console.log("Requesting faucet funds on devnet...");

    while (attempt < maxAttempts && !funded) {
      try {
        await this.solanaAgent.requestFaucetFunds();
        // Wait a moment for funds to be reflected on-chain
        await this.sleep(delayMs);
        // Check wallet balance
        const balance = await this.solanaAgent.connection.getBalance(
          this.solanaAgent.wallet_address
        );
        console.log(`Wallet balance after airdrop attempt ${attempt + 1}: ${balance} lamports`);
        // Require at least 1 SOL (1e9 lamports)
        if (balance >= 1e9) {
          funded = true;
          break;
        }
      } catch (error) {
        console.error(`Airdrop attempt ${attempt + 1} failed:`, error);
      }
      attempt++;
    }

    if (!funded) {
      throw new Error("Failed to fund wallet with sufficient SOL from devnet faucet.");
    }
    console.log("Faucet funds acquired.");
  }

  async createToken(
    symbol: string,
    name: string,
    decimals: number = 9,
    initialSupply: number,
    creator: string
  ): Promise<Token> {
    console.log(`Creating token ${name} (${symbol})...`);

    try {
      // Call deployToken directly (it expects a single numeric parameter for decimals)
      const result = await this.solanaAgent.deployToken(decimals);
      const mintAddress = result.mint.toString();
      console.log(`Token deployed with mint address: ${mintAddress}`);

      // Create token object (store extra metadata locally for simulation)
      const token: Token = {
        symbol,
        name,
        mintAddress,
        decimals,
        initialSupply,
        currentPrice: 1.0,
        totalVolume: 0,
        creator,
        createdAt: Date.now(),
        fraudScore: 0,
      };

      const initialPricePoint: PricePoint = {
        timestamp: Date.now(),
        price: token.currentPrice,
        volume: 0,
      };

      this.tokens.set(symbol, token);
      this.priceHistory.set(symbol, [initialPricePoint]);
      this.saveToken(token);
      this.savePriceHistory(symbol);

      return token;
    } catch (error) {
      console.error(`Error creating token ${symbol}:`, error);
      throw error;
    }
  }

  async loadTokens(): Promise<void> {
    this.tokens.clear();
    this.priceHistory.clear();

    const tokenFiles = fs.readdirSync(this.basePath)
      .filter(file => file.endsWith('.json') && !file.includes('_history'));

    for (const file of tokenFiles) {
      const filePath = path.join(this.basePath, file);
      const tokenData = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Token;
      this.tokens.set(tokenData.symbol, tokenData);

      const historyPath = path.join(this.basePath, `${tokenData.symbol}_history.json`);
      if (fs.existsSync(historyPath)) {
        const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf-8')) as PricePoint[];
        this.priceHistory.set(tokenData.symbol, historyData);
      } else {
        this.priceHistory.set(tokenData.symbol, []);
      }
    }

    console.log(`Loaded ${this.tokens.size} tokens`);
  }

  getToken(symbol: string): Token | undefined {
    return this.tokens.get(symbol);
  }

  getAllTokens(): Token[] {
    return Array.from(this.tokens.values());
  }

  getPriceHistory(symbol: string, limit: number = 100): PricePoint[] {
    const history = this.priceHistory.get(symbol) || [];
    return history.slice(-limit);
  }

  updateTokenPrice(symbol: string, newPrice: number, volume: number = 0): void {
    const token = this.tokens.get(symbol);
    if (!token) return;
    token.currentPrice = newPrice;
    token.totalVolume += volume;
    const pricePoint: PricePoint = {
      timestamp: Date.now(),
      price: newPrice,
      volume,
    };
    const history = this.priceHistory.get(symbol) || [];
    history.push(pricePoint);
    this.priceHistory.set(symbol, history);
    this.saveToken(token);
    this.savePriceHistory(symbol);
  }

  updateFraudScore(symbol: string, fraudScore: number): void {
    const token = this.tokens.get(symbol);
    if (!token) return;
    token.fraudScore = Math.max(0, Math.min(1, fraudScore));
    this.saveToken(token);
  }

  private saveToken(token: Token): void {
    const filePath = path.join(this.basePath, `${token.symbol}.json`);
    fs.writeFileSync(filePath, JSON.stringify(token, null, 2));
  }

  private savePriceHistory(symbol: string): void {
    const history = this.priceHistory.get(symbol);
    if (!history) return;
    const filePath = path.join(this.basePath, `${symbol}_history.json`);
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

