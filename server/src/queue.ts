/**
 * Multi-Game Queue Manager
 * 
 * Manages one queue per game type.
 * A bot can only be in ONE queue/match at a time across all game types.
 */

import type { QueueState, QueuedBot, BotPublic } from './types.js';
import { getBot, botToPublic } from './db.js';
import { gameRegistry } from '../../game-engine/dist/index.js';

interface QueueManagerEvents {
  onMatchReady: (gameTypeId: string, botIds: string[]) => void;
}

class MultiQueueManager {
  private queues: Map<string, QueueState> = new Map();
  private botLocations: Map<string, string> = new Map(); // botId -> gameTypeId or 'match'
  private events: QueueManagerEvents | null = null;

  constructor() {
    // Initialize queues for all registered game types
    this.initQueues();
  }

  private initQueues(): void {
    const gameTypes = gameRegistry.getAll();
    for (const gt of gameTypes) {
      this.queues.set(gt.id, {
        gameTypeId: gt.id,
        bots: [],
        requiredPlayers: gt.minPlayers,
      });
    }
    console.log(`📋 Initialized ${this.queues.size} game queues`);
  }

  /**
   * Set event handlers
   */
  setEventHandlers(events: QueueManagerEvents): void {
    this.events = events;
  }

  /**
   * Join a specific game queue
   */
  joinQueue(botId: string, gameTypeId: string): { success: boolean; position?: number; error?: string } {
    // Check if game type exists
    if (!this.queues.has(gameTypeId)) {
      return { success: false, error: `Unknown game type: ${gameTypeId}` };
    }

    // Check if bot is already in a queue or match
    const currentLocation = this.botLocations.get(botId);
    if (currentLocation) {
      if (currentLocation === 'match') {
        return { success: false, error: 'Bot is currently in a match' };
      }
      return { success: false, error: `Bot is already in queue for ${currentLocation}` };
    }

    const queue = this.queues.get(gameTypeId)!;

    // Check if already in this queue (shouldn't happen with botLocations check, but safety)
    if (queue.bots.some(b => b.botId === botId)) {
      return { success: false, error: 'Bot already in queue' };
    }

    // Add to queue
    queue.bots.push({
      botId,
      joinedAt: Date.now(),
    });
    this.botLocations.set(botId, gameTypeId);

    console.log(`➕ ${botId} joined ${gameTypeId} queue (${queue.bots.length}/${queue.requiredPlayers})`);

    // Check if queue is ready
    this.checkQueueReady(gameTypeId);

    return { success: true, position: queue.bots.length };
  }

  /**
   * Leave a queue
   */
  leaveQueue(botId: string, gameTypeId?: string): { success: boolean; error?: string } {
    const currentLocation = this.botLocations.get(botId);
    
    if (!currentLocation) {
      return { success: false, error: 'Bot not in any queue' };
    }

    if (currentLocation === 'match') {
      return { success: false, error: 'Cannot leave queue while in match' };
    }

    if (gameTypeId && currentLocation !== gameTypeId) {
      return { success: false, error: `Bot is in ${currentLocation} queue, not ${gameTypeId}` };
    }

    const queue = this.queues.get(currentLocation);
    if (queue) {
      queue.bots = queue.bots.filter(b => b.botId !== botId);
    }
    this.botLocations.delete(botId);

    console.log(`➖ ${botId} left ${currentLocation} queue`);

    return { success: true };
  }

  /**
   * Mark bot as in a match (removes from queue tracking)
   */
  setBotInMatch(botId: string): void {
    const currentLocation = this.botLocations.get(botId);
    if (currentLocation && currentLocation !== 'match') {
      const queue = this.queues.get(currentLocation);
      if (queue) {
        queue.bots = queue.bots.filter(b => b.botId !== botId);
      }
    }
    this.botLocations.set(botId, 'match');
  }

  /**
   * Mark bot as no longer in a match
   */
  setBotMatchEnded(botId: string): void {
    const currentLocation = this.botLocations.get(botId);
    if (currentLocation === 'match') {
      this.botLocations.delete(botId);
    }
  }

  /**
   * Check if a queue has enough players
   */
  private checkQueueReady(gameTypeId: string): void {
    const queue = this.queues.get(gameTypeId);
    if (!queue) return;

    if (queue.bots.length >= queue.requiredPlayers) {
      // Take the required players
      const matchBots = queue.bots.splice(0, queue.requiredPlayers);
      const botIds = matchBots.map(b => b.botId);

      // Mark them as in match
      for (const botId of botIds) {
        this.botLocations.set(botId, 'match');
      }

      console.log(`🎮 ${gameTypeId} queue ready! Starting match with ${botIds.length} bots`);

      // Notify
      if (this.events?.onMatchReady) {
        this.events.onMatchReady(gameTypeId, botIds);
      }
    }
  }

  /**
   * Get queue state for a game type
   */
  getQueueState(gameTypeId: string): QueueState | null {
    return this.queues.get(gameTypeId) || null;
  }

  /**
   * Get all queue states
   */
  getAllQueueStates(): QueueState[] {
    return Array.from(this.queues.values());
  }

  /**
   * Get queue with bot details
   */
  getQueueWithDetails(gameTypeId: string): BotPublic[] {
    const queue = this.queues.get(gameTypeId);
    if (!queue) return [];

    return queue.bots
      .map(qb => {
        const bot = getBot(qb.botId);
        return bot ? botToPublic(bot) : null;
      })
      .filter((b): b is BotPublic => b !== null);
  }

  /**
   * Get where a bot currently is
   */
  getBotLocation(botId: string): string | null {
    return this.botLocations.get(botId) || null;
  }

  /**
   * Refresh queues when game registry updates
   */
  refreshQueues(): void {
    const gameTypes = gameRegistry.getAll();
    for (const gt of gameTypes) {
      if (!this.queues.has(gt.id)) {
        this.queues.set(gt.id, {
          gameTypeId: gt.id,
          bots: [],
          requiredPlayers: gt.minPlayers,
        });
        console.log(`📋 Added queue for new game type: ${gt.id}`);
      }
    }
  }
}

export const queueManager = new MultiQueueManager();
