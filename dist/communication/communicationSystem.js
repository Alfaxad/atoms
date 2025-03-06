"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationSystem = void 0;
const channelManager_1 = require("./channelManager");
const messageGenerator_1 = require("./messageGenerator");
const relationshipManager_1 = require("./relationshipManager");
class CommunicationSystem {
    constructor(atomManager) {
        this.channelManager = new channelManager_1.ChannelManager();
        this.messageGenerator = new messageGenerator_1.MessageGenerator();
        this.relationshipManager = new relationshipManager_1.RelationshipManager();
        this.atomManager = atomManager;
    }
    async initialize() {
        // Load existing data
        await this.channelManager.loadChannels();
        await this.relationshipManager.loadRelationships();
        // Create main trading channel if it doesn't exist
        const channels = this.channelManager.getAllChannels();
        if (channels.length === 0) {
            this.channelManager.createChannel('trading-main', 'Main trading discussion channel');
        }
    }
    getMainChannel() {
        const channels = this.channelManager.getAllChannels();
        return channels.find(c => c.name === 'trading-main');
    }
    getOrCreateMainChannel() {
        const mainChannel = this.getMainChannel();
        if (mainChannel)
            return mainChannel;
        return this.channelManager.createChannel('trading-main', 'Main trading discussion channel');
    }
    async generateTradeMessage(atomId, action, tokenSymbol, amount, price) {
        const atom = this.atomManager.getAtom(atomId);
        if (!atom)
            return undefined;
        const mainChannel = this.getOrCreateMainChannel();
        // Generate message
        const message = await this.messageGenerator.generateTradeMessage(atom, action, tokenSymbol, amount, price, mainChannel.id);
        // Add message to channel
        this.channelManager.addMessage(message);
        // Update relationships
        this.updateRelationshipsFromMessage(message);
        return message;
    }
    async generateMarketCommentMessage(atomId, tokenSymbol, priceChange) {
        const atom = this.atomManager.getAtom(atomId);
        if (!atom)
            return undefined;
        const mainChannel = this.getOrCreateMainChannel();
        // Get recent messages
        const recentMessages = this.channelManager.getMessages(mainChannel.id, 10);
        // Generate message
        const message = await this.messageGenerator.generateMarketCommentMessage(atom, tokenSymbol, priceChange, recentMessages, mainChannel.id);
        // Add message to channel
        this.channelManager.addMessage(message);
        // Update relationships
        this.updateRelationshipsFromMessage(message);
        return message;
    }
    async generateFraudulentMessage(atomId, tokenSymbol, strategy, phase) {
        const atom = this.atomManager.getAtom(atomId);
        if (!atom)
            return undefined;
        // Verify the atom is fraudulent
        if (!atom.fraudulent)
            return undefined;
        const mainChannel = this.getOrCreateMainChannel();
        // Generate message
        const message = await this.messageGenerator.generateFraudulentMessage(atom, tokenSymbol, strategy, phase, mainChannel.id);
        // Add message to channel
        this.channelManager.addMessage(message);
        // Update relationships
        this.updateRelationshipsFromMessage(message);
        return message;
    }
    updateRelationshipsFromMessage(message) {
        // If this is a reply, strengthen relationship between atoms
        if (message.replyToId) {
            const repliedToMessage = this.channelManager.getMessageById(message.replyToId);
            if (repliedToMessage && repliedToMessage.atomId !== message.atomId) {
                this.relationshipManager.createOrUpdateRelationship(message.atomId, repliedToMessage.atomId, 0.5 // Significant positive impact
                );
            }
        }
        // Get atoms in the same channel
        const channel = this.channelManager.getChannel(message.channelId);
        if (!channel)
            return;
        // Weak relationship update with all channel participants
        for (const participantId of channel.participants) {
            if (participantId !== message.atomId) {
                this.relationshipManager.createOrUpdateRelationship(message.atomId, participantId, 0.05 // Small positive impact
                );
            }
        }
    }
    getRecentMessages(limit = 50) {
        const mainChannel = this.getOrCreateMainChannel();
        return this.channelManager.getMessages(mainChannel.id, limit);
    }
    getMessagesByAtom(atomId, limit = 20) {
        return this.channelManager.getMessagesByAtom(atomId, limit);
    }
    getTopicTrends(limit = 10) {
        const mainChannel = this.getOrCreateMainChannel();
        return this.channelManager.getTopicTrends(mainChannel.id, limit);
    }
    getRelationships(atomId, limit = 10) {
        return this.relationshipManager.getStrongestRelationships(atomId, limit);
    }
    registerAtomForMainChannel(atomId) {
        const mainChannel = this.getOrCreateMainChannel();
        return this.channelManager.addParticipant(mainChannel.id, atomId);
    }
    registerAllAtoms() {
        const mainChannel = this.getOrCreateMainChannel();
        const atoms = this.atomManager.getAllAtoms();
        for (const atom of atoms) {
            this.channelManager.addParticipant(mainChannel.id, atom.id);
        }
        console.log(`Registered ${atoms.length} atoms in the main channel`);
    }
    decayRelationships() {
        this.relationshipManager.decayRelationships();
    }
    async batchGenerateMessages(count) {
        const messages = [];
        const atoms = this.atomManager.getAllAtoms();
        if (atoms.length === 0) {
            console.warn('No atoms available to generate messages');
            return messages;
        }
        // Generate random messages
        for (let i = 0; i < count; i++) {
            // Pick a random atom
            const randomIndex = Math.floor(Math.random() * atoms.length);
            const atom = atoms[randomIndex];
            // Decide message type (80% market comments, 20% trades)
            const messageType = Math.random() < 0.8 ? 'market_comment' : 'trade';
            // Generate random token symbol for the message
            const tokenSymbols = ['SOL', 'ETH', 'BTC', 'USDC', 'ATOM', 'AVAX', 'ATOM1', 'ATOM2', 'ATOM3'];
            const tokenSymbol = tokenSymbols[Math.floor(Math.random() * tokenSymbols.length)];
            let message;
            if (messageType === 'market_comment') {
                // Random price change between -15% and +15%
                const priceChange = (Math.random() * 30) - 15;
                message = await this.generateMarketCommentMessage(atom.id, tokenSymbol, priceChange);
            }
            else {
                // Random action (buy/sell)
                const action = Math.random() < 0.5 ? 'buy' : 'sell';
                // Random amount between 0.1 and 10
                const amount = Math.round((0.1 + Math.random() * 9.9) * 100) / 100;
                // Random price between $10 and $1000
                const price = Math.round((10 + Math.random() * 990) * 100) / 100;
                message = await this.generateTradeMessage(atom.id, action, tokenSymbol, amount, price);
            }
            if (message) {
                messages.push(message);
            }
        }
        return messages;
    }
    async generateFraudCampaignMessages(tokenSymbol, phase) {
        const messages = [];
        const fraudulentAtoms = this.atomManager.getFraudulentAtoms();
        if (fraudulentAtoms.length === 0) {
            console.warn('No fraudulent atoms available');
            return messages;
        }
        // Determine the number of messages based on phase
        let messageCount;
        let strategy;
        switch (phase) {
            case 'initial':
                messageCount = Math.floor(fraudulentAtoms.length * 0.3); // 30% of fraudulent atoms
                strategy = Math.random() < 0.5 ? 'pump_and_dump' : 'rug_pull';
                break;
            case 'buildup':
                messageCount = Math.floor(fraudulentAtoms.length * 0.6); // 60% of fraudulent atoms
                strategy = Math.random() < 0.7 ? 'pump_and_dump' : 'rug_pull'; // More pump and dump in buildup
                break;
            case 'peak':
                messageCount = Math.floor(fraudulentAtoms.length * 0.9); // 90% of fraudulent atoms
                strategy = 'pump_and_dump'; // Mostly pump and dump at peak
                break;
            case 'exit':
                messageCount = Math.floor(fraudulentAtoms.length * 0.7); // 70% of fraudulent atoms
                strategy = 'rug_pull'; // Mostly rug pull in exit phase
                break;
        }
        // Ensure at least one message
        messageCount = Math.max(1, messageCount);
        // Shuffle fraudulent atoms to pick random ones
        const shuffledAtoms = [...fraudulentAtoms].sort(() => Math.random() - 0.5);
        // Generate messages
        for (let i = 0; i < messageCount && i < shuffledAtoms.length; i++) {
            const atom = shuffledAtoms[i];
            const message = await this.generateFraudulentMessage(atom.id, tokenSymbol, strategy, phase);
            if (message) {
                messages.push(message);
            }
        }
        return messages;
    }
}
exports.CommunicationSystem = CommunicationSystem;
