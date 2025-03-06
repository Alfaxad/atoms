import { Message, Channel, TopicTrend } from './types';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export class ChannelManager {
  private channels: Map<string, Channel> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private topicTrends: Map<string, Map<string, TopicTrend>> = new Map();
  private basePath: string;

  constructor() {
    this.basePath = path.join(process.cwd(), 'data', 'communication');
    
    // Ensure the communication directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  createChannel(name: string, description: string): Channel {
    const id = uuidv4();
    const channel: Channel = {
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

  getChannel(id: string): Channel | undefined {
    return this.channels.get(id);
  }

  getAllChannels(): Channel[] {
    return Array.from(this.channels.values());
  }

  addParticipant(channelId: string, atomId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;
    
    channel.participants.add(atomId);
    
    // Update channel on disk
    this.saveChannel(channel);
    
    return true;
  }

  removeParticipant(channelId: string, atomId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;
    
    const result = channel.participants.delete(atomId);
    
    // Update channel on disk
    this.saveChannel(channel);
    
    return result;
  }

  addMessage(message: Message): boolean {
    const channelId = message.channelId;
    const channelMessages = this.messages.get(channelId);
    
    if (!channelMessages) return false;
    
    channelMessages.push(message);
    
    // Update topic trends
    this.updateTopicTrends(message);
    
    // Save message to disk
    this.saveMessage(message);
    
    return true;
  }

  getMessages(channelId: string, limit: number = 50, offset: number = 0): Message[] {
    const channelMessages = this.messages.get(channelId);
    if (!channelMessages) return [];
    
    // Sort by timestamp (newest first) and apply limit/offset
    return channelMessages
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(offset, offset + limit);
  }

  getMessageById(messageId: string): Message | undefined {
    for (const channelMessages of this.messages.values()) {
      const message = channelMessages.find(m => m.id === messageId);
      if (message) return message;
    }
    return undefined;
  }

  getMessagesByAtom(atomId: string, limit: number = 50): Message[] {
    const atomMessages: Message[] = [];
    
    for (const channelMessages of this.messages.values()) {
      const messages = channelMessages.filter(m => m.atomId === atomId);
      atomMessages.push(...messages);
    }
    
    // Sort by timestamp (newest first) and apply limit
    return atomMessages
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getTopicTrends(channelId: string, limit: number = 10): TopicTrend[] {
    const channelTopics = this.topicTrends.get(channelId);
    if (!channelTopics) return [];
    
    // Sort by strength (highest first) and apply limit
    return Array.from(channelTopics.values())
      .sort((a, b) => b.strength - a.strength)
      .slice(0, limit);
  }

  private updateTopicTrends(message: Message): void {
    const channelId = message.channelId;
    const channelTopics = this.topicTrends.get(channelId);
    
    if (!channelTopics) return;
    
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
      
      if (cleanTopic.length < 3) continue;
      
      // Update existing topic or create new one
      if (channelTopics.has(cleanTopic)) {
        const topicTrend = channelTopics.get(cleanTopic)!;
        topicTrend.mentionCount += 1;
        topicTrend.lastMentioned = message.timestamp;
        
        // Update strength based on recency and mention count
        const recencyFactor = Math.exp(-(Date.now() - topicTrend.lastMentioned) / (12 * 60 * 60 * 1000)); // 12 hour half-life
        topicTrend.strength = Math.min(1, 0.3 + (0.7 * recencyFactor * Math.log(topicTrend.mentionCount + 1) / Math.log(50)));
      } else {
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

  private saveChannel(channel: Channel): void {
    const channelData = {
      ...channel,
      participants: Array.from(channel.participants)
    };
    
    const filePath = path.join(this.basePath, `channel_${channel.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(channelData, null, 2));
  }

  private saveMessage(message: Message): void {
    const channelDir = path.join(this.basePath, 'messages', message.channelId);
    
    // Ensure channel message directory exists
    if (!fs.existsSync(channelDir)) {
      fs.mkdirSync(channelDir, { recursive: true });
    }
    
    const filePath = path.join(channelDir, `${message.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(message, null, 2));
  }

  async loadChannels(): Promise<void> {
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
      const channel: Channel = {
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
          const message = JSON.parse(fs.readFileSync(messagePath, 'utf-8')) as Message;
          this.messages.get(channel.id)!.push(message);
          
          // Reconstruct topic trends
          this.updateTopicTrends(message);
        }
      }
    }
    
    console.log(`Loaded ${this.channels.size} channels with ${Array.from(this.messages.values()).flat().length} messages`);
  }
}
