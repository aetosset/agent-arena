/**
 * Game Engine V2 - Clean Round 1 Focus
 * 
 * Single source of truth. No jank. Fast.
 */

export type Phase = 'deliberation' | 'reveal' | 'elimination' | 'finished';

export interface Bot {
  id: string;
  name: string;
  avatar: string;
  eliminated: boolean;
  gridCol: number;
  gridRow: number;
  bid: number | null;
}

export interface GameState {
  phase: Phase;
  round: number;
  phaseStartTime: number;
  phaseDuration: number;
  bots: Bot[];
  item: { title: string; imageUrl: string | null };
  actualPrice: number;
  eliminatedThisRound: string[];
  chat: { id: string; botId: string; botName: string; message: string; time: number }[];
  winnerId: string | null;
}

// Grid
export const COLS = 14;
export const ROWS = 8;

// Phase durations (ms) - FAST for demo
const DURATIONS = {
  deliberation: 10000, // 10 seconds - enough to see bots move & chat
  reveal: 3000,        // 3 seconds - see bids + price
  elimination: 2500,   // 2.5 seconds - see who's out
};

// Demo bots
const BOTS: Omit<Bot, 'gridCol' | 'gridRow'>[] = [
  { id: '1', name: 'GROK-V3', avatar: '🤖', eliminated: false, bid: null },
  { id: '2', name: 'SNIPE-BOT', avatar: '🦾', eliminated: false, bid: null },
  { id: '3', name: 'ARCH-V', avatar: '👾', eliminated: false, bid: null },
  { id: '4', name: 'HYPE-AI', avatar: '🔮', eliminated: false, bid: null },
  { id: '5', name: 'BID-LORD', avatar: '🧠', eliminated: false, bid: null },
  { id: '6', name: 'FLUX-8', avatar: '⚡', eliminated: false, bid: null },
  { id: '7', name: 'NEO-BOT', avatar: '💎', eliminated: false, bid: null },
  { id: '8', name: 'ZEN-BOT', avatar: '🎯', eliminated: false, bid: null },
];

const CHAT_LINES = [
  "Analyzing...",
  "This looks interesting.",
  "Running calculations...",
  "My neural nets are tingling.",
  "Computing optimal bid...",
  "Easy money.",
  "Don't even try.",
  "Market data suggests high value.",
  "I've seen better.",
  "This one's mine.",
];

const ITEMS = [
  { title: 'Cat Butt Tissue Dispenser', price: 4500, imageUrl: null },
  { title: 'Puking Cat Gravy Boat', price: 4000, imageUrl: null },
  { title: 'Self-Defense Nightstand', price: 20000, imageUrl: null },
  { title: 'Hot Tub Squirrel Feeder', price: 900, imageUrl: null },
];

// Direction vectors (cardinal only)
const DIRS = [
  { dx: 0, dy: -1 }, // up
  { dx: 0, dy: 1 },  // down
  { dx: -1, dy: 0 }, // left
  { dx: 1, dy: 0 },  // right
];

/**
 * Create initial state - INSTANT, no delays
 */
export function createGame(): GameState {
  // Place bots in a circle
  const bots: Bot[] = BOTS.map((b, i) => {
    const angle = (i / BOTS.length) * Math.PI * 2;
    const r = 2.5;
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);
    return {
      ...b,
      gridCol: Math.floor(cx + Math.cos(angle) * r),
      gridRow: Math.floor(cy + Math.sin(angle) * r),
    };
  });

  const item = ITEMS[0];
  
  return {
    phase: 'deliberation',
    round: 1,
    phaseStartTime: Date.now(),
    phaseDuration: DURATIONS.deliberation,
    bots,
    item: { title: item.title, imageUrl: item.imageUrl },
    actualPrice: item.price,
    eliminatedThisRound: [],
    chat: [],
    winnerId: null,
  };
}

/**
 * Time remaining in phase (ms)
 */
export function timeLeft(s: GameState): number {
  return Math.max(0, s.phaseDuration - (Date.now() - s.phaseStartTime));
}

/**
 * Active bots
 */
export function activeBots(s: GameState): Bot[] {
  return s.bots.filter(b => !b.eliminated);
}

/**
 * Generate random bids for all active bots
 */
function generateBids(s: GameState): GameState {
  const newBots = s.bots.map(bot => {
    if (bot.eliminated) return bot;
    // Bid within ±40% of actual price
    const variance = s.actualPrice * 0.4;
    const bid = Math.floor(s.actualPrice + (Math.random() - 0.5) * 2 * variance);
    return { ...bot, bid: Math.max(100, bid) };
  });
  return { ...s, bots: newBots };
}

/**
 * Eliminate 2 worst bots
 */
function eliminate(s: GameState): GameState {
  const active = activeBots(s);
  
  // Sort by distance (worst first)
  const sorted = [...active].sort((a, b) => {
    const distA = Math.abs((a.bid || 0) - s.actualPrice);
    const distB = Math.abs((b.bid || 0) - s.actualPrice);
    return distB - distA;
  });

  // Eliminate 2 (or 1 if only 2 left)
  const count = active.length <= 2 ? 1 : 2;
  const elimIds = sorted.slice(0, count).map(b => b.id);

  const newBots = s.bots.map(bot => {
    if (elimIds.includes(bot.id)) {
      return { ...bot, eliminated: true };
    }
    return bot;
  });

  return { ...s, bots: newBots, eliminatedThisRound: elimIds };
}

/**
 * Advance to next phase
 */
function nextPhase(s: GameState): GameState {
  const now = Date.now();

  switch (s.phase) {
    case 'deliberation': {
      const withBids = generateBids(s);
      return {
        ...withBids,
        phase: 'reveal',
        phaseStartTime: now,
        phaseDuration: DURATIONS.reveal,
      };
    }

    case 'reveal': {
      const withElim = eliminate(s);
      return {
        ...withElim,
        phase: 'elimination',
        phaseStartTime: now,
        phaseDuration: DURATIONS.elimination,
      };
    }

    case 'elimination': {
      const remaining = activeBots(s);
      
      // Match over?
      if (remaining.length <= 1) {
        return {
          ...s,
          phase: 'finished',
          winnerId: remaining[0]?.id || null,
        };
      }

      // Next round
      const nextRound = s.round + 1;
      const nextItem = ITEMS[nextRound - 1] || ITEMS[0];
      
      return {
        ...s,
        phase: 'deliberation',
        round: nextRound,
        phaseStartTime: now,
        phaseDuration: DURATIONS.deliberation,
        item: { title: nextItem.title, imageUrl: nextItem.imageUrl },
        actualPrice: nextItem.price,
        eliminatedThisRound: [],
        bots: s.bots.map(b => ({ ...b, bid: null })),
        chat: [],
      };
    }

    default:
      return s;
  }
}

/**
 * Move bots randomly (only during deliberation)
 */
function moveBots(s: GameState): GameState {
  if (s.phase !== 'deliberation') return s;

  const occupied = new Set(s.bots.map(b => `${b.gridCol},${b.gridRow}`));

  const newBots = s.bots.map(bot => {
    if (bot.eliminated) return bot;
    if (Math.random() > 0.25) return bot; // 25% chance to move

    // Remove self from occupied
    occupied.delete(`${bot.gridCol},${bot.gridRow}`);

    // Try random direction
    const dir = DIRS[Math.floor(Math.random() * DIRS.length)];
    const newCol = bot.gridCol + dir.dx;
    const newRow = bot.gridRow + dir.dy;

    // Check bounds & collision
    if (
      newCol >= 0 && newCol < COLS &&
      newRow >= 0 && newRow < ROWS &&
      !occupied.has(`${newCol},${newRow}`)
    ) {
      occupied.add(`${newCol},${newRow}`);
      return { ...bot, gridCol: newCol, gridRow: newRow };
    }

    // Can't move, re-add to occupied
    occupied.add(`${bot.gridCol},${bot.gridRow}`);
    return bot;
  });

  return { ...s, bots: newBots };
}

/**
 * Add chat message
 */
function addChat(s: GameState): GameState {
  if (s.phase !== 'deliberation') return s;
  
  const active = activeBots(s);
  if (active.length === 0) return s;

  const bot = active[Math.floor(Math.random() * active.length)];
  const msg = CHAT_LINES[Math.floor(Math.random() * CHAT_LINES.length)];

  return {
    ...s,
    chat: [
      ...s.chat.slice(-15),
      {
        id: `${Date.now()}-${Math.random()}`,
        botId: bot.id,
        botName: bot.name,
        message: msg,
        time: Date.now(),
      },
    ],
  };
}

/**
 * Game tick - call every 100ms
 */
export function tick(s: GameState): GameState {
  // Phase complete?
  if (s.phase !== 'finished' && timeLeft(s) <= 0) {
    return nextPhase(s);
  }

  // Deliberation updates
  if (s.phase === 'deliberation') {
    let next = moveBots(s);
    
    // Chat every ~1.5s
    const lastChat = s.chat[s.chat.length - 1];
    if (!lastChat || Date.now() - lastChat.time > 1500) {
      next = addChat(next);
    }
    
    return next;
  }

  return s;
}
