/**
 * PRICEWARS Match Implementation
 */
import { BaseMatch } from '../../core/base-match.js';
import type { Player, GameAction, ActionResult, PublicMatchState, Placement } from '../../core/types.js';
import type { PriceWarsRound, PriceWarsConfig } from './types.js';
export declare class PriceWarsMatch extends BaseMatch {
    private items;
    private currentRound;
    private gamePhase;
    private currentItem;
    private bids;
    private roundResults;
    private eliminationOrder;
    private roundStartedAt;
    private roundTimer;
    private roundDurationMs;
    private revealDurationMs;
    private eliminationDurationMs;
    private eliminatePerRound;
    constructor(players: Player[], prizePool: number, config: PriceWarsConfig);
    start(): void;
    private startNextRound;
    private endDeliberation;
    private doElimination;
    handleAction(playerId: string, action: GameAction): ActionResult;
    private handleBid;
    getPublicState(): PublicMatchState;
    private getPublicItem;
    private getPublicBids;
    getPlacements(): Placement[];
    getRoundResults(): PriceWarsRound[];
    private clearTimer;
    forceEnd(): void;
    forceEndRound(): void;
}
