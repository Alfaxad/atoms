import { SolanaAgentKit } from 'solana-agent-kit';
import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import * as fs from 'fs';
import * as path from 'path';
import { env } from '../utils/environment';

export class WalletGenerator {
  private solanaAgent: SolanaAgentKit;
  private basePath: string;

  constructor() {
    this.solanaAgent = new SolanaAgentKit(
    	env.SOLANA_PRIVATE_KEY,
  	env.RPC_URL,
  	env.OPENAI_API_KEY
    );

    this.basePath = path.join(process.cwd(), 'data', 'wallets');
    
    // Ensure the wallets directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async generateWallet(atomId: string): Promise<{ address: string, privateKey: string }> {
    // Generate a new keypair
    const mnemonic = bip39.generateMnemonic(256);
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));
    
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

  private saveWalletData(
    atomId: string, 
    address: string, 
    privateKey: string, 
    mnemonic: string
  ): void {
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

  async fundWallet(address: string, amount: number): Promise<string> {
    // In a real implementation, this would fund the wallet from a treasury
    // For now, we'll just log it
    console.log(`Funding wallet ${address} with ${amount} SOL`);
    return "transaction_hash_placeholder";
  }

  async generateBatch(count: number, atomIds: string[]): Promise<{ address: string, privateKey: string }[]> {
    const wallets = [];
    
    for (let i = 0; i < count; i++) {
      const wallet = await this.generateWallet(atomIds[i]);
      wallets.push(wallet);
    }
    
    return wallets;
  }
}
