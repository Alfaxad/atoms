import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('No .env file found. Using environment variables.');
  dotenv.config();
}

// Validate required environment variables
export function validateEnvironment(): void {
  const requiredVars = [
    'RPC_URL',
    'SOLANA_PRIVATE_KEY',
    'OPENAI_API_KEY',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Export environment variables
export const env = {
  RPC_URL: process.env.RPC_URL!,
  SOLANA_PRIVATE_KEY: process.env.SOLANA_PRIVATE_KEY!,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  HELIUS_API_KEY: process.env.HELIUS_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  // Optional variables with default values
  DATABASE_URL: process.env.DATABASE_URL,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
};
