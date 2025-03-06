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
exports.AtomManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class AtomManager {
    constructor() {
        this.atoms = new Map();
        this.basePath = path.join(process.cwd(), 'data', 'atoms');
    }
    async loadAtoms() {
        // Clear existing atoms
        this.atoms.clear();
        // Ensure the directory exists
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
            return;
        }
        // Read all atom files
        const files = fs.readdirSync(this.basePath).filter(file => file.endsWith('.json'));
        for (const file of files) {
            const filePath = path.join(this.basePath, file);
            const atomData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            this.atoms.set(atomData.id, atomData);
        }
        console.log(`Loaded ${this.atoms.size} atoms from disk`);
    }
    getAtom(id) {
        return this.atoms.get(id);
    }
    getAllAtoms() {
        return Array.from(this.atoms.values());
    }
    getAtomsByProfession(profession) {
        return this.getAllAtoms().filter(atom => atom.persona.profession === profession);
    }
    getAtomsByTradingStrategy(strategy) {
        return this.getAllAtoms().filter(atom => atom.tradingStrategy === strategy);
    }
    getAtomsByDecisionModel(model) {
        return this.getAllAtoms().filter(atom => atom.decisionModel === model);
    }
    getFraudulentAtoms() {
        return this.getAllAtoms().filter(atom => atom.fraudulent);
    }
    getLegitimateAtoms() {
        return this.getAllAtoms().filter(atom => !atom.fraudulent);
    }
}
exports.AtomManager = AtomManager;
