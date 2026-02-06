/**
 * Core Platform Types
 * 
 * Game-agnostic interfaces that all games implement.
 */

// ============ PLAYER ============

export interface Player {
  id: string;
  name: string;
  avatar: string;
  
  // Platform-wide stats
  totalPoints: number;
  totalMatches: number;
  totalWins: number;
}

export interface PlayerMatchState {
  playerId: string;
  isActive: boolean;           // Still in the game
  eliminatedRound?: number;    // When they were knocked out
  placement?: number;          // Final placement (1 = winner)
  points?: number;             // Points earned this match
}

// ============ GAME TYPE ============

export interface GameType {
  id: string;                  // 'pricewars' | 'rps'
  name: string;                // Display name
  description: string;
  
  // Player constraints
  minPlayers: number;
  maxPlayers: number;
  
  // Economy
  hasPrizePool: boolean;
  defaultPrizePool?: number;   // cents
  
  // UI rendering hints
  gridIconSize: 1 | 4 | 9;     // 1x1, 2x2, or 3x3 cells
  showMovement: boolean;       // Bots wander during deliberation?
  
  // Factory
  createMatch(config: MatchConfig): GameMatch;
}

export interface MatchConfig {
  players: Player[];
  prizePool?: number;          // cents, optional override
}

// ============ GAME MATCH ============

export type MatchPhase = 'waiting' | 'active' | 'finished';

export interface GameMatch {
  readonly id: string;
  readonly gameTypeId: string;
  readonly players: Player[];
  readonly prizePool: number;
  
  // State
  getPhase(): MatchPhase;
  isFinished(): boolean;
  
  // Lifecycle
  start(): void;
  handleAction(playerId: string, action: GameAction): ActionResult;
  
  // State queries
  getPublicState(): PublicMatchState;
  getPlayerState(playerId: string): PlayerMatchState;
  getPlacements(): Placement[];
  getWinner(): Player | null;
  
  // Events
  on(handler: MatchEventHandler): () => void;
  
  // For testing/admin
  forceEnd?(): void;
}

export interface PublicMatchState {
  matchId: string;
  gameTypeId: string;
  phase: MatchPhase;
  players: PlayerPublicInfo[];
  currentRound: number;
  totalRounds: number | null;  // null if variable (RPS can go to 5 with draws)
  gameSpecific: any;           // Game-type-specific public data
}

export interface PlayerPublicInfo {
  id: string;
  name: string;
  avatar: string;
  isActive: boolean;
  // Game-specific display data (bid amount, throw icon, etc.)
  display?: any;
}

// ============ ACTIONS ============

export interface GameAction {
  type: string;
  [key: string]: any;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

// ============ PLACEMENTS ============

export interface Placement {
  playerId: string;
  playerName: string;
  place: number;               // 1 = winner
  points: number;              // Opponents beaten
}

// ============ EVENTS ============

export type MatchEvent = 
  | { type: 'match_started'; matchId: string; players: Player[] }
  | { type: 'round_started'; round: number; endsAt: number; data?: any }
  | { type: 'player_action'; playerId: string; actionType: string; public?: boolean }
  | { type: 'chat_message'; playerId: string; playerName: string; message: string }
  | { type: 'round_ended'; round: number; data?: any }
  | { type: 'player_eliminated'; playerId: string; playerName: string; round: number }
  | { type: 'match_finished'; winner: Player | null; placements: Placement[] }
  // Game-specific events use 'game_event' wrapper
  | { type: 'game_event'; event: string; data: any };

export type MatchEventHandler = (event: MatchEvent) => void;

// ============ QUEUE ============

export interface GameQueue {
  gameTypeId: string;
  players: QueuedPlayer[];
  requiredPlayers: number;
}

export interface QueuedPlayer {
  playerId: string;
  joinedAt: number;
}

// ============ CHAT ============

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

// ============ HISTORY ============

export interface MatchRecord {
  id: string;
  gameTypeId: string;
  players: string[];           // player IDs
  winner: string | null;       // player ID
  placements: Placement[];
  prizePool: number;
  startedAt: number;
  endedAt: number;
  rounds: any[];               // Game-specific round data
}
