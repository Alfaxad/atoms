import { ReportGenerator } from '../reporting/reportGenerator';
import { AtomManager } from '../agents/atomManager';
import { TokenManager } from '../trading/tokenManager';
import { MarketSimulator } from '../trading/marketSimulator';
import { TradingSystem } from '../trading/tradingSystem';
import { CommunicationSystem } from '../communication/communicationSystem';
import { SimulationManager } from '../simulation/simulationManager';
import { DataExporter } from '../reporting/dataExporter';
import { validateEnvironment } from '../utils/environment';
import { loadConfig } from '../config/simulationConfig';
import * as readline from 'readline';

async function main() {
  try {
    // Validate environment variables
    validateEnvironment();
    
    // Load configuration
    const config = loadConfig();
    
    console.log('Initializing report generator...');
    
    // Create necessary components
    const atomManager = new AtomManager();
    await atomManager.loadAtoms();
    
    const tokenManager = new TokenManager();
    await tokenManager.loadTokens();
    
    const marketSimulator = new MarketSimulator(tokenManager);
    await marketSimulator.loadMarketState();
    
    const tradingSystem = new TradingSystem(
      tokenManager,
      marketSimulator,
      atomManager
    );
    await tradingSystem.loadTrades();
    await tradingSystem.loadOrders();
    
    const communicationSystem = new CommunicationSystem(atomManager);
    await communicationSystem.initialize();
    
    const simulationManager = new SimulationManager(config);
    await simulationManager.loadSimulationState();
    
    // Create report generator
    const reportGenerator = new ReportGenerator(
      atomManager,
      tokenManager,
      tradingSystem,
      communicationSystem,
      simulationManager
    );
    
    // Set up command line interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Display menu
    console.log('\nAvailable Reports:');
    console.log('1. Simulation Summary');
    console.log('2. Fraud Analysis');
    console.log('3. Trader Performance');
    console.log('4. Communication Analysis');
    console.log('5. Generate All Reports');
    console.log('6. Export Atoms to CSV');
    console.log('7. Export Trades to CSV');
    console.log('8. Export Messages to CSV');
    console.log('9. Export All Data');
    console.log('0. Exit');
    
    const promptUser = () => {
      rl.question('\nSelect a report to generate (0-9): ', async (answer) => {
        const choice = parseInt(answer);
        
        switch (choice) {
          case 1:
            console.log('Generating Simulation Summary Report...');
            await reportGenerator.generateSimulationSummary();
            promptUser();
            break;
            
          case 2:
            console.log('Generating Fraud Analysis Report...');
            await reportGenerator.generateFraudReport();
            promptUser();
            break;
            
          case 3:
            console.log('Generating Trader Performance Report...');
            await reportGenerator.generateTraderPerformanceReport();
            promptUser();
            break;
            
          case 4:
            console.log('Generating Communication Analysis Report...');
            await reportGenerator.generateCommunicationAnalysisReport();
            promptUser();
            break;
            
          case 5:
            console.log('Generating All Reports...');
            await reportGenerator.generateSimulationSummary();
            await reportGenerator.generateFraudReport();
            await reportGenerator.generateTraderPerformanceReport();
            await reportGenerator.generateCommunicationAnalysisReport();
            console.log('All reports generated successfully!');
            promptUser();
            break;
          
          case 6:
            console.log('Exporting Atoms to CSV...');
            const dataExporter1 = new DataExporter(
              atomManager,
              tokenManager,
              tradingSystem,
              communicationSystem
            );
            await dataExporter1.exportAtomsToCSV();
            promptUser();
            break;
            
          case 7:
            console.log('Exporting Trades to CSV...');
            const dataExporter2 = new DataExporter(
              atomManager,
              tokenManager,
              tradingSystem,
              communicationSystem
            );
            await dataExporter2.exportTradesToCSV();
            promptUser();
            break;
            
          case 8:
            console.log('Exporting Messages to CSV...');
            const dataExporter3 = new DataExporter(
              atomManager,
              tokenManager,
              tradingSystem,
              communicationSystem
            );
            await dataExporter3.exportMessagesToCSV();
            promptUser();
            break;
            
          case 9:
            console.log('Exporting All Data...');
            const dataExporter4 = new DataExporter(
              atomManager,
              tokenManager,
              tradingSystem,
              communicationSystem
            );
            await dataExporter4.exportAllData();
            promptUser();
            break;
            
          case 0:
            console.log('Exiting report generator.');
            rl.close();
            break;
            
          default:
            console.log('Invalid option. Please select a number between 0 and 9.');
            promptUser();
            break;
        }
      });
    };
    
    promptUser();
    
  } catch (error) {
    console.error('Error generating reports:', error);
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
