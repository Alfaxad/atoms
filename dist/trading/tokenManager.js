"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenManager = void 0;
const solana_agent_kit_1 = require("solana-agent-kit");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const environment_1 = require("../utils/environment");
class TokenManager {
    constructor() {
        this.tokens = new Map();
        this.priceHistory = new Map();
        // Initialize the SolanaAgentKit instance (its constructor creates the connection)
        this.solanaAgent = new solana_agent_kit_1.SolanaAgentKit(environment_1.env.SOLANA_PRIVATE_KEY, environment_1.env.RPC_URL, environment_1.env.OPENAI_API_KEY);
        this.basePath = path.join(process.cwd(), 'data', 'tokens');
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }
    // Asynchronously initialize agent tools (if required by other functionality)
    async init() {
        await (0, solana_agent_kit_1.createSolanaTools)(this.solanaAgent);
        console.log("Agent tools initialized.");
    }
    // Public method to request faucet funds with a retry mechanism
    async requestFaucetFunds() {
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
                const balance = await this.solanaAgent.connection.getBalance(this.solanaAgent.wallet_address);
                console.log(`Wallet balance after airdrop attempt ${attempt + 1}: ${balance} lamports`);
                // Require at least 1 SOL (1e9 lamports)
                if (balance >= 1e9) {
                    funded = true;
                    break;
                }
            }
            catch (error) {
                console.error(`Airdrop attempt ${attempt + 1} failed:`, error);
            }
            attempt++;
        }
        if (!funded) {
            throw new Error("Failed to fund wallet with sufficient SOL from devnet faucet.");
        }
        console.log("Faucet funds acquired.");
    }
    async createToken(symbol, name, decimals = 9, initialSupply, creator) {
        console.log(`Creating token ${name} (${symbol})...`);
        try {
            // Call deployToken directly (it expects a single numeric parameter for decimals)
            const result = await this.solanaAgent.deployToken(decimals);
            const mintAddress = result.mint.toString();
            console.log(`Token deployed with mint address: ${mintAddress}`);
            // Create token object (store extra metadata locally for simulation)
            const token = {
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
            const initialPricePoint = {
                timestamp: Date.now(),
                price: token.currentPrice,
                volume: 0,
            };
            this.tokens.set(symbol, token);
            this.priceHistory.set(symbol, [initialPricePoint]);
            this.saveToken(token);
            this.savePriceHistory(symbol);
            return token;
        }
        catch (error) {
            console.error(`Error creating token ${symbol}:`, error);
            throw error;
        }
    }
    async loadTokens() {
        this.tokens.clear();
        this.priceHistory.clear();
        const tokenFiles = fs.readdirSync(this.basePath)
            .filter(file => file.endsWith('.json') && !file.includes('_history'));
        for (const file of tokenFiles) {
            const filePath = path.join(this.basePath, file);
            const tokenData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            this.tokens.set(tokenData.symbol, tokenData);
            const historyPath = path.join(this.basePath, `${tokenData.symbol}_history.json`);
            if (fs.existsSync(historyPath)) {
                const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
                this.priceHistory.set(tokenData.symbol, historyData);
            }
            else {
                this.priceHistory.set(tokenData.symbol, []);
            }
        }
        console.log(`Loaded ${this.tokens.size} tokens`);
    }
    getToken(symbol) {
        return this.tokens.get(symbol);
    }
    getAllTokens() {
        return Array.from(this.tokens.values());
    }
    getPriceHistory(symbol, limit = 100) {
        const history = this.priceHistory.get(symbol) || [];
        return history.slice(-limit);
    }
    updateTokenPrice(symbol, newPrice, volume = 0) {
        const token = this.tokens.get(symbol);
        if (!token)
            return;
        token.currentPrice = newPrice;
        token.totalVolume += volume;
        const pricePoint = {
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
    updateFraudScore(symbol, fraudScore) {
        const token = this.tokens.get(symbol);
        if (!token)
            return;
        token.fraudScore = Math.max(0, Math.min(1, fraudScore));
        this.saveToken(token);
    }
    saveToken(token) {
        const filePath = path.join(this.basePath, `${token.symbol}.json`);
        fs.writeFileSync(filePath, JSON.stringify(token, null, 2));
    }
    savePriceHistory(symbol) {
        const history = this.priceHistory.get(symbol);
        if (!history)
            return;
        const filePath = path.join(this.basePath, `${symbol}_history.json`);
        fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.TokenManager = TokenManager;
