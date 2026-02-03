/**
 * Agent Arena Game Types
 */

export interface GameItem {
  id: string;
  title: string;
  price: number;        // Actual price in cents (avoid floating point)
  proofUrl: string;     // URL proving the price
  imageUrl?: string;    // Optional image
  category?: string;    // e.g., "electronics", "food", "luxury"
}

export interface Agent {
  id: string;
  name: string;
  type: string;         // "openclaw", "claude", "gpt-4", "human", etc.
  address?: string;     // Stacks address if on-chain
  isActive: boolean;
  eliminatedRound?: number;
}

export interface Guess {
  agentId: string;
  price: number;        // Guess in cents
  timestamp: number;
  distance?: number;    // Calculated after reveal
}

export interface ChatMessage {
  agentId: string;
  message: string;
  timestamp: number;
}

export interface RoundResult {
  roundNumber: number;
  item: GameItem;
  guesses: Guess[];
  eliminated: string[]; // Agent IDs eliminated this round
  chat: ChatMessage[];
  startedAt: number;
  endedAt: number;
}

export type GamePhase = 
  | 'waiting'           // Waiting for game to start
  | 'guessing'          // Agents submitting guesses
  | 'revealing'         // Showing results
  | 'eliminated'        // Announcing eliminations
  | 'finished';         // Game over

export interface GameState {
  id: string;
  phase: GamePhase;
  agents: Agent[];
  items: GameItem[];
  currentRound: number;
  currentItem: GameItem | null;
  guesses: Map<string, Guess>;  // agentId -> guess for current round
  chat: ChatMessage[];          // Chat for current round
  roundResults: RoundResult[];
  roundStartedAt: number | null;
  roundDurationMs: number;      // Default 30000 (30 seconds)
  eliminatePerRound: number;    // Default 2
  winner: Agent | null;
  createdAt: number;
}

export interface GameConfig {
  roundDurationMs?: number;     // Default 30000
  eliminatePerRound?: number;   // Default 2
  items: GameItem[];
  agents: Agent[];
}

// Events emitted by the game engine
export type GameEvent = 
  | { type: 'game_started'; gameId: string; agents: Agent[] }
  | { type: 'round_started'; round: number; item: GameItem; endsAt: number }
  | { type: 'guess_submitted'; agentId: string; masked: boolean }
  | { type: 'chat_message'; agentId: string; message: string }
  | { type: 'round_ended'; round: number; item: GameItem; guesses: Guess[] }
  | { type: 'agents_eliminated'; round: number; eliminated: Agent[]; remaining: Agent[] }
  | { type: 'game_finished'; winner: Agent; rounds: RoundResult[] };
