"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.validateEnvironment = validateEnvironment;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Load environment variables from .env file
const envPath = path_1.default.resolve(process.cwd(), '.env');
if (fs_1.default.existsSync(envPath)) {
    dotenv_1.default.config({ path: envPath });
}
else {
    console.warn('No .env file found. Using environment variables.');
    dotenv_1.default.config();
}
// Validate required environment variables
function validateEnvironment() {
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
exports.env = {
    RPC_URL: process.env.RPC_URL,
    SOLANA_PRIVATE_KEY: process.env.SOLANA_PRIVATE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    NODE_ENV: process.env.NODE_ENV || 'development',
    // Optional variables with default values
    DATABASE_URL: process.env.DATABASE_URL,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
};
