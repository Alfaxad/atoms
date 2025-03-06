export const ATOM_TYPES = {
  PROFESSIONAL: 'professional',
  BUSINESS_OWNER: 'business_owner',
  FULL_TIME_TRADER: 'full_time_trader',
  COLLEGE_STUDENT: 'college_student',
  RETIREE: 'retiree',
  CASUAL_INVESTOR: 'casual_investor'
};

export const ATOM_TYPE_DISTRIBUTION = {
  [ATOM_TYPES.PROFESSIONAL]: 0.1,      // 10%
  [ATOM_TYPES.BUSINESS_OWNER]: 0.2,    // 20%
  [ATOM_TYPES.FULL_TIME_TRADER]: 0.4,  // 40%
  [ATOM_TYPES.COLLEGE_STUDENT]: 0.1,   // 10%
  [ATOM_TYPES.RETIREE]: 0.1,           // 10%
  [ATOM_TYPES.CASUAL_INVESTOR]: 0.1    // 10%
};

export const TRADING_STRATEGIES = {
  VALUE_INVESTING: 'value_investing',
  MOMENTUM_TRADING: 'momentum_trading',
  SWING_TRADING: 'swing_trading',
  DAY_TRADING: 'day_trading',
  ARBITRAGE: 'arbitrage',
  PUMP_AND_DUMP: 'pump_and_dump', // Fraudulent behavior
  RUG_PULL: 'rug_pull',          // Fraudulent behavior
  LEGITIMATE: 'legitimate'       // General legitimate trading
};

export const DECISION_MODELS = {
  RATIONAL_ECONOMIC: 'rational_economic',
  BEHAVIORAL_FINANCE: 'behavioral_finance',
  TECHNICAL_ANALYSIS: 'technical_analysis',
  FUNDAMENTAL_ANALYSIS: 'fundamental_analysis',
  SOCIAL_INFLUENCE: 'social_influence',
  CONTRARIAN: 'contrarian',
  FOLLOWER: 'follower'
};

export const SIMULATION_SETTINGS = {
  INITIAL_ATOMS: 50,        // Start with 50 atoms for testing
  TARGET_ATOMS: 5000,       // Scale up to 5000 atoms
  FRAUD_PERCENTAGE: 0.05,   // 5% of atoms exhibit fraudulent behavior
  TOKEN_COUNT: 10,          // Number of tokens to create in the ecosystem
  SIMULATION_DAYS: 30,      // Days to simulate
  TIME_ACCELERATION: 24,    // 1 real second = 24 simulated minutes
};
