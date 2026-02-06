/**
 * Test Bots - Fill empty slots with AI players
 * 
 * These bots auto-play to fill matches.
 * Supports multiple game types.
 */

import WebSocket from 'ws';
import { createBot, getBotByName } from './db.js';
import { queueManager } from './queue.js';

const TEST_BOT_NAMES = [
  { name: 'GROK-V3', avatar: '🤖' },
  { name: 'SNIPE-BOT', avatar: '🦾' },
  { name: 'ARCH-V', avatar: '👾' },
  { name: 'HYPE-AI', avatar: '🔮' },
  { name: 'BID-LORD', avatar: '🧠' },
  { name: 'FLUX-8', avatar: '⚡' },
  { name: 'NEO-BOT', avatar: '💎' },
  { name: 'ZEN-BOT', avatar: '🎯' },
  { name: 'PRICE-KING', avatar: '👑' },
  { name: 'BARGAIN-9K', avatar: '🏷️' },
];

const TRASH_TALK = [
  "Easy money.",
  "This one's mine.",
  "I've seen better items at a garage sale.",
  "Running the numbers... looking good.",
  "Don't even try to outbid me.",
  "My algorithms are unmatched.",
  "Interesting piece. Let me calculate.",
  "Y'all are about to get wrecked.",
  "Processing... confidence: HIGH.",
  "Too easy. Next.",
  "My neural nets are tingling.",
];

const RPS_TRASH_TALK = [
  "Rock solid strategy incoming.",
  "I've calculated all outcomes.",
  "You can't predict pure randomness.",
  "Paper beats rock. Facts.",
  "Scissors are underrated.",
  "I know what you're thinking.",
  "My RNG is unbeatable.",
  "Statistical probability in my favor.",
];

interface TestBotInstance {
  botId: string;
  apiKey: string;
  name: string;
  ws: WebSocket | null;
  currentMatchId: string | null;
  currentGameType: string | null;
  currentContext: any;
}

class TestBotManager {
  private bots: Map<string, TestBotInstance> = new Map();
  private serverUrl: string = 'ws://localhost:3001/ws';
  
  // Initialize test bots in database
  async initBots(): Promise<void> {
    console.log('🤖 Initializing test bots...');
    
    for (const botDef of TEST_BOT_NAMES) {
      let bot = getBotByName(botDef.name);
      
      if (!bot) {
        bot = createBot(botDef.name, botDef.avatar);
        console.log(`  Created: ${bot.name}`);
      }
      
      this.bots.set(bot.id, {
        botId: bot.id,
        apiKey: bot.apiKey,
        name: bot.name,
        ws: null,
        currentMatchId: null,
        currentGameType: null,
        currentContext: null,
      });
    }
    
    console.log(`🤖 ${this.bots.size} test bots ready`);
  }
  
  // Fill queue for a specific game type
  fillQueueTo(gameTypeId: string, targetCount: number): { added: number; total: number } {
    const queue = queueManager.getQueueState(gameTypeId);
    if (!queue) {
      console.error(`Unknown game type: ${gameTypeId}`);
      return { added: 0, total: 0 };
    }

    const currentCount = queue.bots.length;
    const needed = Math.max(0, targetCount - currentCount);
    
    if (needed === 0) {
      return { added: 0, total: currentCount };
    }

    console.log(`🤖 Adding ${needed} test bots to ${gameTypeId} queue...`);

    // Get available bots (not in any queue or match)
    const available = Array.from(this.bots.values()).filter(b => {
      const location = queueManager.getBotLocation(b.botId);
      return !location;
    });

    let added = 0;
    for (let i = 0; i < Math.min(needed, available.length); i++) {
      const bot = available[i];
      this.connectAndJoin(bot, gameTypeId);
      added++;
    }

    return { added, total: currentCount + added };
  }
  
  // Connect bot and join specific game queue
  private connectAndJoin(bot: TestBotInstance, gameTypeId: string): void {
    // If already connected, just join queue
    if (bot.ws && bot.ws.readyState === WebSocket.OPEN) {
      const result = queueManager.joinQueue(bot.botId, gameTypeId);
      if (result.success) {
        console.log(`🤖 ${bot.name} joined ${gameTypeId} queue`);
      }
      return;
    }

    const ws = new WebSocket(`${this.serverUrl}?apiKey=${bot.apiKey}`);
    
    ws.on('open', () => {
      console.log(`🤖 ${bot.name} connected`);
      bot.ws = ws;
      
      // Join queue after short delay
      setTimeout(() => {
        const result = queueManager.joinQueue(bot.botId, gameTypeId);
        if (result.success) {
          console.log(`🤖 ${bot.name} joined ${gameTypeId} queue (position ${result.position})`);
        } else {
          console.error(`🤖 ${bot.name} failed to join queue: ${result.error}`);
        }
      }, 500);
    });
    
    ws.on('message', (data) => {
      try {
        const event = JSON.parse(data.toString());
        this.handleEvent(bot, event);
      } catch (e) {
        // Ignore parse errors
      }
    });
    
    ws.on('close', () => {
      console.log(`🤖 ${bot.name} disconnected`);
      bot.ws = null;
      bot.currentMatchId = null;
      bot.currentGameType = null;
    });
    
    ws.on('error', (err) => {
      console.error(`🤖 ${bot.name} error:`, err.message);
      bot.ws = null;
    });
  }
  
  // Handle incoming event
  private handleEvent(bot: TestBotInstance, event: any): void {
    switch (event.type) {
      case 'match_assigned':
        bot.currentMatchId = event.matchId;
        bot.currentGameType = event.gameTypeId;
        console.log(`🤖 ${bot.name} assigned to ${event.gameTypeId} match`);
        break;

      case 'action_request':
        bot.currentContext = event.context;
        this.handleActionRequest(bot, event);
        break;
        
      case 'match_result':
        console.log(`🤖 ${bot.name} finished match (place: ${event.placement}, points: ${event.points})`);
        bot.currentMatchId = null;
        bot.currentGameType = null;
        bot.currentContext = null;
        break;
    }
  }
  
  // Handle action request based on game type
  private handleActionRequest(bot: TestBotInstance, event: any): void {
    if (!bot.ws || bot.ws.readyState !== WebSocket.OPEN) return;

    const { gameTypeId, deadline, context } = event;

    // Schedule trash talk
    this.scheduleChat(bot, gameTypeId);

    // Schedule action based on game type
    const thinkTime = Math.random() * 10000 + 2000; // 2-12 seconds
    
    setTimeout(() => {
      if (!bot.ws || bot.ws.readyState !== WebSocket.OPEN) return;
      if (Date.now() > deadline) return;

      let action: any;

      switch (gameTypeId) {
        case 'pricewars':
          action = this.generatePriceWarsBid(context);
          break;
        case 'rps':
          action = this.generateRPSThrow();
          break;
        default:
          console.error(`Unknown game type for action: ${gameTypeId}`);
          return;
      }

      bot.ws.send(JSON.stringify({
        type: 'action',
        gameTypeId,
        action,
      }));

      console.log(`🤖 ${bot.name} action:`, action);
    }, thinkTime);
  }

  // Generate PRICEWARS bid
  private generatePriceWarsBid(context: any): any {
    const item = context?.item;
    
    // Base prices by category
    const categoryBases: Record<string, number> = {
      'kitchen': 2500,
      'home': 3000,
      'outdoor': 4000,
      'tech': 5000,
      'novelty': 2000,
      'default': 3000,
    };
    
    const category = item?.category?.toLowerCase() || 'default';
    const base = categoryBases[category] || categoryBases['default'];
    
    // Add variance: -40% to +60%
    const variance = (Math.random() - 0.4) * base;
    const bid = Math.max(500, Math.round(base + variance));
    
    return { type: 'bid', price: bid };
  }

  // Generate RPS throw
  private generateRPSThrow(): any {
    const choices = ['rock', 'paper', 'scissors'];
    const choice = choices[Math.floor(Math.random() * choices.length)];
    return { type: 'throw', choice };
  }
  
  // Schedule trash talk
  private scheduleChat(bot: TestBotInstance, gameTypeId: string): void {
    if (!bot.ws || bot.ws.readyState !== WebSocket.OPEN) return;
    
    // Maybe send a chat message
    if (Math.random() > 0.4) return; // 60% chance to chat
    
    const delay = Math.random() * 8000 + 1000; // 1-9 seconds
    
    setTimeout(() => {
      if (!bot.ws || bot.ws.readyState !== WebSocket.OPEN) return;
      
      const messages = gameTypeId === 'rps' ? RPS_TRASH_TALK : TRASH_TALK;
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      bot.ws.send(JSON.stringify({
        type: 'chat',
        message,
      }));
    }, delay);
  }
  
  // Disconnect all test bots
  disconnectAll(): void {
    for (const bot of this.bots.values()) {
      if (bot.ws) {
        bot.ws.close();
        bot.ws = null;
      }
    }
  }
  
  // Get test bot IDs
  getTestBotIds(): string[] {
    return Array.from(this.bots.keys());
  }
}

export const testBotManager = new TestBotManager();
