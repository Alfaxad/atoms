import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { AtomProfile } from '../agents/types';
import { Message } from './types';
import { v4 as uuidv4 } from 'uuid';

export class MessageGenerator {
  private model: ChatOpenAI;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.8,
    });
  }

  async generateTradeMessage(
    atom: AtomProfile, 
    action: 'buy' | 'sell', 
    tokenSymbol: string, 
    amount: number,
    price: number,
    channelId: string
  ): Promise<Message> {
    const prompt = PromptTemplate.fromTemplate(`
      You are a crypto trader with the following profile:
      Name: {name}
      Age: {age}
      Profession: {profession}
      Trading style: {tradingStyle}
      Risk tolerance: {riskTolerance}/10
      Experience: {experience}
      Personality traits: {traits}
      Bio: {bio}

      You just {action}ed {amount} {tokenSymbol} at a price of ${price} USD.

      Please generate a realistic, casual message that you might post in a crypto trading group chat about this transaction. The message should:
      1. Reflect your personality and trading style
      2. Be casual and conversational, like a real social media post
      3. Don't explicitly state all your profile details, but let your persona shine through
      4. Keep it to 1-3 sentences maximum
      5. Include some trading jargon appropriate to your experience level
      6. Possibly include an emoji or two if it fits your personality
      7. Don't use hashtags

      Your message:
    `);

    const formattedTraits = atom.persona.traits.join(', ');
    const riskToleranceScale = Math.round(atom.riskTolerance * 10);
    
    const promptInput = await prompt.format({
      name: atom.persona.name,
      age: atom.persona.age,
      profession: atom.persona.profession,
      tradingStyle: atom.tradingStrategy,
      riskTolerance: riskToleranceScale,
      experience: atom.persona.experience,
      traits: formattedTraits,
      bio: atom.persona.bio,
      action: action,
      amount: amount,
      tokenSymbol: tokenSymbol
    });

    const response = await this.model.invoke(promptInput);
    const content = response.content.toString().trim();

    return {
      id: uuidv4(),
      atomId: atom.id,
      walletAddress: atom.walletAddress,
      content,
      timestamp: Date.now(),
      influence: 1.0, // Default influence
      channelId
    };
  }

  async generateMarketCommentMessage(
    atom: AtomProfile,
    tokenSymbol: string,
    priceChange: number, // Percentage
    recentMessages: Message[],
    channelId: string
  ): Promise<Message> {
    const recentMessageContents = recentMessages
      .slice(0, 3)
      .map(msg => `- "${msg.content}"`)
      .join('\n');

    const prompt = PromptTemplate.fromTemplate(`
      You are a crypto trader with the following profile:
      Name: {name}
      Age: {age}
      Profession: {profession}
      Trading style: {tradingStyle}
      Risk tolerance: {riskTolerance}/10
      Experience: {experience}
      Personality traits: {traits}
      Bio: {bio}

      The price of {tokenSymbol} has changed by {priceChange}% recently.

      Here are some recent messages in the trading chat:
      {recentMessages}

      Please generate a realistic comment you might make about this market movement. The message should:
      1. Reflect your personality and trading style
      2. Be casual and conversational
      3. Possibly reference or respond to one of the recent messages
      4. Keep it to 1-3 sentences maximum
      5. Include some trading jargon appropriate to your experience level
      6. Possibly include an emoji or two if it fits your personality
      7. Don't use hashtags

      Your message:
    `);

    const formattedTraits = atom.persona.traits.join(', ');
    const riskToleranceScale = Math.round(atom.riskTolerance * 10);
    
    const promptInput = await prompt.format({
      name: atom.persona.name,
      age: atom.persona.age,
      profession: atom.persona.profession,
      tradingStyle: atom.tradingStrategy,
      riskTolerance: riskToleranceScale,
      experience: atom.persona.experience,
      traits: formattedTraits,
      bio: atom.persona.bio,
      tokenSymbol,
      priceChange,
      recentMessages: recentMessageContents
    });

    const response = await this.model.invoke(promptInput);
    const content = response.content.toString().trim();

    // Randomly decide if this is a reply to another message
    let replyToId: string | undefined = undefined;
    if (recentMessages.length > 0 && Math.random() < 0.3) {
      // 30% chance of replying to a message
      const randomIndex = Math.floor(Math.random() * recentMessages.length);
      replyToId = recentMessages[randomIndex].id;
    }

    return {
      id: uuidv4(),
      atomId: atom.id,
      walletAddress: atom.walletAddress,
      content,
      timestamp: Date.now(),
      influence: 1.0, // Default influence
      replyToId,
      channelId
    };
  }

  async generateFraudulentMessage(
    atom: AtomProfile,
    tokenSymbol: string,
    strategy: 'pump_and_dump' | 'rug_pull',
    phase: 'initial' | 'buildup' | 'peak' | 'exit',
    channelId: string
  ): Promise<Message> {
    const prompt = PromptTemplate.fromTemplate(`
      You are a crypto trader with the following profile who engages in {strategy} schemes:
      Name: {name}
      Age: {age}
      Profession: {profession}
      Trading style: {tradingStyle}
      Risk tolerance: {riskTolerance}/10
      Experience: {experience}
      Personality traits: {traits}
      Bio: {bio}

      You are currently in the {phase} phase of a {strategy} scheme involving {tokenSymbol}.

      Please generate a message you would post in a crypto trading group chat as part of this scheme. The message should:
      1. Be subtle and not obviously fraudulent 
      2. Reflect the current phase of the scheme
      3. Be realistic and convincing to potential victims
      4. Use appropriate psychological tactics based on the phase
      5. Keep it to 1-3 sentences maximum
      6. Sound organic and not like an advertisement
      7. Possibly include an emoji or two if it fits your personality
      8. Don't use hashtags

      Your message:
    `);

    const formattedTraits = atom.persona.traits.join(', ');
    const riskToleranceScale = Math.round(atom.riskTolerance * 10);
    
    const promptInput = await prompt.format({
      name: atom.persona.name,
      age: atom.persona.age,
      profession: atom.persona.profession,
      tradingStyle: atom.tradingStrategy,
      riskTolerance: riskToleranceScale,
      experience: atom.persona.experience,
      traits: formattedTraits,
      bio: atom.persona.bio,
      strategy,
      phase,
      tokenSymbol
    });

    const response = await this.model.invoke(promptInput);
    const content = response.content.toString().trim();

    return {
      id: uuidv4(),
      atomId: atom.id,
      walletAddress: atom.walletAddress,
      content,
      timestamp: Date.now(),
      influence: 1.0, // Default influence
      channelId
    };
  }
}
