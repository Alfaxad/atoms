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
const simulationManager_1 = require("../simulation/simulationManager");
const environment_1 = require("../utils/environment");
const simulationConfig_1 = require("../config/simulationConfig");
const readline = __importStar(require("readline"));
const tokenManager_1 = require("../trading/tokenManager");
const marketSimulator_1 = require("../trading/marketSimulator");
const tradingSystem_1 = require("../trading/tradingSystem");
const atomManager_1 = require("../agents/atomManager");
const communicationSystem_1 = require("../communication/communicationSystem");
const simulationMonitor_1 = require("../simulation/simulationMonitor");
async function main() {
    try {
        // Validate environment variables
        (0, environment_1.validateEnvironment)();
        // Load configuration
        const config = (0, simulationConfig_1.loadConfig)();
        console.log('Starting ATOMS simulation...');
        console.log(`Configuration: ${config.atomCount} atoms, ${config.simulationDays} days, ${config.timeAcceleration}x time acceleration`);
        // Create simulation manager
        const simulationManager = new simulationManager_1.SimulationManager(config);
        // Initialize simulation
        await simulationManager.initialize();
        // Create components for monitoring
        const tokenManager = new tokenManager_1.TokenManager();
        await tokenManager.loadTokens();
        const atomManager = new atomManager_1.AtomManager();
        await atomManager.loadAtoms();
        const marketSimulator = new marketSimulator_1.MarketSimulator(tokenManager);
        await marketSimulator.loadMarketState();
        const tradingSystem = new tradingSystem_1.TradingSystem(tokenManager, marketSimulator, atomManager);
        await tradingSystem.loadTrades();
        await tradingSystem.loadOrders();
        const communicationSystem = new communicationSystem_1.CommunicationSystem(atomManager);
        await communicationSystem.initialize();
        // Create simulation monitor
        const simulationMonitor = new simulationMonitor_1.SimulationMonitor(simulationManager, tokenManager, marketSimulator, tradingSystem, communicationSystem);
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
                    }
                    else {
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
    }
    catch (error) {
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
