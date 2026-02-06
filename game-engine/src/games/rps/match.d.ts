/**
 * Rock Paper Scissors Match Implementation
 */
import { BaseMatch } from '../../core/base-match.js';
import type { Player, GameAction, ActionResult, PublicMatchState, Placement } from '../../core/types.js';
import type { RPSRound, RPSConfig } from './types.js';
export declare class RPSMatch extends BaseMatch {
    private roundsToWin;
    private scores;
    private currentRound;
    private gamePhase;
    private currentThrows;
    private roundResults;
    private roundStartedAt;
    private roundTimer;
    private lastRoundWinner;
    private lastRoundDraw;
    private throwDurationMs;
    private revealDurationMs;
    private betweenRoundsDurationMs;
    constructor(players: Player[], prizePool: number, config?: RPSConfig);
    start(): void;
    private startNextRound;
    private endThrowing;
    handleAction(playerId: string, action: GameAction): ActionResult;
    private handleThrow;
    getPublicState(): PublicMatchState;
    getPlacements(): Placement[];
    getRoundResults(): RPSRound[];
    private clearTimer;
    forceEnd(): void;
}
