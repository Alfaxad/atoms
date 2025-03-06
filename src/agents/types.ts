export interface AtomPersona {
  name: string;
  age: number;
  profession: string;
  traits: string[];
  experience: string;
  bio: string;
}

export interface AtomProfile {
  id: string;
  walletAddress: string;
  initialBalance: number;
  persona: AtomPersona;
  riskTolerance: number;
  tradingStrategy: string;
  decisionModel: string;
  fraudulent: boolean;
}

export interface AtomTransaction {
  id: string;
  atomId: string;
  type: 'buy' | 'sell' | 'transfer' | 'deploy' | 'stake';
  tokenSymbol: string;
  amount: number;
  timestamp: number;
  transactionId: string;
  success: boolean;
  errorMessage?: string;
}

export interface AtomMessage {
  id: string;
  atomId: string;
  content: string;
  timestamp: number;
  channelId: string;
  replyToMessageId?: string;
}
