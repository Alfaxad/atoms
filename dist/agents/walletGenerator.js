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
exports.WalletGenerator = void 0;
const solana_agent_kit_1 = require("solana-agent-kit");
const web3_js_1 = require("@solana/web3.js");
const bip39 = __importStar(require("bip39"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const environment_1 = require("../utils/environment");
class WalletGenerator {
    constructor() {
        this.solanaAgent = new solana_agent_kit_1.SolanaAgentKit(environment_1.env.SOLANA_PRIVATE_KEY, environment_1.env.RPC_URL, environment_1.env.OPENAI_API_KEY);
        this.basePath = path.join(process.cwd(), 'data', 'wallets');
        // Ensure the wallets directory exists
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }
    async generateWallet(atomId) {
        // Generate a new keypair
        const mnemonic = bip39.generateMnemonic(256);
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const keypair = web3_js_1.Keypair.fromSeed(seed.slice(0, 32));
        // Get wallet address
        const address = keypair.publicKey.toString();
        // Get private key
        const privateKey = Buffer.from(keypair.secretKey).toString('hex');
        // Save wallet data to file
        this.saveWalletData(atomId, address, privateKey, mnemonic);
        return {
            address,
            privateKey
        };
    }
    saveWalletData(atomId, address, privateKey, mnemonic) {
        const walletData = {
            atomId,
            address,
            privateKey,
            mnemonic,
            createdAt: new Date().toISOString()
        };
        const filePath = path.join(this.basePath, `${atomId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(walletData, null, 2));
    }
    async fundWallet(address, amount) {
        // In a real implementation, this would fund the wallet from a treasury
        // For now, we'll just log it
        console.log(`Funding wallet ${address} with ${amount} SOL`);
        return "transaction_hash_placeholder";
    }
    async generateBatch(count, atomIds) {
        const wallets = [];
        for (let i = 0; i < count; i++) {
            const wallet = await this.generateWallet(atomIds[i]);
            wallets.push(wallet);
        }
        return wallets;
    }
}
exports.WalletGenerator = WalletGenerator;
