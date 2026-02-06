/**
 * Game Type Registry
 * 
 * Central registry for all available game types.
 */

import type { GameType, MatchConfig, GameMatch } from './types.js';

class GameRegistry {
  private gameTypes: Map<string, GameType> = new Map();

  /**
   * Register a new game type
   */
  register(gameType: GameType): void {
    if (this.gameTypes.has(gameType.id)) {
      throw new Error(`Game type '${gameType.id}' is already registered`);
    }
    this.gameTypes.set(gameType.id, gameType);
    console.log(`🎮 Registered game type: ${gameType.name} (${gameType.id})`);
  }

  /**
   * Get a game type by ID
   */
  get(gameTypeId: string): GameType | undefined {
    return this.gameTypes.get(gameTypeId);
  }

  /**
   * Get all registered game types
   */
  getAll(): GameType[] {
    return Array.from(this.gameTypes.values());
  }

  /**
   * Check if a game type exists
   */
  has(gameTypeId: string): boolean {
    return this.gameTypes.has(gameTypeId);
  }

  /**
   * Create a match for a game type
   */
  createMatch(gameTypeId: string, config: MatchConfig): GameMatch {
    const gameType = this.gameTypes.get(gameTypeId);
    if (!gameType) {
      throw new Error(`Unknown game type: ${gameTypeId}`);
    }
    
    if (config.players.length < gameType.minPlayers) {
      throw new Error(`${gameType.name} requires at least ${gameType.minPlayers} players`);
    }
    
    if (config.players.length > gameType.maxPlayers) {
      throw new Error(`${gameType.name} allows at most ${gameType.maxPlayers} players`);
    }

    return gameType.createMatch(config);
  }

  /**
   * Get game type info for API responses
   */
  getGameTypeInfo(gameTypeId: string): GameTypeInfo | undefined {
    const gt = this.gameTypes.get(gameTypeId);
    if (!gt) return undefined;
    
    return {
      id: gt.id,
      name: gt.name,
      description: gt.description,
      minPlayers: gt.minPlayers,
      maxPlayers: gt.maxPlayers,
      hasPrizePool: gt.hasPrizePool,
      defaultPrizePool: gt.defaultPrizePool,
      gridIconSize: gt.gridIconSize,
      showMovement: gt.showMovement,
    };
  }

  /**
   * Get all game types info for API
   */
  getAllGameTypeInfo(): GameTypeInfo[] {
    return this.getAll().map(gt => this.getGameTypeInfo(gt.id)!);
  }
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

// Singleton instance
export const gameRegistry = new GameRegistry();
