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
exports.ReportGenerator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ReportGenerator {
    constructor(atomManager, tokenManager, tradingSystem, communicationSystem, simulationManager) {
        this.atomManager = atomManager;
        this.tokenManager = tokenManager;
        this.tradingSystem = tradingSystem;
        this.communicationSystem = communicationSystem;
        this.simulationManager = simulationManager;
        this.basePath = path.join(process.cwd(), 'data', 'reports');
        // Ensure the reports directory exists
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }
    async generateSimulationSummary() {
        console.log('Generating simulation summary report...');
        const simulationStatus = this.simulationManager.getStatus();
        const atoms = this.atomManager.getAllAtoms();
        const tokens = this.tokenManager.getAllTokens();
        // Create summary report
        const report = {
            timestamp: Date.now(),
            simulation: {
                duration: {
                    days: simulationStatus.simulationDays,
                    realTimeHours: simulationStatus.realTimeElapsed / (60 * 60 * 1000)
                },
                cycles: simulationStatus.cycleCount
            },
            atoms: {
                total: atoms.length,
                fraudulent: this.atomManager.getFraudulentAtoms().length,
                legitimate: this.atomManager.getLegitimateAtoms().length,
                professionBreakdown: this.getProfessionBreakdown(atoms),
                tradingStrategyBreakdown: this.getStrategyBreakdown(atoms)
            },
            market: {
                tokens: tokens.map(token => ({
                    symbol: token.symbol,
                    name: token.name,
                    finalPrice: token.currentPrice,
                    priceHistory: this.tokenManager.getPriceHistory(token.symbol, 100),
                    totalVolume: token.totalVolume,
                    fraudScore: token.fraudScore
                }))
            },
            trading: {
                totalTrades: this.tradingSystem.getRecentTrades(100000).length,
                volumeByToken: this.getVolumeByToken(),
                topTraders: this.getTopTraders(10)
            },
            communication: {
                topicTrends: this.communicationSystem.getTopicTrends(20),
                messageCount: this.communicationSystem.getRecentMessages(100000).length,
                topCommunicators: this.getTopCommunicators(10)
            },
            fraudDetection: {
                suspiciousTokens: this.detectSuspiciousTokens(),
                suspiciousAtoms: this.detectSuspiciousAtoms(10)
            }
        };
        // Save report to disk
        const filename = `simulation_summary_${Date.now()}.json`;
        const filePath = path.join(this.basePath, filename);
        fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
        console.log(`Simulation summary report saved to ${filePath}`);
        return report;
    }
    async generateFraudReport() {
        console.log('Generating fraud analysis report...');
        const fraudulentAtoms = this.atomManager.getFraudulentAtoms();
        const tokens = this.tokenManager.getAllTokens();
        // Get suspicious tokens
        const suspiciousTokens = tokens
            .filter(token => token.fraudScore > 0.3)
            .sort((a, b) => b.fraudScore - a.fraudScore);
        // Get price manipulation evidence
        const priceManipulationEvidence = this.analyzeTokenPriceManipulation();
        // Analyze fraudulent communication patterns
        const communicationPatterns = this.analyzeFraudulentCommunication();
        // Create fraud report
        const report = {
            timestamp: Date.now(),
            fraudulentAtoms: {
                count: fraudulentAtoms.length,
                percentage: fraudulentAtoms.length / this.atomManager.getAllAtoms().length * 100,
                details: fraudulentAtoms.map(atom => ({
                    id: atom.id,
                    persona: atom.persona,
                    tradingStrategy: atom.tradingStrategy,
                    trades: this.tradingSystem.getTradesByAtom(atom.id, 20).map(trade => ({
                        tokenSymbol: trade.tokenSymbol,
                        type: trade.type,
                        amount: trade.amount,
                        price: trade.price,
                        timestamp: trade.timestamp
                    })),
                    messages: this.communicationSystem.getMessagesByAtom(atom.id, 20).map(msg => ({
                        content: msg.content,
                        timestamp: msg.timestamp
                    }))
                }))
            },
            suspiciousTokens: suspiciousTokens.map(token => ({
                symbol: token.symbol,
                name: token.name,
                fraudScore: token.fraudScore,
                priceHistory: this.tokenManager.getPriceHistory(token.symbol, 100),
                evidenceOfManipulation: priceManipulationEvidence[token.symbol] || []
            })),
            communicationPatterns
        };
        // Save report to disk
        const filename = `fraud_report_${Date.now()}.json`;
        const filePath = path.join(this.basePath, filename);
        fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
        console.log(`Fraud analysis report saved to ${filePath}`);
        return report;
    }
    async generateTraderPerformanceReport() {
        console.log('Generating trader performance report...');
        const atoms = this.atomManager.getAllAtoms();
        const traders = [];
        for (const atom of atoms) {
            const trades = this.tradingSystem.getTradesByAtom(atom.id, 1000);
            // Skip atoms with no trades
            if (trades.length === 0)
                continue;
            // Calculate performance metrics
            const totalTrades = trades.length;
            const buyTrades = trades.filter(t => t.type === 'buy');
            const sellTrades = trades.filter(t => t.type === 'sell');
            const totalVolume = trades.reduce((sum, trade) => sum + trade.amount * trade.price, 0);
            // Simple P&L calculation (very basic)
            let profitLoss = 0;
            for (const trade of trades) {
                if (trade.type === 'buy') {
                    profitLoss -= trade.amount * trade.price;
                }
                else {
                    profitLoss += trade.amount * trade.price;
                }
            }
            traders.push({
                atomId: atom.id,
                name: atom.persona.name,
                profession: atom.persona.profession,
                tradingStrategy: atom.tradingStrategy,
                riskTolerance: atom.riskTolerance,
                fraudulent: atom.fraudulent,
                metrics: {
                    totalTrades,
                    buyTrades: buyTrades.length,
                    sellTrades: sellTrades.length,
                    totalVolume,
                    profitLoss,
                    averageTradeSize: totalVolume / totalTrades
                },
                recentTrades: trades.slice(0, 10).map(trade => ({
                    tokenSymbol: trade.tokenSymbol,
                    type: trade.type,
                    amount: trade.amount,
                    price: trade.price,
                    timestamp: trade.timestamp
                }))
            });
        }
        // Sort traders by volume
        traders.sort((a, b) => b.metrics.totalVolume - a.metrics.totalVolume);
        // Create report
        const report = {
            timestamp: Date.now(),
            totalTraders: traders.length,
            topPerformers: traders.slice(0, 20),
            worstPerformers: traders
                .sort((a, b) => a.metrics.profitLoss - b.metrics.profitLoss)
                .slice(0, 20),
            strategyPerformance: this.analyzeStrategyPerformance(traders),
            riskToleranceCorrelation: this.analyzeRiskToleranceCorrelation(traders)
        };
        // Save report to disk
        const filename = `trader_performance_${Date.now()}.json`;
        const filePath = path.join(this.basePath, filename);
        fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
        console.log(`Trader performance report saved to ${filePath}`);
        return report;
    }
    async generateCommunicationAnalysisReport() {
        console.log('Generating communication analysis report...');
        // Get all recent messages
        const messages = this.communicationSystem.getRecentMessages(10000);
        const atoms = this.atomManager.getAllAtoms();
        // Analyze message frequency by atom type
        const messagesByAtomType = {};
        for (const msg of messages) {
            const atom = this.atomManager.getAtom(msg.atomId);
            if (!atom)
                continue;
            const atomType = atom.fraudulent ? 'fraudulent' : 'legitimate';
            if (!messagesByAtomType[atomType]) {
                messagesByAtomType[atomType] = {
                    count: 0,
                    atoms: new Set()
                };
            }
            messagesByAtomType[atomType].count++;
            messagesByAtomType[atomType].atoms.add(msg.atomId);
        }
        // Normalize by atom count
        for (const type in messagesByAtomType) {
            const atomCount = type === 'fraudulent'
                ? this.atomManager.getFraudulentAtoms().length
                : this.atomManager.getLegitimateAtoms().length;
            messagesByAtomType[type].averagePerAtom =
                messagesByAtomType[type].count / atomCount;
            // Convert Set to array size
            messagesByAtomType[type].uniqueAtomCount =
                messagesByAtomType[type].atoms.size;
            messagesByAtomType[type].atoms = undefined;
        }
        // Analyze trending topics over time
        const topicTrends = this.communicationSystem.getTopicTrends(30);
        // Analyze sentiment (simplified)
        const sentimentByToken = this.analyzeSentimentByToken(messages);
        // Create report
        const report = {
            timestamp: Date.now(),
            messageCount: messages.length,
            messagesByAtomType,
            topicTrends,
            tokenSentiment: sentimentByToken,
            topCommunicators: this.getTopCommunicators(20),
            communicationNetwork: this.analyzeNetworkStructure()
        };
        // Save report to disk
        const filename = `communication_analysis_${Date.now()}.json`;
        const filePath = path.join(this.basePath, filename);
        fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
        console.log(`Communication analysis report saved to ${filePath}`);
        return report;
    }
    // Helper methods for report generation
    getProfessionBreakdown(atoms) {
        const breakdown = {};
        for (const atom of atoms) {
            const profession = atom.persona.profession;
            breakdown[profession] = (breakdown[profession] || 0) + 1;
        }
        return breakdown;
    }
    getStrategyBreakdown(atoms) {
        const breakdown = {};
        for (const atom of atoms) {
            const strategy = atom.tradingStrategy;
            breakdown[strategy] = (breakdown[strategy] || 0) + 1;
        }
        return breakdown;
    }
    getVolumeByToken() {
        const volumeByToken = {};
        const allTrades = this.tradingSystem.getRecentTrades(100000);
        for (const trade of allTrades) {
            const volume = trade.amount * trade.price;
            volumeByToken[trade.tokenSymbol] = (volumeByToken[trade.tokenSymbol] || 0) + volume;
        }
        return volumeByToken;
    }
    getTopTraders(limit) {
        const atomTradeMap = new Map();
        const allTrades = this.tradingSystem.getRecentTrades(100000);
        for (const trade of allTrades) {
            const atom = this.atomManager.getAtom(trade.atomId);
            if (!atom)
                continue;
            const volume = trade.amount * trade.price;
            if (!atomTradeMap.has(trade.atomId)) {
                atomTradeMap.set(trade.atomId, {
                    atom,
                    volume: 0,
                    tradeCount: 0
                });
            }
            const data = atomTradeMap.get(trade.atomId);
            data.volume += volume;
            data.tradeCount += 1;
        }
        // Convert to array and sort by volume
        return Array.from(atomTradeMap.values())
            .sort((a, b) => b.volume - a.volume)
            .slice(0, limit)
            .map(data => ({
            atomId: data.atom.id,
            name: data.atom.persona.name,
            profession: data.atom.persona.profession,
            fraudulent: data.atom.fraudulent,
            volume: data.volume,
            tradeCount: data.tradeCount
        }));
    }
    getTopCommunicators(limit) {
        const atomMessageMap = new Map();
        // Get all recent messages
        const messages = this.communicationSystem.getRecentMessages(10000);
        for (const msg of messages) {
            const atom = this.atomManager.getAtom(msg.atomId);
            if (!atom)
                continue;
            if (!atomMessageMap.has(msg.atomId)) {
                atomMessageMap.set(msg.atomId, {
                    atom,
                    messageCount: 0
                });
            }
            const data = atomMessageMap.get(msg.atomId);
            data.messageCount += 1;
        }
        // Convert to array and sort by message count
        return Array.from(atomMessageMap.values())
            .sort((a, b) => b.messageCount - a.messageCount)
            .slice(0, limit)
            .map(data => ({
            atomId: data.atom.id,
            name: data.atom.persona.name,
            profession: data.atom.persona.profession,
            fraudulent: data.atom.fraudulent,
            messageCount: data.messageCount
        }));
    }
    detectSuspiciousTokens() {
        const tokens = this.tokenManager.getAllTokens();
        const suspiciousTokens = [];
        for (const token of tokens) {
            // Skip USDC
            if (token.symbol === 'USDC')
                continue;
            // Check for rapid price changes
            const priceHistory = this.tokenManager.getPriceHistory(token.symbol, 100);
            if (priceHistory.length < 10)
                continue;
            let maxIncrease = 0;
            let maxDecrease = 0;
            for (let i = 1; i < priceHistory.length; i++) {
                const prevPrice = priceHistory[i - 1].price;
                const currentPrice = priceHistory[i].price;
                const percentChange = (currentPrice - prevPrice) / prevPrice * 100;
                if (percentChange > maxIncrease) {
                    maxIncrease = percentChange;
                }
                if (percentChange < maxDecrease) {
                    maxDecrease = percentChange;
                }
            }
            // Calculate price volatility
            const prices = priceHistory.map(p => p.price);
            const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            const variance = prices
                .map(price => Math.pow(price - avgPrice, 2))
                .reduce((sum, val) => sum + val, 0) / prices.length;
            const volatility = Math.sqrt(variance) / avgPrice;
            // Check if suspicious
            const isSuspicious = token.fraudScore > 0.3 ||
                maxIncrease > 30 ||
                maxDecrease < -30 ||
                volatility > 0.3;
            if (isSuspicious) {
                suspiciousTokens.push({
                    symbol: token.symbol,
                    name: token.name,
                    fraudScore: token.fraudScore,
                    volatility,
                    maxIncrease,
                    maxDecrease,
                    evidence: [
                        token.fraudScore > 0.3 ? "High fraud score" : null,
                        maxIncrease > 30 ? `Rapid price increase (${maxIncrease.toFixed(2)}%)` : null,
                        maxDecrease < -30 ? `Rapid price decrease (${maxDecrease.toFixed(2)}%)` : null,
                        volatility > 0.3 ? `High volatility (${volatility.toFixed(2)})` : null
                    ].filter(Boolean)
                });
            }
        }
        return suspiciousTokens;
    }
    detectSuspiciousAtoms(limit) {
        const atoms = this.atomManager.getAllAtoms();
        const suspiciousAtoms = [];
        for (const atom of atoms) {
            let suspicionScore = 0;
            const evidenceList = [];
            // Known fraudulent atoms (ground truth)
            if (atom.fraudulent) {
                suspicionScore += 1.0;
                evidenceList.push("Known fraudulent atom (ground truth)");
            }
            // Check trading behavior
            const trades = this.tradingSystem.getTradesByAtom(atom.id, 1000);
            if (trades.length > 0) {
                // Check for pump & dump patterns
                const tradesByToken = {};
                for (const trade of trades) {
                    if (!tradesByToken[trade.tokenSymbol]) {
                        tradesByToken[trade.tokenSymbol] = [];
                    }
                    tradesByToken[trade.tokenSymbol].push(trade);
                }
                // Analyze each token traded by the atom
                for (const [symbol, tokenTrades] of Object.entries(tradesByToken)) {
                    // Sort by timestamp
                    tokenTrades.sort((a, b) => a.timestamp - b.timestamp);
                    // Check buy/sell pattern
                    const buyPhase = tokenTrades.filter((t, idx) => idx < tokenTrades.length / 2 && t.type === 'buy');
                    const sellPhase = tokenTrades.filter((t, idx) => idx >= tokenTrades.length / 2 && t.type === 'sell');
                    // If early buys followed by late sells, potential P&D
                    if (buyPhase.length > 2 && sellPhase.length > 2 &&
                        buyPhase.length / tokenTrades.length > 0.3 &&
                        sellPhase.length / tokenTrades.length > 0.3) {
                        const token = this.tokenManager.getToken(symbol);
                        if (token && token.fraudScore > 0.3) {
                            suspicionScore += 0.5;
                            evidenceList.push(`Potential pump & dump pattern for ${symbol}`);
                        }
                    }
                }
            }
            // Check communication behavior
            const messages = this.communicationSystem.getMessagesByAtom(atom.id, 100);
            if (messages.length > 0) {
                // Check for excessive promotion
                const tokenMentions = {};
                for (const msg of messages) {
                    const content = msg.content.toLowerCase();
                    // Check for token mentions
                    const tokens = this.tokenManager.getAllTokens();
                    for (const token of tokens) {
                        if (content.includes(token.symbol.toLowerCase())) {
                            tokenMentions[token.symbol] = (tokenMentions[token.symbol] || 0) + 1;
                        }
                    }
                    // Check for promotional language
                    const promotionalPhrases = [
                        'moon', 'rocket', 'going up', 'don\'t miss', 'opportunity',
                        'get in now', 'next big', 'huge potential', 'guaranteed'
                    ];
                    for (const phrase of promotionalPhrases) {
                        if (content.includes(phrase)) {
                            suspicionScore += 0.05;
                            if (!evidenceList.includes("Uses promotional language")) {
                                evidenceList.push("Uses promotional language");
                            }
                            break;
                        }
                    }
                }
                // Check for excessive promotion of suspicious tokens
                for (const [symbol, count] of Object.entries(tokenMentions)) {
                    const token = this.tokenManager.getToken(symbol);
                    if (token && token.fraudScore > 0.3 && count > 3) {
                        suspicionScore += 0.3;
                        evidenceList.push(`Repeatedly promotes suspicious token ${symbol} (${count} mentions)`);
                    }
                }
            }
            // If suspicion score is significant, add to list
            if (suspicionScore > 0.2) {
                suspiciousAtoms.push({
                    atomId: atom.id,
                    name: atom.persona.name,
                    profession: atom.persona.profession,
                    tradingStrategy: atom.tradingStrategy,
                    suspicionScore,
                    evidence: evidenceList,
                    knownFraudulent: atom.fraudulent
                });
            }
        }
        // Sort by suspicion score and limit
        return suspiciousAtoms
            .sort((a, b) => b.suspicionScore - a.suspicionScore)
            .slice(0, limit);
    }
    analyzeTokenPriceManipulation() {
        const result = {};
        const tokens = this.tokenManager.getAllTokens();
        for (const token of tokens) {
            // Skip USDC
            if (token.symbol === 'USDC')
                continue;
            const priceHistory = this.tokenManager.getPriceHistory(token.symbol, 200);
            const evidence = [];
            if (priceHistory.length < 20)
                continue;
            // Check for pump and dump pattern
            let pumpPhaseFound = false;
            let dumpPhaseFound = false;
            // Get peak price and its index
            let peakPrice = 0;
            let peakIndex = 0;
            for (let i = 0; i < priceHistory.length; i++) {
                if (priceHistory[i].price > peakPrice) {
                    peakPrice = priceHistory[i].price;
                    peakIndex = i;
                }
            }
            // Check for rise before peak
            if (peakIndex > 10) {
                const prePeakPrices = priceHistory.slice(peakIndex - 10, peakIndex);
                const startPrice = prePeakPrices[0].price;
                const endPrice = prePeakPrices[prePeakPrices.length - 1].price;
                if (endPrice > startPrice * 1.3) { // 30% increase
                    pumpPhaseFound = true;
                    evidence.push({
                        type: "Pump phase detected",
                        details: `Price increased by ${((endPrice / startPrice - 1) * 100).toFixed(2)}% before peak`
                    });
                }
            }
            // Check for fall after peak
            if (peakIndex < priceHistory.length - 10) {
                const postPeakPrices = priceHistory.slice(peakIndex, peakIndex + 10);
                const startPrice = postPeakPrices[0].price;
                const endPrice = postPeakPrices[postPeakPrices.length - 1].price;
                if (endPrice < startPrice * 0.7) { // 30% decrease
                    dumpPhaseFound = true;
                    evidence.push({
                        type: "Dump phase detected",
                        details: `Price decreased by ${((1 - endPrice / startPrice) * 100).toFixed(2)}% after peak`
                    });
                }
            }
            // If both pump and dump detected, it's a P&D pattern
            if (pumpPhaseFound && dumpPhaseFound) {
                evidence.push({
                    type: "Pump and Dump pattern detected",
                    details: "Both rapid price increase and decrease detected"
                });
            }
            // Check for unusual volume spikes
            const volumes = priceHistory.map(p => p.volume);
            const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
            for (let i = 0; i < volumes.length; i++) {
                if (volumes[i] > avgVolume * 5) {
                    evidence.push({
                        type: "Volume spike detected",
                        details: `Volume at ${new Date(priceHistory[i].timestamp).toISOString()} was ${(volumes[i] / avgVolume).toFixed(2)}x average`
                    });
                    break;
                }
            }
            if (evidence.length > 0) {
                result[token.symbol] = evidence;
            }
        }
        return result;
    }
    analyzeFraudulentCommunication() {
        const fraudulentAtoms = this.atomManager.getFraudulentAtoms();
        const legitimateAtoms = this.atomManager.getLegitimateAtoms();
        // Get messages from fraudulent atoms
        const fraudMessages = [];
        for (const atom of fraudulentAtoms) {
            const messages = this.communicationSystem.getMessagesByAtom(atom.id, 50);
            for (const msg of messages) {
                fraudMessages.push({
                    content: msg.content,
                    timestamp: msg.timestamp,
                    atomId: atom.id
                });
            }
        }
        // Sample messages from legitimate atoms for comparison
        const legitMessages = [];
        const sampleSize = Math.min(fraudMessages.length, 100);
        const sampledAtoms = legitimateAtoms
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(legitimateAtoms.length, 20));
        for (const atom of sampledAtoms) {
            const messages = this.communicationSystem.getMessagesByAtom(atom.id, 10);
            for (const msg of messages) {
                legitMessages.push({
                    content: msg.content,
                    timestamp: msg.timestamp,
                    atomId: atom.id
                });
                if (legitMessages.length >= sampleSize)
                    break;
            }
            if (legitMessages.length >= sampleSize)
                break;
        }
        // Analyze language patterns
        const fraudWordFrequency = this.analyzeWordFrequency(fraudMessages.map(m => m.content));
        const legitWordFrequency = this.analyzeWordFrequency(legitMessages.map(m => m.content));
        // Find distinctive fraud vocabulary
        const distinctiveFraudTerms = [];
        for (const [word, count] of Object.entries(fraudWordFrequency)) {
            const legitCount = legitWordFrequency[word] || 0;
            const fraudRatio = count / fraudMessages.length;
            const legitRatio = legitCount / legitMessages.length;
            if (fraudRatio > 0.1 && fraudRatio > legitRatio * 2) {
                distinctiveFraudTerms.push([word, fraudRatio / legitRatio]);
            }
        }
        // Sort by distinctiveness ratio
        distinctiveFraudTerms.sort((a, b) => b[1] - a[1]);
        return {
            fraudMessagesAnalyzed: fraudMessages.length,
            legitMessagesAnalyzed: legitMessages.length,
            distinctiveFraudTerms: distinctiveFraudTerms.slice(0, 20),
            commonPhrases: this.extractCommonPhrases(fraudMessages.map(m => m.content), 3),
            exampleMessages: fraudMessages
                .sort(() => Math.random() - 0.5)
                .slice(0, 10)
                .map(m => ({
                content: m.content,
                atomId: m.atomId
            }))
        };
    }
    analyzeStrategyPerformance(traders) {
        const strategyPerformance = {};
        for (const trader of traders) {
            const strategy = trader.tradingStrategy;
            if (!strategyPerformance[strategy]) {
                strategyPerformance[strategy] = {
                    traderCount: 0,
                    totalVolume: 0,
                    avgProfitLoss: 0,
                    avgTradeSize: 0
                };
            }
            strategyPerformance[strategy].traderCount++;
            strategyPerformance[strategy].totalVolume += trader.metrics.totalVolume;
            strategyPerformance[strategy].avgProfitLoss += trader.metrics.profitLoss;
            strategyPerformance[strategy].avgTradeSize += trader.metrics.averageTradeSize;
        }
        // Calculate averages
        for (const strategy in strategyPerformance) {
            const data = strategyPerformance[strategy];
            if (data.traderCount > 0) {
                data.avgProfitLoss /= data.traderCount;
                data.avgTradeSize /= data.traderCount;
            }
        }
        return strategyPerformance;
    }
    analyzeRiskToleranceCorrelation(traders) {
        // Group traders by risk tolerance ranges
        const riskGroups = {
            'very_low': [],
            'low': [],
            'medium': [],
            'high': [],
            'very_high': []
        };
        for (const trader of traders) {
            const riskTolerance = trader.riskTolerance;
            if (riskTolerance < 0.2) {
                riskGroups.very_low.push(trader);
            }
            else if (riskTolerance < 0.4) {
                riskGroups.low.push(trader);
            }
            else if (riskTolerance < 0.6) {
                riskGroups.medium.push(trader);
            }
            else if (riskTolerance < 0.8) {
                riskGroups.high.push(trader);
            }
            else {
                riskGroups.very_high.push(trader);
            }
        }
        // Calculate average metrics for each group
        const result = {};
        for (const [groupName, groupTraders] of Object.entries(riskGroups)) {
            if (groupTraders.length === 0) {
                result[groupName] = { count: 0 };
                continue;
            }
            const avgProfitLoss = groupTraders.reduce((sum, t) => sum + t.metrics.profitLoss, 0) / groupTraders.length;
            const avgTradeSize = groupTraders.reduce((sum, t) => sum + t.metrics.averageTradeSize, 0) / groupTraders.length;
            const avgTradeCount = groupTraders.reduce((sum, t) => sum + t.metrics.totalTrades, 0) / groupTraders.length;
            const totalVolume = groupTraders.reduce((sum, t) => sum + t.metrics.totalVolume, 0);
            result[groupName] = {
                count: groupTraders.length,
                avgProfitLoss,
                avgTradeSize,
                avgTradeCount,
                totalVolume
            };
        }
        return result;
    }
    analyzeSentimentByToken(messages) {
        const tokens = this.tokenManager.getAllTokens();
        const result = {};
        for (const token of tokens) {
            // Find messages mentioning this token
            const mentioningMessages = messages.filter(msg => msg.content.toLowerCase().includes(token.symbol.toLowerCase()));
            if (mentioningMessages.length === 0)
                continue;
            // Simple sentiment analysis
            let positiveCount = 0;
            let negativeCount = 0;
            let neutralCount = 0;
            const positiveTerms = ['good', 'great', 'bullish', 'moon', 'up', 'gain', 'profit', 'opportunity', 'buy'];
            const negativeTerms = ['bad', 'bearish', 'down', 'loss', 'sell', 'dump', 'avoid', 'risk', 'crash'];
            for (const msg of mentioningMessages) {
                const content = msg.content.toLowerCase();
                let isPositive = false;
                let isNegative = false;
                for (const term of positiveTerms) {
                    if (content.includes(term)) {
                        isPositive = true;
                        break;
                    }
                }
                for (const term of negativeTerms) {
                    if (content.includes(term)) {
                        isNegative = true;
                        break;
                    }
                }
                if (isPositive && !isNegative) {
                    positiveCount++;
                }
                else if (isNegative && !isPositive) {
                    negativeCount++;
                }
                else {
                    neutralCount++;
                }
            }
            const totalCount = mentioningMessages.length;
            result[token.symbol] = {
                mentionCount: totalCount,
                sentiment: {
                    positive: {
                        count: positiveCount,
                        percentage: (positiveCount / totalCount) * 100
                    },
                    negative: {
                        count: negativeCount,
                        percentage: (negativeCount / totalCount) * 100
                    },
                    neutral: {
                        count: neutralCount,
                        percentage: (neutralCount / totalCount) * 100
                    }
                },
                // Overall sentiment score (-1 to 1)
                sentimentScore: (positiveCount - negativeCount) / totalCount
            };
        }
        return result;
    }
    analyzeNetworkStructure() {
        // This would need a proper relationship manager in the communication system
        // For now, return a simplified version based on message patterns
        const messages = this.communicationSystem.getRecentMessages(10000);
        const atoms = this.atomManager.getAllAtoms();
        // Count messages by atom
        const messageCountByAtom = {};
        for (const msg of messages) {
            messageCountByAtom[msg.atomId] = (messageCountByAtom[msg.atomId] || 0) + 1;
        }
        // Identify central and peripheral atoms
        const centralAtoms = [];
        const peripheralAtoms = [];
        // Sort atoms by message count
        const sortedAtoms = atoms
            .filter(atom => messageCountByAtom[atom.id])
            .sort((a, b) => (messageCountByAtom[b.id] || 0) - (messageCountByAtom[a.id] || 0));
        // Top 10% are central
        const centralCount = Math.max(1, Math.floor(sortedAtoms.length * 0.1));
        for (let i = 0; i < centralCount; i++) {
            centralAtoms.push({
                atomId: sortedAtoms[i].id,
                name: sortedAtoms[i].persona.name,
                profession: sortedAtoms[i].persona.profession,
                messageCount: messageCountByAtom[sortedAtoms[i].id] || 0,
                fraudulent: sortedAtoms[i].fraudulent
            });
        }
        // Bottom 20% are peripheral
        const peripheralCount = Math.max(1, Math.floor(sortedAtoms.length * 0.2));
        for (let i = sortedAtoms.length - peripheralCount; i < sortedAtoms.length; i++) {
            if (i >= 0) {
                peripheralAtoms.push({
                    atomId: sortedAtoms[i].id,
                    name: sortedAtoms[i].persona.name,
                    profession: sortedAtoms[i].persona.profession,
                    messageCount: messageCountByAtom[sortedAtoms[i].id] || 0,
                    fraudulent: sortedAtoms[i].fraudulent
                });
            }
        }
        return {
            networkSize: atoms.length,
            activeNodes: Object.keys(messageCountByAtom).length,
            centralAtoms,
            peripheralAtoms,
            fraudulentDistribution: {
                centralFraudulent: centralAtoms.filter(a => a.fraudulent).length,
                peripheralFraudulent: peripheralAtoms.filter(a => a.fraudulent).length
            }
        };
    }
    analyzeWordFrequency(texts) {
        const frequency = {};
        // Common English stop words to ignore
        const stopWords = new Set([
            'the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'is', 'are', 'am', 'was', 'were', 'be', 'been', 'being',
            'i', 'you', 'he', 'she', 'it', 'we', 'they',
            'my', 'your', 'his', 'her', 'its', 'our', 'their',
            'this', 'that', 'these', 'those', 'here', 'there',
            'from', 'by', 'as', 'if', 'so', 'than', 'but'
        ]);
        for (const text of texts) {
            // Split by non-word characters and convert to lowercase
            const words = text.toLowerCase().split(/\W+/);
            for (const word of words) {
                // Skip empty strings and stop words
                if (word && !stopWords.has(word) && word.length > 2) {
                    frequency[word] = (frequency[word] || 0) + 1;
                }
            }
        }
        return frequency;
    }
    extractCommonPhrases(texts, minWords) {
        // This is a simplified approach - a real implementation would use NLP techniques
        // Extract phrases of 2-4 words that appear multiple times
        const phrases = {};
        for (const text of texts) {
            // Convert to lowercase and split into words
            const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 1);
            if (words.length < minWords)
                continue;
            // Extract all possible phrases of the desired length
            for (let length = minWords; length <= Math.min(4, words.length); length++) {
                for (let i = 0; i <= words.length - length; i++) {
                    const phrase = words.slice(i, i + length).join(' ');
                    phrases[phrase] = (phrases[phrase] || 0) + 1;
                }
            }
        }
        // Filter out phrases that only appear once
        const commonPhrases = Object.entries(phrases)
            .filter(([phrase, count]) => count > 1)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([phrase]) => phrase);
        return commonPhrases.slice(0, 20); // Return top 20 phrases
    }
}
exports.ReportGenerator = ReportGenerator;
