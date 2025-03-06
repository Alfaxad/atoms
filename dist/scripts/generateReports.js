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
const reportGenerator_1 = require("../reporting/reportGenerator");
const atomManager_1 = require("../agents/atomManager");
const tokenManager_1 = require("../trading/tokenManager");
const marketSimulator_1 = require("../trading/marketSimulator");
const tradingSystem_1 = require("../trading/tradingSystem");
const communicationSystem_1 = require("../communication/communicationSystem");
const simulationManager_1 = require("../simulation/simulationManager");
const dataExporter_1 = require("../reporting/dataExporter");
const environment_1 = require("../utils/environment");
const simulationConfig_1 = require("../config/simulationConfig");
const readline = __importStar(require("readline"));
async function main() {
    try {
        // Validate environment variables
        (0, environment_1.validateEnvironment)();
        // Load configuration
        const config = (0, simulationConfig_1.loadConfig)();
        console.log('Initializing report generator...');
        // Create necessary components
        const atomManager = new atomManager_1.AtomManager();
        await atomManager.loadAtoms();
        const tokenManager = new tokenManager_1.TokenManager();
        await tokenManager.loadTokens();
        const marketSimulator = new marketSimulator_1.MarketSimulator(tokenManager);
        await marketSimulator.loadMarketState();
        const tradingSystem = new tradingSystem_1.TradingSystem(tokenManager, marketSimulator, atomManager);
        await tradingSystem.loadTrades();
        await tradingSystem.loadOrders();
        const communicationSystem = new communicationSystem_1.CommunicationSystem(atomManager);
        await communicationSystem.initialize();
        const simulationManager = new simulationManager_1.SimulationManager(config);
        await simulationManager.loadSimulationState();
        // Create report generator
        const reportGenerator = new reportGenerator_1.ReportGenerator(atomManager, tokenManager, tradingSystem, communicationSystem, simulationManager);
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
                        const dataExporter1 = new dataExporter_1.DataExporter(atomManager, tokenManager, tradingSystem, communicationSystem);
                        await dataExporter1.exportAtomsToCSV();
                        promptUser();
                        break;
                    case 7:
                        console.log('Exporting Trades to CSV...');
                        const dataExporter2 = new dataExporter_1.DataExporter(atomManager, tokenManager, tradingSystem, communicationSystem);
                        await dataExporter2.exportTradesToCSV();
                        promptUser();
                        break;
                    case 8:
                        console.log('Exporting Messages to CSV...');
                        const dataExporter3 = new dataExporter_1.DataExporter(atomManager, tokenManager, tradingSystem, communicationSystem);
                        await dataExporter3.exportMessagesToCSV();
                        promptUser();
                        break;
                    case 9:
                        console.log('Exporting All Data...');
                        const dataExporter4 = new dataExporter_1.DataExporter(atomManager, tokenManager, tradingSystem, communicationSystem);
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
    }
    catch (error) {
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
