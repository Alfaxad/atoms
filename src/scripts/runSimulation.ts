import { SimulationManager } from '../simulation/simulationManager';
import { validateEnvironment } from '../utils/environment';
import { loadConfig } from '../config/simulationConfig';
import * as readline from 'readline';
import { TokenManager } from '../trading/tokenManager';
import { MarketSimulator } from '../trading/marketSimulator';
import { TradingSystem } from '../trading/tradingSystem';
import { AtomManager } from '../agents/atomManager';
import { CommunicationSystem } from '../communication/communicationSystem';
import { SimulationMonitor } from '../simulation/simulationMonitor';

async function main() {
  try {
    // Validate environment variables
    validateEnvironment();
    
    // Load configuration
    const config = loadConfig();
    
    console.log('Starting ATOMS simulation...');
    console.log(`Configuration: ${config.atomCount} atoms, ${config.simulationDays} days, ${config.timeAcceleration}x time acceleration`);
    
    // Create simulation manager
    const simulationManager = new SimulationManager(config);
    
    // Initialize simulation
    await simulationManager.initialize();
    
    // Create components for monitoring
    const tokenManager = new TokenManager();
    await tokenManager.loadTokens();

    const atomManager = new AtomManager();
    await atomManager.loadAtoms();

    const marketSimulator = new MarketSimulator(tokenManager);
    await marketSimulator.loadMarketState();

    const tradingSystem = new TradingSystem(tokenManager, marketSimulator, atomManager);
    await tradingSystem.loadTrades();
    await tradingSystem.loadOrders();

    const communicationSystem = new CommunicationSystem(atomManager);
    await communicationSystem.initialize();

    // Create simulation monitor
    const simulationMonitor = new SimulationMonitor(
      simulationManager,
      tokenManager,
      marketSimulator,
      tradingSystem,
      communicationSystem
    );

    // Start monitoring
    simulationMonitor.startMonitoring(30000); // Take snapshots every 30 seconds
    
    // Set up readline interface for command input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Display help
    console.log('\nCommands:');
    console.log('  start - Start the simulation');
    console.log('  pause - Pause the simulation');
    console.log('  resume - Resume the simulation');
    console.log('  stop - Stop the simulation');
    console.log('  status - Display simulation status');
    console.log('  report - Generate simulation report');
    console.log('  speed <multiplier> - Set time acceleration multiplier');
    console.log('  exit - Exit the program');
    console.log('  help - Display this help message');
    
    // Start command loop
    rl.setPrompt('atoms> ');
    rl.prompt();
    
    rl.on('line', async (input) => {
      const args = input.trim().split(' ');
      const command = args[0].toLowerCase();
      
      switch (command) {
        case 'start':
          simulationManager.start();
          break;
        
        case 'pause':
          simulationManager.pause();
          break;
        
        case 'resume':
          simulationManager.resume();
          break;
        
        case 'stop':
          simulationManager.stop();
          break;
        
        case 'status':
          const status = simulationManager.getStatus();
          console.log('Simulation status:', status);
          console.log(`Elapsed simulation time: ${(status.simulationDays).toFixed(2)} days`);
          break;
        
        case 'report':
          const report = simulationMonitor.generateReport();
          console.log('Simulation Report:');
          console.log(JSON.stringify(report, null, 2));
          break;
        
        case 'speed':
          const multiplier = parseFloat(args[1]);
          if (!isNaN(multiplier) && multiplier > 0) {
            simulationManager.setTimeAcceleration(multiplier);
          } else {
            console.log('Invalid speed multiplier');
          }
          break;
        
        case 'exit':
          simulationManager.stop();
          simulationMonitor.stopMonitoring();
          console.log('Exiting simulation...');
          rl.close();
          process.exit(0);
          break;
        
        case 'help':
          console.log('\nCommands:');
          console.log('  start - Start the simulation');
          console.log('  pause - Pause the simulation');
          console.log('  resume - Resume the simulation');
          console.log('  stop - Stop the simulation');
          console.log('  status - Display simulation status');
          console.log('  report - Generate simulation report');
          console.log('  speed <multiplier> - Set time acceleration multiplier');
          console.log('  exit - Exit the program');
          console.log('  help - Display this help message');
          break;
        
        default:
          console.log('Unknown command. Type "help" for available commands.');
          break;
      }
      
      rl.prompt();
    });
    
    rl.on('close', () => {
      console.log('Simulation terminated');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error running simulation:', error);
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
