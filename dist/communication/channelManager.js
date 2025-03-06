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
exports.ChannelManager = void 0;
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ChannelManager {
    constructor() {
        this.channels = new Map();
        this.messages = new Map();
        this.topicTrends = new Map();
        this.basePath = path.join(process.cwd(), 'data', 'communication');
        // Ensure the communication directory exists
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }
    createChannel(name, description) {
        const id = (0, uuid_1.v4)();
        const channel = {
            id,
            name,
            description,
            createdAt: Date.now(),
            participants: new Set()
        };
        this.channels.set(id, channel);
        this.messages.set(id, []);
        this.topicTrends.set(id, new Map());
        // Save channel to disk
        this.saveChannel(channel);
        return channel;
    }
    getChannel(id) {
        return this.channels.get(id);
    }
    getAllChannels() {
        return Array.from(this.channels.values());
    }
    addParticipant(channelId, atomId) {
        const channel = this.channels.get(channelId);
        if (!channel)
            return false;
        channel.participants.add(atomId);
        // Update channel on disk
        this.saveChannel(channel);
        return true;
    }
    removeParticipant(channelId, atomId) {
        const channel = this.channels.get(channelId);
        if (!channel)
            return false;
        const result = channel.participants.delete(atomId);
        // Update channel on disk
        this.saveChannel(channel);
        return result;
    }
    addMessage(message) {
        const channelId = message.channelId;
        const channelMessages = this.messages.get(channelId);
        if (!channelMessages)
            return false;
        channelMessages.push(message);
        // Update topic trends
        this.updateTopicTrends(message);
        // Save message to disk
        this.saveMessage(message);
        return true;
    }
    getMessages(channelId, limit = 50, offset = 0) {
        const channelMessages = this.messages.get(channelId);
        if (!channelMessages)
            return [];
        // Sort by timestamp (newest first) and apply limit/offset
        return channelMessages
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(offset, offset + limit);
    }
    getMessageById(messageId) {
        for (const channelMessages of this.messages.values()) {
            const message = channelMessages.find(m => m.id === messageId);
            if (message)
                return message;
        }
        return undefined;
    }
    getMessagesByAtom(atomId, limit = 50) {
        const atomMessages = [];
        for (const channelMessages of this.messages.values()) {
            const messages = channelMessages.filter(m => m.atomId === atomId);
            atomMessages.push(...messages);
        }
        // Sort by timestamp (newest first) and apply limit
        return atomMessages
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
    getTopicTrends(channelId, limit = 10) {
        const channelTopics = this.topicTrends.get(channelId);
        if (!channelTopics)
            return [];
        // Sort by strength (highest first) and apply limit
        return Array.from(channelTopics.values())
            .sort((a, b) => b.strength - a.strength)
            .slice(0, limit);
    }
    updateTopicTrends(message) {
        const channelId = message.channelId;
        const channelTopics = this.topicTrends.get(channelId);
        if (!channelTopics)
            return;
        // Extract topics from message
        // This is a simple implementation - in a real system we'd use NLP
        const content = message.content.toLowerCase();
        const words = content.split(/\s+/);
        // Filter out common words and short words
        const stopWords = ['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with'];
        const potentialTopics = words.filter(word => {
            const cleaned = word.replace(/[^\w]/g, '');
            return cleaned.length > 3 && !stopWords.includes(cleaned);
        });
        for (const topic of potentialTopics) {
            const cleanTopic = topic.replace(/[^\w]/g, '');
            if (cleanTopic.length < 3)
                continue;
            // Update existing topic or create new one
            if (channelTopics.has(cleanTopic)) {
                const topicTrend = channelTopics.get(cleanTopic);
                topicTrend.mentionCount += 1;
                topicTrend.lastMentioned = message.timestamp;
                // Update strength based on recency and mention count
                const recencyFactor = Math.exp(-(Date.now() - topicTrend.lastMentioned) / (12 * 60 * 60 * 1000)); // 12 hour half-life
                topicTrend.strength = Math.min(1, 0.3 + (0.7 * recencyFactor * Math.log(topicTrend.mentionCount + 1) / Math.log(50)));
            }
            else {
                channelTopics.set(cleanTopic, {
                    topic: cleanTopic,
                    strength: 0.3, // Initial strength
                    firstMentioned: message.timestamp,
                    lastMentioned: message.timestamp,
                    mentionCount: 1
                });
            }
        }
        // Decay old topics
        for (const [topic, topicTrend] of channelTopics.entries()) {
            const hoursSinceLastMention = (Date.now() - topicTrend.lastMentioned) / (60 * 60 * 1000);
            // Topics not mentioned in 24 hours lose strength
            if (hoursSinceLastMention > 24) {
                topicTrend.strength *= 0.9; // 10% decay per check
                // Remove very weak topics
                if (topicTrend.strength < 0.1) {
                    channelTopics.delete(topic);
                }
            }
        }
    }
    saveChannel(channel) {
        const channelData = {
            ...channel,
            participants: Array.from(channel.participants)
        };
        const filePath = path.join(this.basePath, `channel_${channel.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(channelData, null, 2));
    }
    saveMessage(message) {
        const channelDir = path.join(this.basePath, 'messages', message.channelId);
        // Ensure channel message directory exists
        if (!fs.existsSync(channelDir)) {
            fs.mkdirSync(channelDir, { recursive: true });
        }
        const filePath = path.join(channelDir, `${message.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(message, null, 2));
    }
    async loadChannels() {
        // Clear existing data
        this.channels.clear();
        this.messages.clear();
        this.topicTrends.clear();
        // Find all channel files
        const files = fs.readdirSync(this.basePath).filter(file => file.startsWith('channel_') && file.endsWith('.json'));
        for (const file of files) {
            const filePath = path.join(this.basePath, file);
            const channelData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            // Reconstruct Channel object with Set for participants
            const channel = {
                id: channelData.id,
                name: channelData.name,
                description: channelData.description,
                createdAt: channelData.createdAt,
                participants: new Set(channelData.participants)
            };
            this.channels.set(channel.id, channel);
            this.messages.set(channel.id, []);
            this.topicTrends.set(channel.id, new Map());
            // Load messages for this channel
            const messagesDir = path.join(this.basePath, 'messages', channel.id);
            if (fs.existsSync(messagesDir)) {
                const messageFiles = fs.readdirSync(messagesDir).filter(file => file.endsWith('.json'));
                for (const messageFile of messageFiles) {
                    const messagePath = path.join(messagesDir, messageFile);
                    const message = JSON.parse(fs.readFileSync(messagePath, 'utf-8'));
                    this.messages.get(channel.id).push(message);
                    // Reconstruct topic trends
                    this.updateTopicTrends(message);
                }
            }
        }
        console.log(`Loaded ${this.channels.size} channels with ${Array.from(this.messages.values()).flat().length} messages`);
    }
}
exports.ChannelManager = ChannelManager;
