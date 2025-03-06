// src/scripts/getWalletAddress.js
require('dotenv').config(); // Loads .env file and sets process.env

const { SolanaAgentKit } = require('solana-agent-kit');

const agent = new SolanaAgentKit(
  process.env.SOLANA_PRIVATE_KEY,
  process.env.RPC_URL,
  process.env.OPENAI_API_KEY
);

console.log('Wallet Address:', agent.wallet_address.toString());

