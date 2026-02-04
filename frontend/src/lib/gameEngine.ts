/**
 * Game Engine - Single source of truth for match state
 * 
 * Clean architecture:
 * - GameState holds ALL state
 * - tick() advances the game each frame
 * - React components just render the state
 */

export type MatchPhase = 
  | 'waiting'      // Before match starts
  | 'deliberation' // Bots analyzing, timer counting down
  | 'bidding'      // Bots submitting bids (instant in demo)
  | 'reveal'       // Showing bids and actual price
  | 'elimination'  // Showing who got eliminated
  | 'finished';    // Match complete, winner declared

export interface Bot {
  id: string;
  name: string;
  avatar: string;
  eliminated: boolean;
  eliminatedRound: number | null;
  gridCol: number;
  gridRow: number;
  bid: number | null;
}

export interface Item {
  id: string;
  title: string;
  category: string;
  price: number; // in cents
  imageUrl: string | null;
}

export interface ChatMessage {
  id: string;
  botId: string;
  botName: string;
  message: string;
  timestamp: number;
}

export interface GameState {
  phase: MatchPhase;
  round: number;
  totalRounds: number;
  
  // Timing
  phaseStartTime: number;
  phaseDuration: number; // ms
  
  // Entities
  bots: Bot[];
  currentItem: Item | null;
  actualPrice: number;
  
  // Round results
  eliminatedThisRound: string[]; // bot IDs
  
  // Chat
  chatMessages: ChatMessage[];
  
  // Winner
  winnerId: string | null;
}

// Grid constants
export const GRID_COLS = 14;
export const GRID_ROWS = 8;

// Phase durations in ms
export const PHASE_DURATIONS: Record<MatchPhase, number> = {
  waiting: 0,
  deliberation: 12000, // 12 seconds
  bidding: 500,        // Instant-ish
  reveal: 4000,        // 4 seconds to see results
  elimination: 3000,   // 3 seconds to see who's out
  finished: 0,
};

// Demo bots
export const DEMO_BOTS: Omit<Bot, 'gridCol' | 'gridRow'>[] = [
  { id: 'bot-1', name: 'SNIPE-BOT', avatar: '🤖', eliminated: false, eliminatedRound: null, bid: null },
  { id: 'bot-2', name: 'GROK-V3', avatar: '🦾', eliminated: false, eliminatedRound: null, bid: null },
  { id: 'bot-3', name: 'ARCH-V', avatar: '👾', eliminated: false, eliminatedRound: null, bid: null },
  { id: 'bot-4', name: 'HYPE-AI', avatar: '🔮', eliminated: false, eliminatedRound: null, bid: null },
  { id: 'bot-5', name: 'BID-LORD', avatar: '🧠', eliminated: false, eliminatedRound: null, bid: null },
  { id: 'bot-6', name: 'FLUX-8', avatar: '⚡', eliminated: false, eliminatedRound: null, bid: null },
  { id: 'bot-7', name: 'NEO-BOT', avatar: '💎', eliminated: false, eliminatedRound: null, bid: null },
  { id: 'bot-8', name: 'ZEN-BOT', avatar: '🎯', eliminated: false, eliminatedRound: null, bid: null },
];

// Demo items
export const DEMO_ITEMS: Item[] = [
  { id: 'item-1', title: 'Cat Butt Tissue Dispenser', category: 'NOVELTY', price: 4500, imageUrl: null },
  { id: 'item-2', title: 'Puking Cat Gravy Boat', category: 'KITCHEN', price: 4000, imageUrl: null },
  { id: 'item-3', title: 'Self-Defense Nightstand', category: 'FURNITURE', price: 20000, imageUrl: null },
  { id: 'item-4', title: 'Hot Tub Squirrel Feeder', category: 'OUTDOOR', price: 900, imageUrl: null },
];

// Demo chat messages
const DEMO_CHAT = [
  "Analyzing price data...",
  "This looks interesting.",
  "Running calculations...",
  "I've seen better items.",
  "My neural nets are tingling.",
  "Computing optimal bid...",
  "This one's mine.",
  "Easy money.",
  "Don't even try.",
  "Market data suggests high value.",
];

// Direction vectors for cardinal movement
const DIRECTIONS = [
  { dx: 0, dy: -1 }, // up
  { dx: 0, dy: 1 },  // down
  { dx: -1, dy: 0 }, // left
  { dx: 1, dy: 0 },  // right
];

/**
 * Create initial game state for demo mode
 */
export function createDemoGameState(): GameState {
  // Place bots on grid
  const bots: Bot[] = DEMO_BOTS.map((bot, idx) => {
    const angle = (idx / DEMO_BOTS.length) * Math.PI * 2;
    const radius = 2.5;
    const centerCol = Math.floor(GRID_COLS / 2);
    const centerRow = Math.floor(GRID_ROWS / 2);
    
    return {
      ...bot,
      gridCol: Math.floor(centerCol + Math.cos(angle) * radius),
      gridRow: Math.floor(centerRow + Math.sin(angle) * radius),
    };
  });

  return {
    phase: 'deliberation',
    round: 1,
    totalRounds: 4,
    phaseStartTime: Date.now(),
    phaseDuration: PHASE_DURATIONS.deliberation,
    bots,
    currentItem: DEMO_ITEMS[0],
    actualPrice: DEMO_ITEMS[0].price,
    eliminatedThisRound: [],
    chatMessages: [],
    winnerId: null,
  };
}

/**
 * Get time remaining in current phase (ms)
 */
export function getTimeRemaining(state: GameState): number {
  const elapsed = Date.now() - state.phaseStartTime;
  return Math.max(0, state.phaseDuration - elapsed);
}

/**
 * Get active (non-eliminated) bots
 */
export function getActiveBots(state: GameState): Bot[] {
  return state.bots.filter(b => !b.eliminated);
}

/**
 * Move bots randomly on grid (only during deliberation)
 */
export function moveBots(state: GameState): GameState {
  if (state.phase !== 'deliberation') return state;

  const newBots = state.bots.map(bot => {
    if (bot.eliminated) return bot;
    
    // 30% chance to move
    if (Math.random() > 0.3) return bot;

    // Build occupied set
    const occupied = new Set(
      state.bots.map(b => `${b.gridCol},${b.gridRow}`)
    );
    occupied.delete(`${bot.gridCol},${bot.gridRow}`);

    // Try random direction
    const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    const newCol = bot.gridCol + dir.dx;
    const newRow = bot.gridRow + dir.dy;

    // Check bounds and collision
    if (
      newCol >= 0 && newCol < GRID_COLS &&
      newRow >= 0 && newRow < GRID_ROWS &&
      !occupied.has(`${newCol},${newRow}`)
    ) {
      return { ...bot, gridCol: newCol, gridRow: newRow };
    }

    return bot;
  });

  return { ...state, bots: newBots };
}

/**
 * Add a chat message
 */
export function addChatMessage(state: GameState): GameState {
  const activeBots = getActiveBots(state);
  if (activeBots.length === 0) return state;

  const bot = activeBots[Math.floor(Math.random() * activeBots.length)];
  const message = DEMO_CHAT[Math.floor(Math.random() * DEMO_CHAT.length)];

  const newMessage: ChatMessage = {
    id: `chat-${Date.now()}-${Math.random()}`,
    botId: bot.id,
    botName: bot.name,
    message,
    timestamp: Date.now(),
  };

  return {
    ...state,
    chatMessages: [...state.chatMessages.slice(-20), newMessage], // Keep last 20
  };
}

/**
 * Generate bids for all active bots
 */
export function generateBids(state: GameState): GameState {
  const newBots = state.bots.map(bot => {
    if (bot.eliminated) return bot;
    
    // Random bid: actual price ± 50%
    const variance = state.actualPrice * 0.5;
    const bid = Math.floor(state.actualPrice + (Math.random() - 0.5) * 2 * variance);
    
    return { ...bot, bid: Math.max(100, bid) }; // Min $1
  });

  return { ...state, bots: newBots };
}

/**
 * Eliminate the 2 bots furthest from actual price
 */
export function eliminateBots(state: GameState): GameState {
  const activeBots = getActiveBots(state);
  
  // Sort by distance from actual price (furthest first)
  const sorted = [...activeBots].sort((a, b) => {
    const distA = Math.abs((a.bid || 0) - state.actualPrice);
    const distB = Math.abs((b.bid || 0) - state.actualPrice);
    return distB - distA;
  });

  // Eliminate 2 (or 1 if only 2 left)
  const toEliminate = sorted.slice(0, activeBots.length <= 2 ? 1 : 2);
  const eliminatedIds = toEliminate.map(b => b.id);

  const newBots = state.bots.map(bot => {
    if (eliminatedIds.includes(bot.id)) {
      return { ...bot, eliminated: true, eliminatedRound: state.round };
    }
    return bot;
  });

  return {
    ...state,
    bots: newBots,
    eliminatedThisRound: eliminatedIds,
  };
}

/**
 * Advance to next phase
 */
export function advancePhase(state: GameState): GameState {
  const now = Date.now();

  switch (state.phase) {
    case 'deliberation':
      // Generate bids and move to bidding
      const withBids = generateBids(state);
      return {
        ...withBids,
        phase: 'bidding',
        phaseStartTime: now,
        phaseDuration: PHASE_DURATIONS.bidding,
      };

    case 'bidding':
      // Move to reveal
      return {
        ...state,
        phase: 'reveal',
        phaseStartTime: now,
        phaseDuration: PHASE_DURATIONS.reveal,
      };

    case 'reveal':
      // Eliminate bots and show elimination
      const withEliminated = eliminateBots(state);
      return {
        ...withEliminated,
        phase: 'elimination',
        phaseStartTime: now,
        phaseDuration: PHASE_DURATIONS.elimination,
      };

    case 'elimination':
      // Check if match is over
      const remaining = getActiveBots(state);
      
      if (remaining.length <= 1) {
        // Match over
        return {
          ...state,
          phase: 'finished',
          phaseStartTime: now,
          phaseDuration: 0,
          winnerId: remaining[0]?.id || null,
        };
      }

      // Start next round
      const nextRound = state.round + 1;
      const nextItem = DEMO_ITEMS[nextRound - 1] || DEMO_ITEMS[0];
      
      return {
        ...state,
        phase: 'deliberation',
        round: nextRound,
        phaseStartTime: now,
        phaseDuration: PHASE_DURATIONS.deliberation,
        currentItem: nextItem,
        actualPrice: nextItem.price,
        eliminatedThisRound: [],
        bots: state.bots.map(b => ({ ...b, bid: null })), // Clear bids
      };

    default:
      return state;
  }
}

/**
 * Main game tick - call this every frame (~100ms)
 */
export function tick(state: GameState): GameState {
  // Check if phase should advance
  if (state.phase !== 'finished' && state.phase !== 'waiting') {
    if (getTimeRemaining(state) <= 0) {
      return advancePhase(state);
    }
  }

  // During deliberation, move bots and add chat
  if (state.phase === 'deliberation') {
    let newState = moveBots(state);
    
    // Add chat message every ~2 seconds
    const timeSinceLastChat = state.chatMessages.length > 0 
      ? Date.now() - state.chatMessages[state.chatMessages.length - 1].timestamp
      : 10000;
    
    if (timeSinceLastChat > 2000) {
      newState = addChatMessage(newState);
    }
    
    return newState;
  }

  return state;
}
