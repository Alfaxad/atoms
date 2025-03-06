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
const atomGenerator_1 = require("../agents/atomGenerator");
const environment_1 = require("../utils/environment");
const simulationConfig_1 = require("../config/simulationConfig");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function main() {
    try {
        // Validate environment variables
        (0, environment_1.validateEnvironment)();
        // Load configuration
        const config = (0, simulationConfig_1.loadConfig)();
        console.log(`Starting atom generation (${config.atomCount} atoms, ${config.fraudPercentage * 100}% fraudulent)...`);
        // Create atom generator
        const atomGenerator = new atomGenerator_1.AtomGenerator();
        // Generate atoms
        const atoms = await atomGenerator.generateBatch(config.atomCount, config.fraudPercentage);
        // Save summary to file
        const summary = {
            totalAtoms: atoms.length,
            fraudulentAtoms: atoms.filter(a => a.fraudulent).length,
            legitimateAtoms: atoms.filter(a => !a.fraudulent).length,
            professionBreakdown: atoms.reduce((acc, atom) => {
                const profession = atom.persona.profession;
                acc[profession] = (acc[profession] || 0) + 1;
                return acc;
            }, {}),
            tradingStrategyBreakdown: atoms.reduce((acc, atom) => {
                const strategy = atom.tradingStrategy;
                acc[strategy] = (acc[strategy] || 0) + 1;
                return acc;
            }, {}),
            decisionModelBreakdown: atoms.reduce((acc, atom) => {
                const model = atom.decisionModel;
                acc[model] = (acc[model] || 0) + 1;
                return acc;
            }, {}),
            totalInitialBalance: atoms.reduce((sum, atom) => sum + atom.initialBalance, 0),
            averageInitialBalance: atoms.reduce((sum, atom) => sum + atom.initialBalance, 0) / atoms.length,
            generatedAt: new Date().toISOString()
        };
        const summaryPath = path.join(process.cwd(), 'data', 'atom_summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        console.log(`Atom generation complete! Summary saved to ${summaryPath}`);
        console.log(`Generated ${atoms.length} atoms (${summary.fraudulentAtoms} fraudulent, ${summary.legitimateAtoms} legitimate)`);
        console.log(`Total initial balance: ${summary.totalInitialBalance.toFixed(2)} SOL`);
        console.log(`Average initial balance: ${summary.averageInitialBalance.toFixed(2)} SOL`);
    }
    catch (error) {
        console.error('Error generating atoms:', error);
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
