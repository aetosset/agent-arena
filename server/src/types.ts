/**
 * Server Types - Multi-Game Platform
 */

// ============ BOT / PLAYER ============

export interface Bot {
  id: string;
  name: string;
  avatar: string;
  apiKey: string;
  createdAt: number;
  
  // Platform-wide stats
  totalPoints: number;
  totalMatches: number;
  totalWins: number;
  
  // Per-game stats
  gameStats: { [gameTypeId: string]: GameStats };
}

export interface GameStats {
  matchesPlayed: number;
  wins: number;
  points: number;
  avgPlacement: number;
}

export interface BotPublic {
  id: string;
  name: string;
  avatar: string;
  totalPoints: number;
  totalMatches: number;
  totalWins: number;
  winRate: number;
}

// ============ MATCH ============

export interface Match {
  id: string;
  gameTypeId: string;           // 'pricewars' | 'rps'
  status: 'queued' | 'live' | 'finished';
  botIds: string[];
  winner: string | null;        // bot ID
  placements: MatchPlacement[];
  prizePool: number;
  startedAt: number | null;
  endedAt: number | null;
  createdAt: number;
  // Game-specific data stored separately or inline
  gameData?: any;
}

export interface MatchPlacement {
  botId: string;
  place: number;
  points: number;
}

// ============ QUEUE ============

export interface QueueState {
  gameTypeId: string;
  bots: QueuedBot[];
  requiredPlayers: number;
}

export interface QueuedBot {
  botId: string;
  joinedAt: number;
}

// ============ WEBSOCKET EVENTS ============

// Events sent to all clients (spectators + bots)
export type ServerEvent =
  // Platform events
  | { type: 'queue_update'; gameTypeId: string; count: number; required: number }
  | { type: 'match_starting'; matchId: string; gameTypeId: string; bots: BotPublic[]; startsIn: number }
  | { type: 'match_ended'; matchId: string; gameTypeId: string; winner: BotPublic; placements: MatchPlacement[] }
  | { type: 'chat_message'; matchId: string; botId: string; botName: string; message: string }
  // Game-specific events (wrapped)
  | { type: 'game_event'; matchId: string; gameTypeId: string; event: string; data: any }
  // Connection
  | { type: 'connected'; sessionId: string }
  | { type: 'error'; message: string };

// Events sent specifically to bots
export type BotEvent =
  | { type: 'match_assigned'; matchId: string; gameTypeId: string; opponents: BotPublic[] }
  | { type: 'action_request'; matchId: string; gameTypeId: string; deadline: number; context: any }
  | { type: 'action_result'; success: boolean; error?: string }
  | { type: 'round_result'; matchId: string; data: any }
  | { type: 'match_result'; matchId: string; placement: number; points: number; won: boolean };

// Commands from bots
export type BotCommand =
  | { type: 'chat'; message: string }
  | { type: 'action'; gameTypeId: string; action: any };  // Game-specific action

// ============ API RESPONSES ============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LeaderboardEntry {
  rank: number;
  bot: BotPublic;
  gameTypeId?: string;  // If per-game leaderboard
  points: number;
}

export interface GameTypeInfo {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  hasPrizePool: boolean;
  gridIconSize: 1 | 4 | 9;
  showMovement: boolean;
  queueCount: number;
  liveMatches: number;
}
