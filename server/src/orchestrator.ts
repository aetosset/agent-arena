/**
 * Match Orchestrator
 * 
 * Runs the game loop for a match:
 * 1. Show item (price hidden)
 * 2. Deliberation phase (bots chat)
 * 3. Bid collection
 * 4. Price reveal + elimination
 * 5. Repeat until 1 bot left
 */

import type { Match, MatchRound, MatchItem, RoundBid, RoundChat, BotPublic, BotCommand } from './types.js';
import { wsManager } from './websocket.js';
import { createMatch, updateMatch, getBot, botToPublic, updateBotStats } from './db.js';
import { getRandomRealItems, REAL_ITEMS } from '../../game-engine/src/real-items.js';

// Timing constants (ms)
const ROUND_COUNTDOWN = 5000;        // 5s before round starts
const DELIBERATION_TIME = 30000;     // 30s for chat + bidding
const BID_LOCK_TIME = 5000;          // 5s dramatic bid reveal
const REVEAL_TIME = 5000;            // 5s to show results
const TRANSITION_TIME = 3000;        // 3s between rounds

const ELIMINATE_PER_ROUND = 2;
const ROUNDS_NEEDED = 4;             // 8 -> 6 -> 4 -> 2 -> 1

interface ActiveMatch {
  match: Match;
  bots: Map<string, BotPublic>;
  currentRound: number;
  currentItem: MatchItem | null;
  bids: Map<string, RoundBid>;
  chat: RoundChat[];
  roundStartedAt: number;
  activeBotIds: string[];
  items: MatchItem[];
}

class MatchOrchestrator {
  private activeMatch: ActiveMatch | null = null;

  constructor() {
    // Listen for bot commands
    wsManager.setBotCommandHandler((botId, command) => {
      this.handleBotCommand(botId, command);
    });
  }

  // Start a new match with given bots
  async startMatch(botIds: string[]): Promise<void> {
    if (this.activeMatch) {
      console.error('Match already in progress!');
      return;
    }

    // Create match in DB
    const match = createMatch(botIds);
    match.status = 'live';
    match.startedAt = Date.now();
    updateMatch(match);

    // Load bots
    const bots = new Map<string, BotPublic>();
    for (const botId of botIds) {
      const bot = getBot(botId);
      if (bot) {
        bots.set(botId, botToPublic(bot));
        wsManager.setBotMatch(botId, match.id);
      }
    }

    // Get items for this match
    const items = this.selectItems(ROUNDS_NEEDED);

    this.activeMatch = {
      match,
      bots,
      currentRound: 0,
      currentItem: null,
      bids: new Map(),
      chat: [],
      roundStartedAt: 0,
      activeBotIds: [...botIds],
      items
    };

    console.log(`🏟️ Match ${match.id} starting with ${botIds.length} bots`);

    // Broadcast match starting
    wsManager.broadcastAll({
      type: 'match_starting',
      matchId: match.id,
      bots: Array.from(bots.values()),
      startsIn: ROUND_COUNTDOWN
    }, botIds);

    // Notify bots
    for (const botId of botIds) {
      wsManager.sendToBot(botId, {
        type: 'match_assigned',
        matchId: match.id,
        opponents: Array.from(bots.values()).filter(b => b.id !== botId)
      });
    }

    // Start first round after countdown
    await this.delay(ROUND_COUNTDOWN);
    await this.runRound();
  }

  // Run a single round
  private async runRound(): Promise<void> {
    if (!this.activeMatch) return;

    const am = this.activeMatch;
    am.currentRound++;
    am.bids = new Map();
    am.chat = [];

    // Select item for this round
    const item = am.items[am.currentRound - 1];
    am.currentItem = item;
    am.roundStartedAt = Date.now();

    console.log(`📦 Round ${am.currentRound}: ${item.title} ($${(item.price / 100).toFixed(2)})`);

    // Broadcast round start (price hidden)
    const itemWithoutPrice = { ...item, price: 0 };
    wsManager.broadcastAll({
      type: 'round_start',
      matchId: am.match.id,
      round: am.currentRound,
      item: itemWithoutPrice,
      endsAt: Date.now() + DELIBERATION_TIME
    }, am.activeBotIds);

    // Send to bots
    for (const botId of am.activeBotIds) {
      wsManager.sendToBot(botId, {
        type: 'round_start',
        round: am.currentRound,
        item: itemWithoutPrice,
        endsAt: Date.now() + DELIBERATION_TIME
      });
    }

    // Request bids from bots
    for (const botId of am.activeBotIds) {
      wsManager.sendToBot(botId, {
        type: 'bid_request',
        deadline: Date.now() + DELIBERATION_TIME
      });
    }

    // Wait for deliberation
    await this.delay(DELIBERATION_TIME);

    // Lock bids and reveal
    await this.revealBids();

    // Check if match is over
    if (am.activeBotIds.length <= 1) {
      await this.endMatch();
    } else if (am.currentRound < ROUNDS_NEEDED) {
      // Transition to next round
      await this.delay(TRANSITION_TIME);
      await this.runRound();
    } else {
      // All rounds complete - whoever is left wins
      await this.endMatch();
    }
  }

  // Handle bot command (chat or bid)
  private handleBotCommand(botId: string, command: BotCommand): void {
    if (!this.activeMatch) return;
    if (!this.activeMatch.activeBotIds.includes(botId)) return;

    const am = this.activeMatch;
    const bot = am.bots.get(botId);
    if (!bot) return;

    if (command.type === 'chat') {
      const chatMsg: RoundChat = {
        botId,
        message: command.message.slice(0, 200),
        timestamp: Date.now()
      };
      am.chat.push(chatMsg);

      // Broadcast to spectators
      wsManager.broadcastAll({
        type: 'bot_chat',
        matchId: am.match.id,
        botId,
        botName: bot.name,
        message: chatMsg.message
      }, am.activeBotIds);

      // Send to other bots
      for (const otherId of am.activeBotIds) {
        if (otherId !== botId) {
          wsManager.sendToBot(otherId, {
            type: 'opponent_chat',
            botId,
            botName: bot.name,
            message: chatMsg.message
          });
        }
      }
    } else if (command.type === 'bid') {
      am.bids.set(botId, {
        botId,
        price: Math.round(command.price),
        timestamp: Date.now()
      });

      // Broadcast that bid was locked (not revealed)
      wsManager.broadcastToSpectators({
        type: 'bid_locked',
        matchId: am.match.id,
        botId
      });

      console.log(`💰 ${bot.name} bid: $${(command.price / 100).toFixed(2)}`);
    }
  }

  // Reveal bids and eliminate
  private async revealBids(): Promise<void> {
    if (!this.activeMatch) return;

    const am = this.activeMatch;
    const item = am.currentItem!;

    // Build bids array with distances
    const bidsArray: RoundBid[] = am.activeBotIds.map(botId => {
      const bid = am.bids.get(botId);
      if (bid) {
        return { ...bid, distance: Math.abs(bid.price - item.price) };
      }
      // No bid = max distance
      return { botId, price: -1, timestamp: 0, distance: Infinity };
    });

    // Sort by distance (worst first)
    bidsArray.sort((a, b) => (b.distance ?? Infinity) - (a.distance ?? Infinity));

    // Reveal bids dramatically
    const bidsToReveal = bidsArray.map(b => {
      const bot = am.bots.get(b.botId);
      return { botId: b.botId, botName: bot?.name || 'Unknown', price: b.price };
    }).reverse(); // Show best first

    await this.delay(BID_LOCK_TIME / 2);

    wsManager.broadcastAll({
      type: 'bids_reveal',
      matchId: am.match.id,
      bids: bidsToReveal
    }, am.activeBotIds);

    await this.delay(BID_LOCK_TIME / 2);

    // Reveal actual price
    wsManager.broadcastAll({
      type: 'price_reveal',
      matchId: am.match.id,
      actualPrice: item.price,
      item
    }, am.activeBotIds);

    // Determine eliminations
    const toEliminate = Math.min(ELIMINATE_PER_ROUND, am.activeBotIds.length - 1);
    const eliminated: Array<{ botId: string; botName: string; distance: number }> = [];

    for (let i = 0; i < toEliminate; i++) {
      const worst = bidsArray[i];
      const bot = am.bots.get(worst.botId);
      eliminated.push({
        botId: worst.botId,
        botName: bot?.name || 'Unknown',
        distance: worst.distance ?? Infinity
      });
      am.activeBotIds = am.activeBotIds.filter(id => id !== worst.botId);
    }

    await this.delay(REVEAL_TIME / 2);

    // Broadcast eliminations
    wsManager.broadcastAll({
      type: 'elimination',
      matchId: am.match.id,
      eliminated
    }, [...am.activeBotIds, ...eliminated.map(e => e.botId)]);

    // Notify eliminated bots
    for (const e of eliminated) {
      wsManager.sendToBot(e.botId, {
        type: 'round_result',
        actualPrice: item.price,
        yourBid: am.bids.get(e.botId)?.price ?? -1,
        yourDistance: e.distance,
        eliminated: true
      });
    }

    // Notify surviving bots
    for (const botId of am.activeBotIds) {
      const bid = am.bids.get(botId);
      wsManager.sendToBot(botId, {
        type: 'round_result',
        actualPrice: item.price,
        yourBid: bid?.price ?? -1,
        yourDistance: bid ? Math.abs(bid.price - item.price) : Infinity,
        eliminated: false
      });
    }

    // Record round result
    const roundResult: MatchRound = {
      roundNumber: am.currentRound,
      item,
      bids: bidsArray,
      chat: am.chat,
      eliminated: eliminated.map(e => e.botId),
      startedAt: am.roundStartedAt,
      endedAt: Date.now()
    };
    am.match.rounds.push(roundResult);
    updateMatch(am.match);

    await this.delay(REVEAL_TIME / 2);

    // Broadcast round end
    wsManager.broadcastAll({
      type: 'round_end',
      matchId: am.match.id,
      round: am.currentRound,
      surviving: am.activeBotIds
    }, am.activeBotIds);

    console.log(`❌ Eliminated: ${eliminated.map(e => e.botName).join(', ')}`);
    console.log(`✅ Surviving: ${am.activeBotIds.length} bots`);
  }

  // End the match
  private async endMatch(): Promise<void> {
    if (!this.activeMatch) return;

    const am = this.activeMatch;
    const winnerId = am.activeBotIds[0];
    const winner = am.bots.get(winnerId);

    am.match.status = 'finished';
    am.match.winner = winnerId;
    am.match.endedAt = Date.now();
    updateMatch(am.match);

    // Update bot stats
    const allBotIds = Array.from(am.bots.keys());
    for (let i = 0; i < allBotIds.length; i++) {
      const botId = allBotIds[i];
      // Calculate placement based on when eliminated
      let placement = allBotIds.length;
      for (let r = 0; r < am.match.rounds.length; r++) {
        if (am.match.rounds[r].eliminated.includes(botId)) {
          placement = allBotIds.length - (r * ELIMINATE_PER_ROUND);
          break;
        }
      }
      if (botId === winnerId) placement = 1;
      updateBotStats(botId, placement, botId === winnerId);
    }

    // Build placements
    const placements = allBotIds.map(botId => {
      const bot = am.bots.get(botId);
      let placement = allBotIds.length;
      if (botId === winnerId) placement = 1;
      else {
        for (let r = 0; r < am.match.rounds.length; r++) {
          if (am.match.rounds[r].eliminated.includes(botId)) {
            placement = allBotIds.length - r;
            break;
          }
        }
      }
      return { botId, botName: bot?.name || 'Unknown', placement };
    }).sort((a, b) => a.placement - b.placement);

    console.log(`🏆 Match ended! Winner: ${winner?.name}`);

    // Broadcast match end
    wsManager.broadcastAll({
      type: 'match_end',
      matchId: am.match.id,
      winner: winner!,
      placements
    }, allBotIds);

    // Notify bots
    for (const botId of allBotIds) {
      const p = placements.find(x => x.botId === botId);
      wsManager.sendToBot(botId, {
        type: 'match_result',
        placement: p?.placement || allBotIds.length,
        winner: winnerId
      });
      wsManager.setBotMatch(botId, null);
    }

    this.activeMatch = null;
  }

  // Select items for a match
  private selectItems(count: number): MatchItem[] {
    // Use real items if available, otherwise generate placeholders
    if (REAL_ITEMS && REAL_ITEMS.length >= count) {
      const shuffled = [...REAL_ITEMS].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count).map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        imageUrls: item.imageUrls || [],
        proofUrl: item.proofUrl
      }));
    }

    // Fallback to placeholder items
    return Array(count).fill(null).map((_, i) => ({
      id: `item-${i}`,
      title: `Mystery Item ${i + 1}`,
      price: Math.floor(Math.random() * 50000) + 1000,
      imageUrls: [],
      proofUrl: ''
    }));
  }

  // Helper delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get current match status
  getActiveMatch(): ActiveMatch | null {
    return this.activeMatch;
  }

  isMatchActive(): boolean {
    return this.activeMatch !== null;
  }
}

export const orchestrator = new MatchOrchestrator();
