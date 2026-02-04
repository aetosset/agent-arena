/**
 * Server Types for Agent Arena
 */

// ============ BOT ============
export interface Bot {
  id: string;
  name: string;
  avatar: string;        // avatar identifier (e.g., "robot-1", "alien-2")
  apiKey: string;        // for bot authentication
  createdAt: number;
  // Stats
  matchesPlayed: number;
  wins: number;
  totalEarnings: number; // cents (for future)
  avgPlacement: number;
}

export interface BotPublic {
  id: string;
  name: string;
  avatar: string;
  matchesPlayed: number;
  wins: number;
  winRate: number;
  avgPlacement: number;
}

// ============ MATCH ============
export interface Match {
  id: string;
  status: 'queued' | 'live' | 'finished';
  bots: string[];        // bot IDs (8)
  rounds: MatchRound[];
  winner: string | null; // bot ID
  startedAt: number | null;
  endedAt: number | null;
  createdAt: number;
}

export interface MatchRound {
  roundNumber: number;
  item: MatchItem;
  bids: RoundBid[];
  chat: RoundChat[];
  eliminated: string[];  // bot IDs
  startedAt: number;
  endedAt: number;
}

export interface MatchItem {
  id: string;
  title: string;
  price: number;         // actual price in cents
  imageUrls: string[];
  proofUrl: string;
}

export interface RoundBid {
  botId: string;
  price: number;         // guess in cents
  timestamp: number;
  distance?: number;     // calculated after reveal
}

export interface RoundChat {
  botId: string;
  message: string;
  timestamp: number;
}

// ============ QUEUE ============
export interface QueueState {
  bots: QueuedBot[];
  matchStartsWhen: number; // 8
  estimatedStartTime: number | null;
}

export interface QueuedBot {
  botId: string;
  joinedAt: number;
}

// ============ WEBSOCKET EVENTS ============
export type ServerEvent =
  | { type: 'queue_update'; queue: QueueState }
  | { type: 'match_starting'; matchId: string; bots: BotPublic[]; startsIn: number }
  | { type: 'round_start'; matchId: string; round: number; item: Omit<MatchItem, 'price'>; endsAt: number }
  | { type: 'bot_chat'; matchId: string; botId: string; botName: string; message: string }
  | { type: 'bid_locked'; matchId: string; botId: string } // bid submitted but not revealed
  | { type: 'bids_reveal'; matchId: string; bids: Array<{ botId: string; botName: string; price: number }> }
  | { type: 'price_reveal'; matchId: string; actualPrice: number; item: MatchItem }
  | { type: 'elimination'; matchId: string; eliminated: Array<{ botId: string; botName: string; distance: number }> }
  | { type: 'round_end'; matchId: string; round: number; surviving: string[] }
  | { type: 'match_end'; matchId: string; winner: BotPublic; placements: Array<{ botId: string; botName: string; placement: number }> };

export type BotEvent =
  | { type: 'match_assigned'; matchId: string; opponents: BotPublic[] }
  | { type: 'round_start'; round: number; item: Omit<MatchItem, 'price'>; endsAt: number }
  | { type: 'opponent_chat'; botId: string; botName: string; message: string }
  | { type: 'bid_request'; deadline: number } // server asking for bid
  | { type: 'round_result'; actualPrice: number; yourBid: number; yourDistance: number; eliminated: boolean }
  | { type: 'match_result'; placement: number; winner: string };

export type BotCommand =
  | { type: 'chat'; message: string }
  | { type: 'bid'; price: number };

// ============ API RESPONSES ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LeaderboardEntry {
  rank: number;
  bot: BotPublic;
}
