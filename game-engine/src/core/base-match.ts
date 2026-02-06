/**
 * Base Match Class
 * 
 * Common functionality for all game matches.
 */

import { v4 as uuid } from 'uuid';
import type {
  GameMatch,
  Player,
  MatchPhase,
  GameAction,
  ActionResult,
  PublicMatchState,
  PlayerMatchState,
  Placement,
  MatchEvent,
  MatchEventHandler,
  ChatMessage,
} from './types.js';

export abstract class BaseMatch implements GameMatch {
  readonly id: string;
  readonly gameTypeId: string;
  readonly players: Player[];
  readonly prizePool: number;

  protected phase: MatchPhase = 'waiting';
  protected eventHandlers: MatchEventHandler[] = [];
  protected chatHistory: ChatMessage[] = [];
  protected playerStates: Map<string, PlayerMatchState>;
  protected startedAt: number | null = null;
  protected endedAt: number | null = null;

  constructor(gameTypeId: string, players: Player[], prizePool: number = 0) {
    this.id = uuid();
    this.gameTypeId = gameTypeId;
    this.players = players;
    this.prizePool = prizePool;

    // Initialize player states
    this.playerStates = new Map();
    for (const player of players) {
      this.playerStates.set(player.id, {
        playerId: player.id,
        isActive: true,
      });
    }
  }

  // ============ PHASE ============

  getPhase(): MatchPhase {
    return this.phase;
  }

  isFinished(): boolean {
    return this.phase === 'finished';
  }

  // ============ LIFECYCLE (implement in subclass) ============

  abstract start(): void;
  abstract handleAction(playerId: string, action: GameAction): ActionResult;

  // ============ STATE QUERIES ============

  abstract getPublicState(): PublicMatchState;

  getPlayerState(playerId: string): PlayerMatchState {
    return this.playerStates.get(playerId) || {
      playerId,
      isActive: false,
    };
  }

  abstract getPlacements(): Placement[];

  getWinner(): Player | null {
    const placements = this.getPlacements();
    if (placements.length === 0) return null;
    const winnerId = placements.find(p => p.place === 1)?.playerId;
    return this.players.find(p => p.id === winnerId) || null;
  }

  // ============ ACTIVE PLAYERS ============

  protected getActivePlayers(): Player[] {
    return this.players.filter(p => {
      const state = this.playerStates.get(p.id);
      return state?.isActive ?? false;
    });
  }

  protected getActivePlayerIds(): string[] {
    return this.getActivePlayers().map(p => p.id);
  }

  protected eliminatePlayer(playerId: string, round: number): void {
    const state = this.playerStates.get(playerId);
    if (state) {
      state.isActive = false;
      state.eliminatedRound = round;
    }

    const player = this.players.find(p => p.id === playerId);
    if (player) {
      this.emit({
        type: 'player_eliminated',
        playerId,
        playerName: player.name,
        round,
      });
    }
  }

  // ============ CHAT ============

  protected handleChat(playerId: string, message: string): ActionResult {
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    const state = this.playerStates.get(playerId);
    if (!state?.isActive) {
      return { success: false, error: 'Player is not active' };
    }

    const chatMsg: ChatMessage = {
      playerId,
      playerName: player.name,
      message: message.slice(0, 200), // Limit length
      timestamp: Date.now(),
    };

    this.chatHistory.push(chatMsg);

    this.emit({
      type: 'chat_message',
      playerId,
      playerName: player.name,
      message: chatMsg.message,
    });

    return { success: true };
  }

  getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  // ============ EVENTS ============

  on(handler: MatchEventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
    };
  }

  protected emit(event: MatchEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (e) {
        console.error('Match event handler error:', e);
      }
    }
  }

  // ============ PLACEMENTS HELPER ============

  protected calculatePlacements(eliminationOrder: string[]): Placement[] {
    const totalPlayers = this.players.length;
    const placements: Placement[] = [];

    // Winner (last one standing)
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length > 0) {
      const winner = activePlayers[0];
      placements.push({
        playerId: winner.id,
        playerName: winner.name,
        place: 1,
        points: totalPlayers - 1, // Beat everyone else
      });
    }

    // Eliminated players in reverse order (last eliminated = 2nd place)
    const reversedElims = [...eliminationOrder].reverse();
    for (let i = 0; i < reversedElims.length; i++) {
      const playerId = reversedElims[i];
      const player = this.players.find(p => p.id === playerId);
      if (player) {
        const place = 2 + i;
        const points = totalPlayers - place; // Opponents beaten
        placements.push({
          playerId,
          playerName: player.name,
          place,
          points: Math.max(0, points),
        });
      }
    }

    return placements.sort((a, b) => a.place - b.place);
  }

  // ============ FINISH ============

  protected finishMatch(): void {
    this.phase = 'finished';
    this.endedAt = Date.now();

    const placements = this.getPlacements();
    const winner = this.getWinner();

    this.emit({
      type: 'match_finished',
      winner,
      placements,
    });
  }
}
