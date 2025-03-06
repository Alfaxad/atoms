export interface Message {
  id: string;
  atomId: string;
  walletAddress: string;
  content: string;
  timestamp: number;
  influence: number;
  replyToId?: string;
  channelId: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  participants: Set<string>; // Set of atom IDs
}

export interface Relationship {
  atom1Id: string;
  atom2Id: string;
  strength: number; // 0-5, where 5 is strongest
  lastInteraction: number;
}

export interface TopicTrend {
  topic: string;
  strength: number; // 0-1, popularity score
  firstMentioned: number;
  lastMentioned: number;
  mentionCount: number;
}
