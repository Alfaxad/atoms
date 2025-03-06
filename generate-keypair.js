const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58').default; // Access the default export

// Generate a new keypair
const keypair = Keypair.generate();

// Get the private key in Base58 format
const privateKeyBase58 = bs58.encode(Buffer.from(keypair.secretKey));

// Get the public key (wallet address)
const publicKey = keypair.publicKey.toString();

console.log('Public Key (Wallet Address):', publicKey);
console.log('Private Key (Base58):', privateKeyBase58);

