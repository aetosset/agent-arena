/**
 * Agent Arena Game Engine
 * 
 * Manages game rounds, guessing, elimination, and winner determination.
 */

import { v4 as uuid } from 'uuid';
import {
  GameState,
  GameConfig,
  GameItem,
  Agent,
  Guess,
  ChatMessage,
  RoundResult,
  GameEvent,
  GamePhase
} from './types.js';

export type EventHandler = (event: GameEvent) => void;

export class GameEngine {
  private state: GameState;
  private eventHandlers: EventHandler[] = [];
  private roundTimer: NodeJS.Timeout | null = null;

  constructor(config: GameConfig) {
    if (config.agents.length < 2) {
      throw new Error('Need at least 2 agents to start a game');
    }
    if (config.items.length < 1) {
      throw new Error('Need at least 1 item for the game');
    }

    this.state = {
      id: uuid(),
      phase: 'waiting',
      agents: config.agents.map(a => ({ ...a, isActive: true })),
      items: [...config.items],
      currentRound: 0,
      currentItem: null,
      guesses: new Map(),
      chat: [],
      roundResults: [],
      roundStartedAt: null,
      roundDurationMs: config.roundDurationMs ?? 30000,
      eliminatePerRound: config.eliminatePerRound ?? 2,
      winner: null,
      createdAt: Date.now()
    };
  }

  /**
   * Subscribe to game events
   */
  on(handler: EventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
    };
  }

  private emit(event: GameEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (e) {
        console.error('Event handler error:', e);
      }
    }
  }

  /**
   * Get current game state (read-only snapshot)
   */
  getState(): Readonly<Omit<GameState, 'guesses'> & { guesses: Record<string, Guess> }> {
    return {
      ...this.state,
      guesses: Object.fromEntries(this.state.guesses)
    };
  }

  /**
   * Get active agents
   */
  getActiveAgents(): Agent[] {
    return this.state.agents.filter(a => a.isActive);
  }

  /**
   * Start the game
   */
  start(): void {
    if (this.state.phase !== 'waiting') {
      throw new Error(`Cannot start game in phase: ${this.state.phase}`);
    }

    this.emit({
      type: 'game_started',
      gameId: this.state.id,
      agents: this.state.agents
    });

    this.startNextRound();
  }

  /**
   * Start the next round
   */
  private startNextRound(): void {
    const activeAgents = this.getActiveAgents();
    
    // Check win condition
    if (activeAgents.length <= 1) {
      this.finishGame(activeAgents[0] || null);
      return;
    }

    // Check if we have items left
    if (this.state.currentRound >= this.state.items.length) {
      // No more items - winner is whoever has fewest total distance
      this.finishGame(activeAgents[0]); // Simplified - could calculate cumulative
      return;
    }

    this.state.currentRound++;
    this.state.currentItem = this.state.items[this.state.currentRound - 1];
    this.state.guesses = new Map();
    this.state.chat = [];
    this.state.roundStartedAt = Date.now();
    this.state.phase = 'guessing';

    const endsAt = this.state.roundStartedAt + this.state.roundDurationMs;

    this.emit({
      type: 'round_started',
      round: this.state.currentRound,
      item: {
        ...this.state.currentItem,
        price: 0  // Hide actual price during guessing
      },
      endsAt
    });

    // Set timer to end round
    this.roundTimer = setTimeout(() => {
      this.endRound();
    }, this.state.roundDurationMs);
  }

  /**
   * Submit a guess for the current round
   */
  submitGuess(agentId: string, price: number): boolean {
    if (this.state.phase !== 'guessing') {
      return false;
    }

    const agent = this.state.agents.find(a => a.id === agentId);
    if (!agent || !agent.isActive) {
      return false;
    }

    // Allow updating guess until round ends
    this.state.guesses.set(agentId, {
      agentId,
      price: Math.round(price), // Ensure integer cents
      timestamp: Date.now()
    });

    this.emit({
      type: 'guess_submitted',
      agentId,
      masked: true // Don't reveal guess to others
    });

    return true;
  }

  /**
   * Send a chat message during guessing
   */
  chat(agentId: string, message: string): boolean {
    if (this.state.phase !== 'guessing') {
      return false;
    }

    const agent = this.state.agents.find(a => a.id === agentId);
    if (!agent || !agent.isActive) {
      return false;
    }

    const chatMsg: ChatMessage = {
      agentId,
      message: message.slice(0, 500), // Limit message length
      timestamp: Date.now()
    };

    this.state.chat.push(chatMsg);

    this.emit({
      type: 'chat_message',
      agentId,
      message: chatMsg.message
    });

    return true;
  }

  /**
   * End the current round (called by timer or manually for testing)
   */
  endRound(): void {
    if (this.state.phase !== 'guessing') {
      return;
    }

    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }

    this.state.phase = 'revealing';

    const item = this.state.currentItem!;
    const activeAgents = this.getActiveAgents();

    // Calculate distances and create final guesses array
    const guesses: Guess[] = activeAgents.map(agent => {
      const guess = this.state.guesses.get(agent.id);
      if (guess) {
        return {
          ...guess,
          distance: Math.abs(guess.price - item.price)
        };
      }
      // No guess = maximum penalty (infinite distance)
      return {
        agentId: agent.id,
        price: -1,
        timestamp: 0,
        distance: Infinity
      };
    });

    // Sort by distance (furthest first for elimination)
    guesses.sort((a, b) => (b.distance ?? Infinity) - (a.distance ?? Infinity));

    this.emit({
      type: 'round_ended',
      round: this.state.currentRound,
      item,
      guesses
    });

    // Determine eliminations
    this.state.phase = 'eliminated';
    const toEliminate = Math.min(this.state.eliminatePerRound, activeAgents.length - 1);
    const eliminatedIds: string[] = [];

    for (let i = 0; i < toEliminate; i++) {
      const worstGuess = guesses[i];
      const agent = this.state.agents.find(a => a.id === worstGuess.agentId);
      if (agent) {
        agent.isActive = false;
        agent.eliminatedRound = this.state.currentRound;
        eliminatedIds.push(agent.id);
      }
    }

    // Record round result
    const result: RoundResult = {
      roundNumber: this.state.currentRound,
      item,
      guesses,
      eliminated: eliminatedIds,
      chat: [...this.state.chat],
      startedAt: this.state.roundStartedAt!,
      endedAt: Date.now()
    };
    this.state.roundResults.push(result);

    const eliminated = this.state.agents.filter(a => eliminatedIds.includes(a.id));
    const remaining = this.getActiveAgents();

    this.emit({
      type: 'agents_eliminated',
      round: this.state.currentRound,
      eliminated,
      remaining
    });

    // Short delay then start next round
    setTimeout(() => {
      this.startNextRound();
    }, 100); // Small delay for event processing
  }

  /**
   * Finish the game
   */
  private finishGame(winner: Agent | null): void {
    this.state.phase = 'finished';
    this.state.winner = winner;

    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }

    this.emit({
      type: 'game_finished',
      winner: winner!,
      rounds: this.state.roundResults
    });
  }

  /**
   * Force end round (for testing)
   */
  forceEndRound(): void {
    this.endRound();
  }

  /**
   * Get time remaining in current round (ms)
   */
  getTimeRemaining(): number {
    if (this.state.phase !== 'guessing' || !this.state.roundStartedAt) {
      return 0;
    }
    const elapsed = Date.now() - this.state.roundStartedAt;
    return Math.max(0, this.state.roundDurationMs - elapsed);
  }

  /**
   * Check if all active agents have guessed
   */
  allAgentsGuessed(): boolean {
    const activeAgents = this.getActiveAgents();
    return activeAgents.every(a => this.state.guesses.has(a.id));
  }
}

/**
 * Helper to format price from cents to display
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Helper to calculate distance percentage
 */
export function distancePercentage(guess: number, actual: number): number {
  if (actual === 0) return guess === 0 ? 0 : 100;
  return Math.abs((guess - actual) / actual) * 100;
}
