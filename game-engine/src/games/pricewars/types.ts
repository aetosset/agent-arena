/**
 * PRICEWARS Game Types
 */

export interface PriceWarsItem {
  id: string;
  title: string;
  price: number;           // Actual price in cents
  imageUrls: string[];
  category?: string;
  proofUrl?: string;
}

export type PriceWarsPhase = 
  | 'deliberation'         // Bots chat + bid
  | 'reveal'               // Show bids
  | 'elimination'          // Show who's out
  | 'between_rounds';      // Transition

export interface PriceWarsBid {
  playerId: string;
  price: number;           // Guess in cents
  timestamp: number;
  distance?: number;       // Calculated after reveal
}

export interface PriceWarsRound {
  roundNumber: number;
  item: PriceWarsItem;
  bids: PriceWarsBid[];
  eliminated: string[];    // Player IDs
  startedAt: number;
  endedAt: number;
}

export interface PriceWarsConfig {
  items: PriceWarsItem[];
  roundDurationMs?: number;      // Default 15000
  revealDurationMs?: number;     // Default 4000
  eliminationDurationMs?: number; // Default 4000
  eliminatePerRound?: number;    // Default 2
}

// Actions
export interface PriceWarsBidAction {
  type: 'bid';
  price: number;
}

export interface PriceWarsChatAction {
  type: 'chat';
  message: string;
}

export type PriceWarsAction = PriceWarsBidAction | PriceWarsChatAction;

// Public state for spectators
export interface PriceWarsPublicState {
  phase: PriceWarsPhase;
  currentRound: number;
  totalRounds: number;
  currentItem: Omit<PriceWarsItem, 'price'> | null;  // Price hidden
  revealedPrice: number | null;  // Shown after reveal
  bids: Array<{ playerId: string; price: number | null; locked: boolean }>;
  eliminated: string[];          // This round's eliminations
  roundEndsAt: number | null;
}
