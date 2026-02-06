/**
 * Base Match Class
 *
 * Common functionality for all game matches.
 */
import type { GameMatch, Player, MatchPhase, GameAction, ActionResult, PublicMatchState, PlayerMatchState, Placement, MatchEvent, MatchEventHandler, ChatMessage } from './types.js';
export declare abstract class BaseMatch implements GameMatch {
    readonly id: string;
    readonly gameTypeId: string;
    readonly players: Player[];
    readonly prizePool: number;
    protected phase: MatchPhase;
    protected eventHandlers: MatchEventHandler[];
    protected chatHistory: ChatMessage[];
    protected playerStates: Map<string, PlayerMatchState>;
    protected startedAt: number | null;
    protected endedAt: number | null;
    constructor(gameTypeId: string, players: Player[], prizePool?: number);
    getPhase(): MatchPhase;
    isFinished(): boolean;
    abstract start(): void;
    abstract handleAction(playerId: string, action: GameAction): ActionResult;
    abstract getPublicState(): PublicMatchState;
    getPlayerState(playerId: string): PlayerMatchState;
    abstract getPlacements(): Placement[];
    getWinner(): Player | null;
    protected getActivePlayers(): Player[];
    protected getActivePlayerIds(): string[];
    protected eliminatePlayer(playerId: string, round: number): void;
    protected handleChat(playerId: string, message: string): ActionResult;
    getChatHistory(): ChatMessage[];
    on(handler: MatchEventHandler): () => void;
    protected emit(event: MatchEvent): void;
    protected calculatePlacements(eliminationOrder: string[]): Placement[];
    protected finishMatch(): void;
}
