import { TokenManager } from '../trading/tokenManager';
import { MarketSimulator } from '../trading/marketSimulator';
import { TradingSystem } from '../trading/tradingSystem';
import { AtomManager } from '../agents/atomManager';
import { validateEnvironment } from '../utils/environment';
import { loadConfig } from '../config/simulationConfig';
import { env } from '../utils/environment';

async function main() {
  try {
    // Validate environment variables
    validateEnvironment();
    
    // Load configuration
    const config = loadConfig();
    
    console.log('Initializing trading environment...');
    
    // Create and initialize the TokenManager
    const tokenManager = new TokenManager();
    await tokenManager.init();

    // Request faucet funds to ensure the wallet has sufficient SOL
    await tokenManager.requestFaucetFunds();
    
    // Create atom manager and load atoms
    const atomManager = new AtomManager();
    await atomManager.loadAtoms();
    
    // Load existing tokens
    await tokenManager.loadTokens();
    
    // Check if ATOMS token exists
    let atomsToken = tokenManager.getToken('ATOMS');
    
    if (!atomsToken) {
      console.log('Creating ATOMS token...');
      atomsToken = await tokenManager.createToken(
        'ATOMS',
        'ATOMS Simulation Token',
        9, // 9 decimals (standard for Solana)
        1000000, // 1 million initial supply
        env.SOLANA_PRIVATE_KEY // creator (main wallet)
      );
      console.log('ATOMS token created with mint address:', atomsToken.mintAddress);
    } else {
      console.log('ATOMS token already exists with mint address:', atomsToken.mintAddress);
    }
    
    // Create USDC token if it doesn't exist (for trading)
    let usdcToken = tokenManager.getToken('USDC');
    
    if (!usdcToken) {
      console.log('Creating USDC token for trading...');
      usdcToken = await tokenManager.createToken(
        'USDC',
        'USD Coin (Simulated)',
        6, // 6 decimals (standard for USDC)
        10000000, // 10 million initial supply
        env.SOLANA_PRIVATE_KEY // creator (main wallet)
      );
      console.log('USDC token created with mint address:', usdcToken.mintAddress);
    } else {
      console.log('USDC token already exists with mint address:', usdcToken.mintAddress);
    }
    
    // Create some additional tokens for trading diversity
    const additionalTokens = [
      { symbol: 'ATOM1', name: 'ATOM Community Token 1' },
      { symbol: 'ATOM2', name: 'ATOM Governance Token' },
      { symbol: 'ATOM3', name: 'ATOM Reward Token' },
    ];
    
    for (const tokenInfo of additionalTokens) {
      let token = tokenManager.getToken(tokenInfo.symbol);
      
      if (!token) {
        console.log(`Creating ${tokenInfo.symbol} token...`);
        token = await tokenManager.createToken(
          tokenInfo.symbol,
          tokenInfo.name,
          9, // 9 decimals
          500000, // 500k initial supply
          env.SOLANA_PRIVATE_KEY // creator
        );
        console.log(`${tokenInfo.symbol} token created with mint address:`, token.mintAddress);
      } else {
        console.log(`${tokenInfo.symbol} token already exists with mint address:`, token.mintAddress);
      }
    }
    
    // Create market simulator
    const marketSimulator = new MarketSimulator(tokenManager);
    
    // Load or initialize market state
    await marketSimulator.loadMarketState();
    
    // Create trading system
    const tradingSystem = new TradingSystem(tokenManager, marketSimulator, atomManager);
    
    // Load existing trades and orders
    await tradingSystem.loadTrades();
    await tradingSystem.loadOrders();
    
    // Simulate initial market movement
    console.log('Simulating initial market movement...');
    marketSimulator.simulateMarketMovement(24 * 60 * 60 * 1000); // Simulate 24 hours of movement
    
    // Get current market state
    const marketState = marketSimulator.getMarketState();
    
    // Display current prices and 24-hour change
    console.log('\nCurrent Token Prices:');
    console.log('Token\tPrice($)\t24h Change\tVolume');
    console.log('-----\t--------\t----------\t------');

    for (const symbol of Object.keys(marketState.tokens)) {
      const price = marketSimulator.getTokenPrice(symbol);
      const priceHistory = tokenManager.getPriceHistory(symbol);
      
      // Calculate 24h change if possible
      let change = 'N/A';
      if (priceHistory.length > 1) {
        const earliest = priceHistory[0].price;
        const changePercent = ((price - earliest) / earliest) * 100;
        change = `${changePercent.toFixed(2)}%`;
        // Add arrow for visualization
        change += changePercent > 0 ? ' ↑' : (changePercent < 0 ? ' ↓' : '');
      }
      
      // Get volume
      const token = tokenManager.getToken(symbol);
      const volume = token ? token.totalVolume.toFixed(2) : 'N/A';
      
      console.log(`${symbol}\t$${price.toFixed(4)}\t${change}\t$${volume}`);
    }
    
    // Simulate a few trades
    console.log('\nSimulating initial trades...');
    const atoms = atomManager.getAllAtoms();
    
    if (atoms.length > 0) {
      // Take a few random atoms for test trades
      const randomAtoms = atoms
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(5, atoms.length));
      
      for (const atom of randomAtoms) {
        try {
          // Random token selection (either ATOMS or one of the ATOM# tokens)
          const tokenSymbols = ['ATOMS', 'ATOM1', 'ATOM2', 'ATOM3'];
          const randomTokenIndex = Math.floor(Math.random() * tokenSymbols.length);
          const tokenSymbol = tokenSymbols[randomTokenIndex];
          
          // Random trade type
          const tradeType = Math.random() < 0.5 ? 'buy' : 'sell';
          
          // Random amount between 10 and 100
          const amount = 10 + Math.floor(Math.random() * 90);
          
          const trade = await tradingSystem.executeTrade(
            atom.id,
            tokenSymbol,
            tradeType,
            amount
          );
          
          console.log(`Trade executed: ${tradeType} ${amount} ${tokenSymbol} by ${atom.persona.name} (${atom.persona.profession})`);
        } catch (error) {
          console.error('Error simulating trade:', error);
        }
      }
    }
    
    console.log('\nTrading environment initialized successfully!');
    
  } catch (error) {
    console.error('Error initializing trading environment:', error);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
