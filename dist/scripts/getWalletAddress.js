"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// getWalletAddress.ts
const solana_agent_kit_1 = require("solana-agent-kit");
const environment_1 = require("./utils/environment");
const agent = new solana_agent_kit_1.SolanaAgentKit(environment_1.env.SOLANA_PRIVATE_KEY, environment_1.env.RPC_URL, environment_1.env.OPENAI_API_KEY);
console.log('Wallet Address:', agent.wallet_address.toString());
