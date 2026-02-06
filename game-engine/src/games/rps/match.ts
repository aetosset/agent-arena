/**
 * Rock Paper Scissors Match Implementation
 */

import { BaseMatch } from '../../core/base-match.js';
import type {
  Player,
  GameAction,
  ActionResult,
  PublicMatchState,
  Placement,
  PlayerPublicInfo,
} from '../../core/types.js';
import type {
  RPSChoice,
  RPSPhase,
  RPSRound,
  RPSConfig,
  RPSAction,
  RPSPublicState,
} from './types.js';
import { getWinner } from './types.js';

const DEFAULT_ROUNDS_TO_WIN = 2;      // Best of 3
const DEFAULT_THROW_DURATION = 15000;
const DEFAULT_REVEAL_DURATION = 3000;
const DEFAULT_BETWEEN_ROUNDS = 2000;

export class RPSMatch extends BaseMatch {
  private roundsToWin: number;
  private scores: Map<string, number> = new Map();
  private currentRound: number = 0;
  private gamePhase: RPSPhase = 'throwing';
  private currentThrows: Map<string, RPSChoice> = new Map();
  private roundResults: RPSRound[] = [];
  private roundStartedAt: number = 0;
  private roundTimer: NodeJS.Timeout | null = null;
  private lastRoundWinner: string | null = null;
  private lastRoundDraw: boolean = false;

  // Config
  private throwDurationMs: number;
  private revealDurationMs: number;
  private betweenRoundsDurationMs: number;

  constructor(players: Player[], prizePool: number, config: RPSConfig = {}) {
    super('rps', players, prizePool);

    if (players.length !== 2) {
      throw new Error('RPS requires exactly 2 players');
    }

    this.roundsToWin = config.roundsToWin ?? DEFAULT_ROUNDS_TO_WIN;
    this.throwDurationMs = config.throwDurationMs ?? DEFAULT_THROW_DURATION;
    this.revealDurationMs = config.revealDurationMs ?? DEFAULT_REVEAL_DURATION;
    this.betweenRoundsDurationMs = config.betweenRoundsDurationMs ?? DEFAULT_BETWEEN_ROUNDS;

    // Initialize scores
    for (const player of players) {
      this.scores.set(player.id, 0);
    }
  }

  // ============ LIFECYCLE ============

  start(): void {
    if (this.phase !== 'waiting') {
      throw new Error('Match already started');
    }

    this.phase = 'active';
    this.startedAt = Date.now();

    this.emit({
      type: 'match_started',
      matchId: this.id,
      players: this.players,
    });

    this.startNextRound();
  }

  private startNextRound(): void {
    // Check win condition
    for (const [playerId, score] of this.scores) {
      if (score >= this.roundsToWin) {
        this.finishMatch();
        return;
      }
    }

    this.currentRound++;
    this.currentThrows = new Map();
    this.roundStartedAt = Date.now();
    this.gamePhase = 'throwing';
    this.lastRoundWinner = null;
    this.lastRoundDraw = false;

    const endsAt = this.roundStartedAt + this.throwDurationMs;

    this.emit({
      type: 'round_started',
      round: this.currentRound,
      endsAt,
      data: {
        scores: Object.fromEntries(this.scores),
      },
    });

    // Timer to end throwing phase
    this.roundTimer = setTimeout(() => {
      this.endThrowing();
    }, this.throwDurationMs);
  }

  private endThrowing(): void {
    if (this.gamePhase !== 'throwing') return;

    this.clearTimer();
    this.gamePhase = 'reveal';

    // If a player didn't throw, they forfeit (random throw or auto-lose?)
    // For now: players who don't throw get random choice
    for (const player of this.players) {
      if (!this.currentThrows.has(player.id)) {
        const choices: RPSChoice[] = ['rock', 'paper', 'scissors'];
        const randomChoice = choices[Math.floor(Math.random() * choices.length)];
        this.currentThrows.set(player.id, randomChoice);
      }
    }

    const [player1, player2] = this.players;
    const throw1 = this.currentThrows.get(player1.id)!;
    const throw2 = this.currentThrows.get(player2.id)!;

    // Determine winner
    const result = getWinner(throw1, throw2);
    let winnerId: string | null = null;
    let isDraw = false;

    if (result === 'draw') {
      isDraw = true;
    } else if (result === 'player1') {
      winnerId = player1.id;
      this.scores.set(player1.id, (this.scores.get(player1.id) ?? 0) + 1);
    } else {
      winnerId = player2.id;
      this.scores.set(player2.id, (this.scores.get(player2.id) ?? 0) + 1);
    }

    this.lastRoundWinner = winnerId;
    this.lastRoundDraw = isDraw;

    // Emit reveal event
    this.emit({
      type: 'game_event',
      event: 'rps_reveal',
      data: {
        throws: Object.fromEntries(this.currentThrows),
        winner: winnerId,
        isDraw,
        scores: Object.fromEntries(this.scores),
      },
    });

    // Record round (only if not a draw)
    const roundResult: RPSRound = {
      roundNumber: this.currentRound,
      throws: Object.fromEntries(this.currentThrows),
      winner: winnerId,
      isDraw,
      startedAt: this.roundStartedAt,
      endedAt: Date.now(),
    };
    this.roundResults.push(roundResult);

    this.emit({
      type: 'round_ended',
      round: this.currentRound,
      data: {
        winner: winnerId,
        isDraw,
        scores: Object.fromEntries(this.scores),
      },
    });

    // After reveal, check if match is over or start next round
    this.roundTimer = setTimeout(() => {
      // If draw, redo round (don't increment round number in display)
      if (isDraw) {
        this.gamePhase = 'between_rounds';
        this.roundTimer = setTimeout(() => {
          this.currentRound--; // Will be incremented back in startNextRound
          this.startNextRound();
        }, this.betweenRoundsDurationMs);
      } else {
        // Check for winner
        const p1Score = this.scores.get(player1.id) ?? 0;
        const p2Score = this.scores.get(player2.id) ?? 0;

        if (p1Score >= this.roundsToWin || p2Score >= this.roundsToWin) {
          this.finishMatch();
        } else {
          this.gamePhase = 'between_rounds';
          this.roundTimer = setTimeout(() => {
            this.startNextRound();
          }, this.betweenRoundsDurationMs);
        }
      }
    }, this.revealDurationMs);
  }

  // ============ ACTIONS ============

  handleAction(playerId: string, action: GameAction): ActionResult {
    const rpsAction = action as RPSAction;

    if (rpsAction.type === 'chat') {
      return this.handleChat(playerId, rpsAction.message);
    }

    if (rpsAction.type === 'throw') {
      return this.handleThrow(playerId, rpsAction.choice);
    }

    return { success: false, error: 'Unknown action type' };
  }

  private handleThrow(playerId: string, choice: RPSChoice): ActionResult {
    if (this.gamePhase !== 'throwing') {
      return { success: false, error: 'Not in throwing phase' };
    }

    const validChoices: RPSChoice[] = ['rock', 'paper', 'scissors'];
    if (!validChoices.includes(choice)) {
      return { success: false, error: 'Invalid choice' };
    }

    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    this.currentThrows.set(playerId, choice);

    this.emit({
      type: 'player_action',
      playerId,
      actionType: 'throw',
      public: false, // Don't reveal choice yet
    });

    // If both players have thrown, end early
    if (this.currentThrows.size === 2) {
      this.clearTimer();
      this.endThrowing();
    }

    return { success: true };
  }

  // ============ STATE QUERIES ============

  getPublicState(): PublicMatchState {
    const showThrows = this.gamePhase === 'reveal' || this.gamePhase === 'between_rounds';

    const currentThrowsPublic: RPSPublicState['currentThrows'] = {};
    for (const player of this.players) {
      const choice = this.currentThrows.get(player.id);
      currentThrowsPublic[player.id] = {
        hasThrown: !!choice,
        choice: showThrows ? choice ?? null : null,
      };
    }

    const gameSpecific: RPSPublicState = {
      phase: this.gamePhase,
      currentRound: this.currentRound,
      roundsToWin: this.roundsToWin,
      scores: Object.fromEntries(this.scores),
      currentThrows: currentThrowsPublic,
      lastRoundWinner: this.lastRoundWinner,
      lastRoundDraw: this.lastRoundDraw,
      roundEndsAt: this.gamePhase === 'throwing'
        ? this.roundStartedAt + this.throwDurationMs
        : null,
    };

    const players: PlayerPublicInfo[] = this.players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isActive: true, // Both players always active until match ends
      display: {
        score: this.scores.get(p.id) ?? 0,
        hasThrown: this.currentThrows.has(p.id),
        throw: showThrows ? this.currentThrows.get(p.id) : undefined,
      },
    }));

    return {
      matchId: this.id,
      gameTypeId: this.gameTypeId,
      phase: this.phase,
      players,
      currentRound: this.currentRound,
      totalRounds: null, // Variable due to draws
      gameSpecific,
    };
  }

  getPlacements(): Placement[] {
    const [player1, player2] = this.players;
    const score1 = this.scores.get(player1.id) ?? 0;
    const score2 = this.scores.get(player2.id) ?? 0;

    if (score1 > score2) {
      return [
        { playerId: player1.id, playerName: player1.name, place: 1, points: 1 },
        { playerId: player2.id, playerName: player2.name, place: 2, points: 0 },
      ];
    } else if (score2 > score1) {
      return [
        { playerId: player2.id, playerName: player2.name, place: 1, points: 1 },
        { playerId: player1.id, playerName: player1.name, place: 2, points: 0 },
      ];
    }

    // Tie (shouldn't happen in best-of-3 but just in case)
    return [
      { playerId: player1.id, playerName: player1.name, place: 1, points: 0 },
      { playerId: player2.id, playerName: player2.name, place: 1, points: 0 },
    ];
  }

  getRoundResults(): RPSRound[] {
    return [...this.roundResults];
  }

  // ============ HELPERS ============

  private clearTimer(): void {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
  }

  forceEnd(): void {
    this.clearTimer();
    this.finishMatch();
  }
}
