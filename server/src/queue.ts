/**
 * Queue Manager
 * 
 * Manages the queue of bots waiting for a match.
 * When 8 bots are queued, triggers match creation.
 */

import type { QueueState, QueuedBot } from './types.js';
import { wsManager } from './websocket.js';
import { getBot, botToPublic } from './db.js';

const BOTS_PER_MATCH = 8;

class QueueManager {
  private queue: QueuedBot[] = [];
  private onMatchReady: ((botIds: string[]) => void) | null = null;

  // Set callback for when match is ready
  setMatchReadyHandler(handler: (botIds: string[]) => void): void {
    this.onMatchReady = handler;
  }

  // Add bot to queue
  joinQueue(botId: string): { success: boolean; error?: string; position?: number } {
    // Check if bot exists
    const bot = getBot(botId);
    if (!bot) {
      return { success: false, error: 'Bot not found' };
    }

    // Check if already in queue
    if (this.queue.find(q => q.botId === botId)) {
      return { success: false, error: 'Bot already in queue' };
    }

    // Check if bot is connected
    if (!wsManager.isBotConnected(botId)) {
      return { success: false, error: 'Bot must be connected via WebSocket to join queue' };
    }

    // Add to queue
    this.queue.push({
      botId,
      joinedAt: Date.now()
    });

    console.log(`📥 ${bot.name} joined queue (${this.queue.length}/${BOTS_PER_MATCH})`);

    // Broadcast queue update
    this.broadcastQueueUpdate();

    // Check if we have enough bots
    if (this.queue.length >= BOTS_PER_MATCH) {
      this.triggerMatchStart();
    }

    return { success: true, position: this.queue.length };
  }

  // Remove bot from queue
  leaveQueue(botId: string): { success: boolean; error?: string } {
    const index = this.queue.findIndex(q => q.botId === botId);
    if (index === -1) {
      return { success: false, error: 'Bot not in queue' };
    }

    this.queue.splice(index, 1);
    console.log(`📤 Bot left queue (${this.queue.length}/${BOTS_PER_MATCH})`);

    this.broadcastQueueUpdate();
    return { success: true };
  }

  // Get current queue state
  getState(): QueueState {
    return {
      bots: [...this.queue],
      matchStartsWhen: BOTS_PER_MATCH,
      estimatedStartTime: this.queue.length >= BOTS_PER_MATCH ? Date.now() : null
    };
  }

  // Get queue with bot details
  getQueueWithDetails(): Array<{ botId: string; name: string; avatar: string; joinedAt: number }> {
    return this.queue.map(q => {
      const bot = getBot(q.botId);
      return {
        botId: q.botId,
        name: bot?.name || 'Unknown',
        avatar: bot?.avatar || 'default',
        joinedAt: q.joinedAt
      };
    });
  }

  // Check if bot is in queue
  isInQueue(botId: string): boolean {
    return this.queue.some(q => q.botId === botId);
  }

  // Get queue position
  getPosition(botId: string): number {
    return this.queue.findIndex(q => q.botId === botId) + 1;
  }

  // Handle bot disconnect - remove from queue
  handleBotDisconnect(botId: string): void {
    const wasInQueue = this.isInQueue(botId);
    if (wasInQueue) {
      this.leaveQueue(botId);
    }
  }

  // Trigger match start
  private triggerMatchStart(): void {
    if (this.queue.length < BOTS_PER_MATCH) return;

    // Take first 8 bots
    const matchBots = this.queue.splice(0, BOTS_PER_MATCH);
    const botIds = matchBots.map(q => q.botId);

    console.log(`🎮 Match starting with ${botIds.length} bots!`);

    // Broadcast that queue is now empty
    this.broadcastQueueUpdate();

    // Trigger match creation
    if (this.onMatchReady) {
      this.onMatchReady(botIds);
    }
  }

  // Broadcast queue update to all spectators
  private broadcastQueueUpdate(): void {
    wsManager.broadcastToSpectators({
      type: 'queue_update',
      queue: this.getState()
    });
  }
}

export const queueManager = new QueueManager();
