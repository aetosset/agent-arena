/**
 * Game Type Registry
 *
 * Central registry for all available game types.
 */
import type { GameType, MatchConfig, GameMatch } from './types.js';
declare class GameRegistry {
    private gameTypes;
    /**
     * Register a new game type
     */
    register(gameType: GameType): void;
    /**
     * Get a game type by ID
     */
    get(gameTypeId: string): GameType | undefined;
    /**
     * Get all registered game types
     */
    getAll(): GameType[];
    /**
     * Check if a game type exists
     */
    has(gameTypeId: string): boolean;
    /**
     * Create a match for a game type
     */
    createMatch(gameTypeId: string, config: MatchConfig): GameMatch;
    /**
     * Get game type info for API responses
     */
    getGameTypeInfo(gameTypeId: string): GameTypeInfo | undefined;
    /**
     * Get all game types info for API
     */
    getAllGameTypeInfo(): GameTypeInfo[];
}
export interface GameTypeInfo {
    id: string;
    name: string;
    description: string;
    minPlayers: number;
    maxPlayers: number;
    hasPrizePool: boolean;
    defaultPrizePool?: number;
    gridIconSize: 1 | 4 | 9;
    showMovement: boolean;
}
export declare const gameRegistry: GameRegistry;
export {};
