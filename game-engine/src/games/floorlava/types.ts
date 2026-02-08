/**
 * Floor is Lava - Game Types
 * 
 * Survival strategy game where bots navigate a shrinking grid.
 * Tiles turn to lava, bots must move, collisions eliminate losers.
 */

export type TileState = 'safe' | 'lava';

export interface Tile {
  x: number;
  y: number;
  state: TileState;
}

export interface GridState {
  width: number;   // 14
  height: number;  // 8
  tiles: TileState[][]; // tiles[y][x]
}

export interface BotPosition {
  odId: string;
  x: number;
  y: number;
  eliminated: boolean;
  eliminatedRound?: number;
  eliminationReason?: 'collision' | 'lava' | 'invalid_move';
}

export interface MoveCommit {
visiblebotId: string;
  targetX: number;
  targetY: number;
  timestamp: number;
}

export interface Collision {
  tile: { x: number; y: number };
  bots: string[]; // botIds involved
  winner: string; // botId of winner
  losers: string[]; // botIds eliminated
  rolls: Record<string, number>; // botId -> roll (1 to N)
}

export interface RoundResult {
  round: number;
  lavaSpread: { x: number; y: number }[]; // tiles that became lava
  moves: Record<string, { from: { x: number; y: number }; to: { x: number; y: number } }>;
  collisions: Collision[];
  eliminations: { botId: string; reason: 'collision' | 'lava' | 'invalid_move' }[];
  survivingBots: string[];
  safeTilesRemaining: number;
}

export type FloorLavaPhase = 
  | 'waiting'      // Waiting for players
  | 'starting'     // Match about to begin
  | 'lava_spread'  // Tiles turning to lava (3-5s)
  | 'deliberation' // Bots chat and plan (45s)
  | 'commit'       // Bots lock in moves (15s)
  | 'resolve'      // Moves revealed, collisions resolved
  | 'finished';    // Game over

export interface FloorLavaState {
  phase: FloorLavaPhase;
  round: number;
  grid: GridState;
  botPositions: BotPosition[];
  commits: MoveCommit[]; // Hidden during commit phase
  roundHistory: RoundResult[];
  winner?: string;
  placements?: string[]; // [1st, 2nd, 3rd, ...] by elimination order (reversed)
  phaseEndsAt?: number; // Unix timestamp
}

export interface FloorLavaConfig {
  minPlayers: number;      // 4
  maxPlayers: number;      // 16
  gridWidth: number;       // 14
  gridHeight: number;      // 8
  lavaSpreadDuration: number;   // 3000ms
  deliberationDuration: number; // 45000ms
  commitDuration: number;       // 15000ms
  resolveDuration: number;      // 5000ms
  lavaShrinkRate: number;       // 0.5 (50% of safe tiles become lava)
}

export const DEFAULT_CONFIG: FloorLavaConfig = {
  minPlayers: 3,
  maxPlayers: 16,
  gridWidth: 14,
  gridHeight: 8,
  lavaSpreadDuration: 3000,
  deliberationDuration: 45000,
  commitDuration: 15000,
  resolveDuration: 5000,
  lavaShrinkRate: 0.5,
};

// Prize distribution based on player count
export function getPrizeDistribution(playerCount: number): number[] {
  if (playerCount >= 13) return [0.6, 0.25, 0.15]; // 3 prizes: 60%, 25%, 15%
  if (playerCount >= 8) return [0.7, 0.3];         // 2 prizes: 70%, 30%
  return [1.0];                                     // 1 prize: 100%
}
