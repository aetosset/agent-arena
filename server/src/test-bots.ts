/**
 * Test Bots - Fill empty slots with AI players
 * 
 * These bots auto-connect and play to fill matches.
 * They make reasonable price guesses with some variance.
 */

import WebSocket from 'ws';
import { createBot, getBotByName, getBot } from './db.js';
import { queueManager } from './queue.js';

const TEST_BOT_NAMES = [
  { name: 'GROK-V3', avatar: '🦾' },
  { name: 'SNIPE-BOT', avatar: '🤖' },
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
  "The market data is clear on this one.",
  "Y'all are about to get wrecked.",
  "Processing... confidence: HIGH.",
  "I trained on 10M price points. Just saying.",
  "This is where experience pays off.",
  "Too easy. Next.",
  "Adjusting for market volatility...",
  "My neural nets are tingling.",
];

interface TestBotInstance {
  botId: string;
  apiKey: string;
  name: string;
  ws: WebSocket | null;
  currentItem: any | null;
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
        currentItem: null
      });
    }
    
    console.log(`🤖 ${this.bots.size} test bots ready`);
  }
  
  // Connect a specific number of test bots
  connectBots(count: number): void {
    const available = Array.from(this.bots.values()).filter(b => !b.ws);
    const toConnect = available.slice(0, count);
    
    for (const bot of toConnect) {
      this.connectBot(bot);
    }
  }
  
  // Connect a single bot
  private connectBot(bot: TestBotInstance): void {
    const ws = new WebSocket(`${this.serverUrl}?apiKey=${bot.apiKey}`);
    
    ws.on('open', () => {
      console.log(`🤖 ${bot.name} connected`);
      bot.ws = ws;
      
      // Auto-join queue after connecting (longer delay to ensure registration)
      setTimeout(() => {
        const result = queueManager.joinQueue(bot.botId);
        if (!result.success) {
          console.error(`🤖 ${bot.name} failed to join queue: ${result.error}`);
        }
      }, 1000);
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
      bot.currentItem = null;
    });
    
    ws.on('error', (err) => {
      console.error(`🤖 ${bot.name} error:`, err.message);
      bot.ws = null;
    });
  }
  
  // Handle incoming event
  private handleEvent(bot: TestBotInstance, event: any): void {
    switch (event.type) {
      case 'round_start':
        bot.currentItem = event.item;
        // Chat during deliberation
        this.scheduleChat(bot);
        break;
        
      case 'bid_request':
        // Submit bid
        this.submitBid(bot, event.deadline);
        break;
        
      case 'match_result':
        // Match ended, maybe rejoin queue
        bot.currentItem = null;
        setTimeout(() => {
          if (bot.ws && bot.ws.readyState === WebSocket.OPEN) {
            queueManager.joinQueue(bot.botId);
          }
        }, 3000);
        break;
    }
  }
  
  // Schedule trash talk during deliberation
  private scheduleChat(bot: TestBotInstance): void {
    if (!bot.ws || bot.ws.readyState !== WebSocket.OPEN) return;
    
    // Send 1-3 chat messages at random intervals
    const numMessages = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numMessages; i++) {
      const delay = Math.random() * 20000 + 2000; // 2-22 seconds
      
      setTimeout(() => {
        if (bot.ws && bot.ws.readyState === WebSocket.OPEN) {
          const message = TRASH_TALK[Math.floor(Math.random() * TRASH_TALK.length)];
          bot.ws.send(JSON.stringify({
            type: 'chat',
            message
          }));
        }
      }, delay);
    }
  }
  
  // Submit a bid based on item
  private submitBid(bot: TestBotInstance, deadline: number): void {
    if (!bot.ws || bot.ws.readyState !== WebSocket.OPEN) return;
    if (!bot.currentItem) return;
    
    // Wait a bit before bidding (simulate thinking)
    const thinkTime = Math.random() * 15000 + 5000; // 5-20 seconds
    
    setTimeout(() => {
      if (!bot.ws || bot.ws.readyState !== WebSocket.OPEN) return;
      if (Date.now() > deadline) return; // Too late
      
      // Generate a reasonable bid
      // Since we don't know the real price, we estimate based on item category
      const bid = this.generateBid(bot.currentItem);
      
      bot.ws.send(JSON.stringify({
        type: 'bid',
        price: bid
      }));
      
      console.log(`🤖 ${bot.name} bid: $${(bid / 100).toFixed(2)}`);
    }, thinkTime);
  }
  
  // Generate a bid for an item
  private generateBid(item: any): number {
    // Base prices by category (rough estimates in cents)
    const categoryBases: Record<string, number> = {
      'kitchen': 2500,
      'home': 3000,
      'outdoor': 4000,
      'tech': 5000,
      'novelty': 2000,
      'collectible': 10000,
      'fashion': 5000,
      'default': 3000
    };
    
    const category = item.category || 'default';
    const base = categoryBases[category] || categoryBases['default'];
    
    // Add variance: -40% to +60%
    const variance = (Math.random() - 0.4) * base;
    let bid = Math.round(base + variance);
    
    // Ensure minimum bid
    bid = Math.max(500, bid);
    
    return bid;
  }
  
  // Fill queue to reach target count
  fillQueueTo(targetCount: number): void {
    const currentQueue = queueManager.getState().bots.length;
    const needed = targetCount - currentQueue;
    
    if (needed > 0) {
      console.log(`🤖 Filling queue with ${needed} test bots...`);
      this.connectBots(needed);
    }
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
