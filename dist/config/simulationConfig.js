"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.loadConfig = loadConfig;
const constants_1 = require("./constants");
// Default configuration
exports.defaultConfig = {
    atomCount: constants_1.SIMULATION_SETTINGS.INITIAL_ATOMS,
    fraudPercentage: constants_1.SIMULATION_SETTINGS.FRAUD_PERCENTAGE,
    tokenCount: constants_1.SIMULATION_SETTINGS.TOKEN_COUNT,
    simulationDays: constants_1.SIMULATION_SETTINGS.SIMULATION_DAYS,
    timeAcceleration: constants_1.SIMULATION_SETTINGS.TIME_ACCELERATION,
    rpcUrl: process.env.RPC_URL || 'https://api.devnet.solana.com',
};
// Function to load configuration from environment or use defaults
function loadConfig() {
    return {
        ...exports.defaultConfig,
        atomCount: parseInt(process.env.ATOM_COUNT || String(exports.defaultConfig.atomCount)),
        fraudPercentage: parseFloat(process.env.FRAUD_PERCENTAGE || String(exports.defaultConfig.fraudPercentage)),
        tokenCount: parseInt(process.env.TOKEN_COUNT || String(exports.defaultConfig.tokenCount)),
        simulationDays: parseInt(process.env.SIMULATION_DAYS || String(exports.defaultConfig.simulationDays)),
        timeAcceleration: parseInt(process.env.TIME_ACCELERATION || String(exports.defaultConfig.timeAcceleration)),
        rpcUrl: process.env.RPC_URL || exports.defaultConfig.rpcUrl,
    };
}
