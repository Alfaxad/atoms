import { SIMULATION_SETTINGS } from './constants';

export interface SimulationConfig {
  atomCount: number;
  fraudPercentage: number;
  tokenCount: number;
  simulationDays: number;
  timeAcceleration: number;
  rpcUrl: string;
}

// Default configuration
export const defaultConfig: SimulationConfig = {
  atomCount: SIMULATION_SETTINGS.INITIAL_ATOMS,
  fraudPercentage: SIMULATION_SETTINGS.FRAUD_PERCENTAGE,
  tokenCount: SIMULATION_SETTINGS.TOKEN_COUNT,
  simulationDays: SIMULATION_SETTINGS.SIMULATION_DAYS,
  timeAcceleration: SIMULATION_SETTINGS.TIME_ACCELERATION,
  rpcUrl: process.env.RPC_URL || 'https://api.devnet.solana.com',
};

// Function to load configuration from environment or use defaults
export function loadConfig(): SimulationConfig {
  return {
    ...defaultConfig,
    atomCount: parseInt(process.env.ATOM_COUNT || String(defaultConfig.atomCount)),
    fraudPercentage: parseFloat(process.env.FRAUD_PERCENTAGE || String(defaultConfig.fraudPercentage)),
    tokenCount: parseInt(process.env.TOKEN_COUNT || String(defaultConfig.tokenCount)),
    simulationDays: parseInt(process.env.SIMULATION_DAYS || String(defaultConfig.simulationDays)),
    timeAcceleration: parseInt(process.env.TIME_ACCELERATION || String(defaultConfig.timeAcceleration)),
    rpcUrl: process.env.RPC_URL || defaultConfig.rpcUrl,
  };
}
