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
exports.DataExporter = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DataExporter {
    constructor(atomManager, tokenManager, tradingSystem, communicationSystem) {
        this.atomManager = atomManager;
        this.tokenManager = tokenManager;
        this.tradingSystem = tradingSystem;
        this.communicationSystem = communicationSystem;
        this.basePath = path.join(process.cwd(), 'data', 'exports');
        // Ensure the exports directory exists
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }
    exportAtomsToCSV() {
        console.log('Exporting atoms data to CSV...');
        const atoms = this.atomManager.getAllAtoms();
        // Create CSV header
        let csv = 'id,name,age,profession,experience,riskTolerance,tradingStrategy,decisionModel,fraudulent\n';
        // Add rows
        for (const atom of atoms) {
            csv += `${atom.id},${atom.persona.name},${atom.persona.age},${atom.persona.profession},${atom.persona.experience},${atom.riskTolerance},${atom.tradingStrategy},${atom.decisionModel},${atom.fraudulent}\n`;
        }
        // Write to file
        const filename = `atoms_export_${Date.now()}.csv`;
        const filePath = path.join(this.basePath, filename);
        fs.writeFileSync(filePath, csv);
        console.log(`Exported ${atoms.length} atoms to ${filePath}`);
        return filePath;
    }
    exportTradesToCSV() {
        console.log('Exporting trades data to CSV...');
        const trades = this.tradingSystem.getRecentTrades(100000);
        // Create CSV header
        let csv = 'id,atomId,tokenSymbol,type,amount,price,timestamp,success\n';
        // Add rows
        for (const trade of trades) {
            csv += `${trade.id},${trade.atomId},${trade.tokenSymbol},${trade.type},${trade.amount},${trade.price},${trade.timestamp},${trade.success}\n`;
        }
        // Write to file
        const filename = `trades_export_${Date.now()}.csv`;
        const filePath = path.join(this.basePath, filename);
        fs.writeFileSync(filePath, csv);
        console.log(`Exported ${trades.length} trades to ${filePath}`);
        return filePath;
    }
    exportTokenPriceHistoryToCSV() {
        console.log('Exporting token price history to CSV...');
        const tokens = this.tokenManager.getAllTokens();
        // Create CSV header
        let csv = 'symbol,timestamp,price,volume\n';
        // Add rows for each token
        for (const token of tokens) {
            const priceHistory = this.tokenManager.getPriceHistory(token.symbol, 10000);
            for (const point of priceHistory) {
                csv += `${token.symbol},${point.timestamp},${point.price},${point.volume}\n`;
            }
        }
        // Write to file
        const filename = `token_prices_export_${Date.now()}.csv`;
        const filePath = path.join(this.basePath, filename);
        fs.writeFileSync(filePath, csv);
        console.log(`Exported price history for ${tokens.length} tokens to ${filePath}`);
        return filePath;
    }
    exportMessagesToCSV() {
        console.log('Exporting messages data to CSV...');
        const messages = this.communicationSystem.getRecentMessages(100000);
        // Create CSV header
        let csv = 'id,atomId,timestamp,content\n';
        // Add rows
        for (const msg of messages) {
            // Escape commas and quotes in content
            const escapedContent = msg.content
                .replace(/"/g, '""')
                .replace(/\n/g, ' ');
            csv += `${msg.id},${msg.atomId},${msg.timestamp},"${escapedContent}"\n`;
        }
        // Write to file
        const filename = `messages_export_${Date.now()}.csv`;
        const filePath = path.join(this.basePath, filename);
        fs.writeFileSync(filePath, csv);
        console.log(`Exported ${messages.length} messages to ${filePath}`);
        return filePath;
    }
    exportAllData() {
        console.log('Exporting all simulation data...');
        const files = [
            this.exportAtomsToCSV(),
            this.exportTradesToCSV(),
            this.exportTokenPriceHistoryToCSV(),
            this.exportMessagesToCSV()
        ];
        // Create a manifest file
        const manifest = {
            exportedAt: new Date().toISOString(),
            files: files.map(file => path.basename(file)),
            counts: {
                atoms: this.atomManager.getAllAtoms().length,
                tokens: this.tokenManager.getAllTokens().length,
                trades: this.tradingSystem.getRecentTrades(100000).length,
                messages: this.communicationSystem.getRecentMessages(100000).length
            }
        };
        const manifestPath = path.join(this.basePath, `export_manifest_${Date.now()}.json`);
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log('All data exported successfully!');
        return [...files, manifestPath];
    }
}
exports.DataExporter = DataExporter;
