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
exports.AtomGenerator = void 0;
const personaGenerator_1 = require("./personaGenerator");
const walletGenerator_1 = require("./walletGenerator");
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const constants_1 = require("../config/constants");
class AtomGenerator {
    constructor() {
        this.personaGenerator = new personaGenerator_1.PersonaGenerator();
        this.walletGenerator = new walletGenerator_1.WalletGenerator();
        this.basePath = path.join(process.cwd(), 'data', 'atoms');
        // Ensure the atoms directory exists
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }
    assignTradingStrategy(fraudulent) {
        if (fraudulent) {
            // Assign fraudulent strategy
            return Math.random() < 0.5 ?
                constants_1.TRADING_STRATEGIES.PUMP_AND_DUMP :
                constants_1.TRADING_STRATEGIES.RUG_PULL;
        }
        else {
            // Assign legitimate strategy
            const strategies = [
                constants_1.TRADING_STRATEGIES.VALUE_INVESTING,
                constants_1.TRADING_STRATEGIES.MOMENTUM_TRADING,
                constants_1.TRADING_STRATEGIES.SWING_TRADING,
                constants_1.TRADING_STRATEGIES.DAY_TRADING,
                constants_1.TRADING_STRATEGIES.ARBITRAGE,
            ];
            return strategies[Math.floor(Math.random() * strategies.length)];
        }
    }
    assignDecisionModel() {
        const models = Object.values(constants_1.DECISION_MODELS);
        return models[Math.floor(Math.random() * models.length)];
    }
    calculateRiskTolerance(persona) {
        // Base risk tolerance on profession and traits
        let base = 0.5; // Default is middle of the road
        // Adjust based on profession
        switch (persona.profession) {
            case 'professional':
                base = 0.3 + (Math.random() * 0.3); // 0.3-0.6 (moderate)
                break;
            case 'business_owner':
                base = 0.4 + (Math.random() * 0.4); // 0.4-0.8 (moderate to high)
                break;
            case 'full_time_trader':
                base = 0.6 + (Math.random() * 0.4); // 0.6-1.0 (high)
                break;
            case 'college_student':
                base = 0.7 + (Math.random() * 0.3); // 0.7-1.0 (high, less risk-averse)
                break;
            case 'retiree':
                base = 0.1 + (Math.random() * 0.3); // 0.1-0.4 (low)
                break;
            case 'casual_investor':
                base = 0.3 + (Math.random() * 0.5); // 0.3-0.8 (varied)
                break;
        }
        // Adjust based on traits
        if (persona.traits.includes('risk_averse')) {
            base -= 0.2;
        }
        if (persona.traits.includes('risk_taker')) {
            base += 0.2;
        }
        if (persona.traits.includes('cautious')) {
            base -= 0.1;
        }
        if (persona.traits.includes('aggressive')) {
            base += 0.1;
        }
        // Adjust based on experience
        switch (persona.experience) {
            case 'novice':
                // Novices can be either too cautious or too risky
                base = Math.random() < 0.5 ?
                    Math.max(0.1, base - 0.2) :
                    Math.min(1.0, base + 0.2);
                break;
            case 'intermediate':
                // No adjustment
                break;
            case 'experienced':
                // Experienced traders tend to be more measured
                base = 0.3 + (base - 0.3) * 0.8;
                break;
            case 'expert':
                // Experts know when to take risks
                base = 0.4 + (base - 0.4) * 0.8;
                break;
        }
        // Ensure risk tolerance is between 0 and 1
        return Math.max(0, Math.min(1, base));
    }
    determineInitialBalance(persona) {
        // Base initial balance on profession and experience
        let base = 1.0; // SOL
        // Adjust based on profession (in SOL)
        switch (persona.profession) {
            case 'professional':
                base = 1.0 + Math.random() * 2.0; // 1-3 SOL
                break;
            case 'business_owner':
                base = 2.0 + Math.random() * 5.0; // 2-7 SOL
                break;
            case 'full_time_trader':
                base = 5.0 + Math.random() * 10.0; // 5-15 SOL
                break;
            case 'college_student':
                base = 0.5 + Math.random() * 1.5; // 0.5-2 SOL
                break;
            case 'retiree':
                base = 3.0 + Math.random() * 7.0; // 3-10 SOL
                break;
            case 'casual_investor':
                base = 1.0 + Math.random() * 3.0; // 1-4 SOL
                break;
        }
        // Adjust based on experience
        switch (persona.experience) {
            case 'novice':
                base *= 0.7; // Reduce balance for novices
                break;
            case 'intermediate':
                // No adjustment
                break;
            case 'experienced':
                base *= 1.5; // Increase for experienced
                break;
            case 'expert':
                base *= 2.0; // Increase for experts
                break;
        }
        // Add some randomness (±20%)
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8-1.2
        base *= randomFactor;
        // Round to 2 decimal places
        return Math.round(base * 100) / 100;
    }
    async generateAtom(fraudulent = false) {
        // Generate a unique ID
        const id = (0, uuid_1.v4)();
        // Generate persona
        const persona = await this.personaGenerator.generatePersona('full_time_trader'); // We'll override this
        // Generate wallet
        const wallet = await this.walletGenerator.generateWallet(id);
        // Assign trading strategy
        const tradingStrategy = this.assignTradingStrategy(fraudulent);
        // Assign decision model
        const decisionModel = this.assignDecisionModel();
        // Calculate risk tolerance
        const riskTolerance = this.calculateRiskTolerance(persona);
        // Determine initial balance
        const initialBalance = this.determineInitialBalance(persona);
        // Create atom profile
        const atom = {
            id,
            walletAddress: wallet.address,
            initialBalance,
            persona,
            riskTolerance,
            tradingStrategy,
            decisionModel,
            fraudulent
        };
        // Save atom data
        this.saveAtomData(atom);
        return atom;
    }
    saveAtomData(atom) {
        const filePath = path.join(this.basePath, `${atom.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(atom, null, 2));
    }
    async generateBatch(count, fraudPercentage = 0.05) {
        const atoms = [];
        const fraudCount = Math.floor(count * fraudPercentage);
        const legitimateCount = count - fraudCount;
        console.log(`Generating ${legitimateCount} legitimate atoms...`);
        for (let i = 0; i < legitimateCount; i++) {
            const atom = await this.generateAtom(false);
            atoms.push(atom);
            if ((i + 1) % 10 === 0) {
                console.log(`Generated ${i + 1}/${legitimateCount} legitimate atoms`);
            }
        }
        console.log(`Generating ${fraudCount} fraudulent atoms...`);
        for (let i = 0; i < fraudCount; i++) {
            const atom = await this.generateAtom(true);
            atoms.push(atom);
            if ((i + 1) % 5 === 0) {
                console.log(`Generated ${i + 1}/${fraudCount} fraudulent atoms`);
            }
        }
        return atoms;
    }
}
exports.AtomGenerator = AtomGenerator;
