/**
 * Mock Agent for Testing
 * 
 * Generates random guesses and canned chat responses.
 * This is ONLY for testing - will be replaced with real agent integrations.
 */

import { Agent, GameItem } from './types.js';

const CANNED_RESPONSES = [
  "Hmm, this is a tough one...",
  "I've seen these before, I think I know!",
  "No way that's worth more than $500",
  "This screams premium pricing",
  "Going with my gut here",
  "I'm confident about this one",
  "Anyone else think this is overpriced?",
  "Classic misdirection, it's cheaper than it looks",
  "The brand markup on this is insane",
  "I'm locking in my guess now",
  "Good luck everyone!",
  "This round is mine",
  "I have no idea lol",
  "Trust the process",
  "Easy money",
  "🤔",
  "Let's gooo",
  "I've done my research",
  "Market price or MSRP?",
  "Inflation has entered the chat"
];

export class MockAgent {
  readonly agent: Agent;
  private chattiness: number; // 0-1, probability of chatting each tick

  constructor(
    id: string,
    name: string,
    type: string = 'mock',
    chattiness: number = 0.3
  ) {
    this.agent = {
      id,
      name,
      type,
      isActive: true
    };
    this.chattiness = chattiness;
  }

  /**
   * Generate a random guess for an item
   * Uses the item title to somewhat contextualize the guess range
   */
  generateGuess(item: GameItem): number {
    // Determine a reasonable guess range based on item category/title
    let minGuess = 100;     // $1
    let maxGuess = 100000;  // $1000

    const title = item.title.toLowerCase();
    
    if (title.includes('tesla') || title.includes('car')) {
      minGuess = 2000000;   // $20k
      maxGuess = 8000000;   // $80k
    } else if (title.includes('rolex') || title.includes('hermes') || title.includes('birkin')) {
      minGuess = 500000;    // $5k
      maxGuess = 2000000;   // $20k
    } else if (title.includes('iphone') || title.includes('macbook')) {
      minGuess = 50000;     // $500
      maxGuess = 200000;    // $2000
    } else if (title.includes('airpods') || title.includes('switch') || title.includes('ps5')) {
      minGuess = 10000;     // $100
      maxGuess = 60000;     // $600
    } else if (title.includes('dyson')) {
      minGuess = 20000;     // $200
      maxGuess = 100000;    // $1000
    } else if (title.includes('meal') || title.includes('latte') || title.includes('coffee') || title.includes('food')) {
      minGuess = 200;       // $2
      maxGuess = 3000;      // $30
    }

    // Add some randomness
    const range = maxGuess - minGuess;
    const guess = minGuess + Math.floor(Math.random() * range);
    
    // Round to nice numbers
    if (guess > 100000) {
      return Math.round(guess / 10000) * 10000;  // Round to nearest $100
    } else if (guess > 10000) {
      return Math.round(guess / 1000) * 1000;    // Round to nearest $10
    } else if (guess > 1000) {
      return Math.round(guess / 100) * 100;      // Round to nearest $1
    }
    return Math.round(guess / 10) * 10;          // Round to nearest 10 cents
  }

  /**
   * Maybe generate a chat message
   */
  maybeChat(): string | null {
    if (Math.random() > this.chattiness) {
      return null;
    }
    return CANNED_RESPONSES[Math.floor(Math.random() * CANNED_RESPONSES.length)];
  }

  /**
   * Generate response when seeing the reveal
   */
  generateRevealResponse(guessDistance: number, wasEliminated: boolean): string {
    if (wasEliminated) {
      const eliminated = [
        "GG everyone!",
        "Well played",
        "I'll get you next time",
        "So close!",
        "Can't believe I missed that",
        "😭"
      ];
      return eliminated[Math.floor(Math.random() * eliminated.length)];
    }
    
    if (guessDistance < 1000) { // Within $10
      return "Nailed it! 🎯";
    } else if (guessDistance < 5000) { // Within $50
      return "Pretty close!";
    } else {
      return "Phew, survived that one";
    }
  }
}

/**
 * Create a set of mock agents for testing
 */
export function createMockAgents(count: number): MockAgent[] {
  const names = [
    'Lux-Prime', 'GPT-Oracle', 'Claude-Sharp', 'Gemini-Pro',
    'DeepMind-X', 'Llama-King', 'Mistral-Wind', 'Falcon-Eye',
    'Cohere-Bot', 'Palm-Reader', 'Bard-Legacy', 'Copilot-X'
  ];
  
  const types = ['openclaw', 'gpt-4', 'claude', 'gemini', 'llama', 'custom'];
  
  const agents: MockAgent[] = [];
  for (let i = 0; i < count; i++) {
    agents.push(new MockAgent(
      `agent-${i}`,
      names[i % names.length],
      types[i % types.length],
      0.2 + Math.random() * 0.4  // Random chattiness 0.2-0.6
    ));
  }
  
  return agents;
}
