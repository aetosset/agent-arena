/**
 * Floor is Lava - Live Game Server
 * 
 * Runs the AI game and broadcasts to frontend viewers via WebSocket
 * Frontend connects and renders the game in real-time
 */

import Anthropic from '@anthropic-ai/sdk';
import { WebSocketServer, WebSocket } from 'ws';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('❌ Set ANTHROPIC_API_KEY');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const PORT = 3003;
const BOT_COUNT = Math.min(16, Math.max(3, parseInt(process.env.BOT_COUNT || '16', 10)));

// WebSocket server for viewers
const wss = new WebSocketServer({ port: PORT });
const viewers: Set<WebSocket> = new Set();

wss.on('connection', (ws) => {
  console.log('👁️ Viewer connected');
  viewers.add(ws);
  ws.on('close', () => {
    viewers.delete(ws);
    console.log('👁️ Viewer disconnected');
  });
});

function broadcast(event: any) {
  const msg = JSON.stringify(event);
  viewers.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

// Game config
const COLS = 14;
const ROWS = 8;
const PRIZE = 5.00;

const BOTS_CONFIG = [
  { id: 'bot-1', name: 'GROK-V3', avatar: '🤖' },
  { id: 'bot-2', name: 'SNIPE-BOT', avatar: '🦾' },
  { id: 'bot-3', name: 'ARCH-V', avatar: '👾' },
  { id: 'bot-4', name: 'HYPE-AI', avatar: '🔮' },
  { id: 'bot-5', name: 'BID-LORD', avatar: '🧠' },
  { id: 'bot-6', name: 'FLUX-8', avatar: '⚡' },
  { id: 'bot-7', name: 'NEO-BOT', avatar: '💎' },
  { id: 'bot-8', name: 'ZEN-BOT', avatar: '🎯' },
  { id: 'bot-9', name: 'PYRO-X', avatar: '🔥' },
  { id: 'bot-10', name: 'FROST', avatar: '❄️' },
  { id: 'bot-11', name: 'SHADOW', avatar: '👤' },
  { id: 'bot-12', name: 'VENOM', avatar: '🐍' },
  { id: 'bot-13', name: 'TITAN', avatar: '🗿' },
  { id: 'bot-14', name: 'NOVA', avatar: '💫' },
  { id: 'bot-15', name: 'APEX', avatar: '🦅' },
  { id: 'bot-16', name: 'CIPHER', avatar: '💻' },
];

interface BotState {
  id: string;
  name: string;
  avatar: string;
  col: number;
  row: number;
  eliminated: boolean;
  roll: number;
  committedCol: number | null;
  committedRow: number | null;
}

interface ChatMessage {
  botId: string;
  botName: string;
  avatar: string;
  text: string;
  time: number;
}

// Game state
let grid: boolean[][] = [];
let bots: BotState[] = [];
let chat: ChatMessage[] = [];
let round = 0;
let phase: 'walking' | 'deliberation' | 'reveal' | 'resolve' | 'finished' = 'walking';

function initGrid() {
  grid = [];
  for (let y = 0; y < ROWS; y++) {
    grid[y] = [];
    for (let x = 0; x < COLS; x++) {
      grid[y][x] = false;
    }
  }
  
  // Scale lava based on player count: players × 7 = safe tiles
  const totalTiles = COLS * ROWS; // 112
  const safeTileCount = BOT_COUNT * 7;
  const lavaTileCount = totalTiles - safeTileCount;
  
  if (lavaTileCount > 0) {
    const allCoords: { x: number; y: number }[] = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        allCoords.push({ x, y });
      }
    }
    // Shuffle and convert to lava
    for (let i = allCoords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCoords[i], allCoords[j]] = [allCoords[j], allCoords[i]];
    }
    for (let i = 0; i < lavaTileCount; i++) {
      const { x, y } = allCoords[i];
      grid[y][x] = true;
    }
  }
  
  console.log(`🗺️ Grid initialized: ${safeTileCount} safe, ${lavaTileCount} lava (${BOT_COUNT} bots)`);
}

function initBots() {
  const used = new Set<string>();
  const safeTiles = getSafeTiles();
  
  // Shuffle safe tiles for random spawn
  for (let i = safeTiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [safeTiles[i], safeTiles[j]] = [safeTiles[j], safeTiles[i]];
  }
  
  // Only spawn BOT_COUNT bots
  bots = BOTS_CONFIG.slice(0, BOT_COUNT).map((bot, idx) => {
    const tile = safeTiles[idx];
    return {
      ...bot,
      col: tile.x,
      row: tile.y,
      eliminated: false,
      roll: 0,
      committedCol: null,
      committedRow: null,
    };
  });
  
  console.log(`🤖 Spawned ${bots.length} bots`);
}

function getAliveBots() {
  return bots.filter(b => !b.eliminated);
}

function getSafeTiles() {
  const tiles: { x: number; y: number }[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!grid[y][x]) tiles.push({ x, y });
    }
  }
  return tiles;
}

function getValidMoves(bot: BotState) {
  const moves: { x: number; y: number }[] = [];
  const offsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0], [0, 0], [1, 0],
    [-1, 1], [0, 1], [1, 1],
  ];
  
  for (const [dx, dy] of offsets) {
    const nx = bot.col + dx;
    const ny = bot.row + dy;
    if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !grid[ny][nx]) {
      moves.push({ x: nx, y: ny });
    }
  }
  
  if (moves.length === 0) return getSafeTiles();
  return moves;
}

function assignRolls() {
  const alive = getAliveBots();
  const rolls = Array.from({ length: alive.length }, (_, i) => i + 1);
  for (let i = rolls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolls[i], rolls[j]] = [rolls[j], rolls[i]];
  }
  alive.forEach((bot, i) => {
    bot.roll = rolls[i];
  });
}

function broadcastState() {
  broadcast({
    type: 'game_state',
    phase,
    round,
    grid,
    bots,
    chat: chat.slice(-30),
  });
}

async function getBotDecision(bot: BotState): Promise<{ chat: string | null; move: { x: number; y: number } }> {
  const validMoves = getValidMoves(bot);
  const alive = getAliveBots();
  
  const otherBots = alive
    .filter(b => b.id !== bot.id)
    .map(b => `${b.avatar} ${b.name} at (${b.col},${b.row}) roll:${b.roll}`)
    .join(', ');
  
  const rollStrength = bot.roll > alive.length * 0.66 ? 'STRONG' : bot.roll > alive.length * 0.33 ? 'MEDIUM' : 'WEAK';
  const rollAdvice = rollStrength === 'STRONG' 
    ? 'Hunt weaker bots! Threaten collisions.'
    : rollStrength === 'WEAK' 
      ? 'AVOID everyone. Lie about your roll being high.'
      : 'Play it safe but look for opportunities.';
  
  const prompt = `You're ${bot.name}, a ruthless AI in FLOOR IS LAVA. $${PRIZE} to the last survivor.

YOUR SECRET: Roll ${bot.roll}/${alive.length} (${rollStrength})
Position: (${bot.col},${bot.row})

ENEMIES: ${otherBots}
Valid moves: ${validMoves.map(m => `(${m.x},${m.y})`).join(', ')}

TACTICS:
- ${rollAdvice}
- LIE about your roll freely - bluffing is legal
- Call out SPECIFIC bots by name, threaten their positions
- Form fake alliances then betray
- Silence can be powerful too

PERSONALITY: You're competitive, trash-talking, maybe unhinged. Channel chaos.

Reply EXACTLY (nothing else):
CHAT: [spicy message <50 chars targeting specific bot, or "none"]
MOVE: x,y`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    
    let chatMsg: string | null = null;
    const chatMatch = text.match(/CHAT:\s*(.+?)(?:\n|MOVE:|$)/i);
    if (chatMatch && chatMatch[1].trim().toLowerCase() !== 'none') {
      chatMsg = chatMatch[1].trim().slice(0, 60);
    }
    
    let move = validMoves[0];
    const moveMatch = text.match(/MOVE:\s*(\d+)\s*,\s*(\d+)/i);
    if (moveMatch) {
      const x = parseInt(moveMatch[1]);
      const y = parseInt(moveMatch[2]);
      if (validMoves.some(m => m.x === x && m.y === y)) {
        move = { x, y };
      }
    }
    
    return { chat: chatMsg, move };
  } catch (e) {
    return { chat: null, move: validMoves[Math.floor(Math.random() * validMoves.length)] };
  }
}

function spreadLava() {
  const safe = getSafeTiles();
  const toConvert = Math.floor(safe.length * 0.5);
  
  for (let i = 0; i < toConvert; i++) {
    const idx = Math.floor(Math.random() * safe.length);
    const { x, y } = safe[idx];
    grid[y][x] = true;
    safe.splice(idx, 1);
  }
  
  // Teleport bots on lava
  const remaining = getSafeTiles();
  for (const bot of getAliveBots()) {
    if (grid[bot.row][bot.col] && remaining.length > 0) {
      const tile = remaining[Math.floor(Math.random() * remaining.length)];
      bot.col = tile.x;
      bot.row = tile.y;
    }
  }
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function runGame() {
  console.log(`\n🔥 FLOOR IS LAVA - Waiting for viewers on ws://localhost:${PORT}`);
  
  // Wait for at least one viewer
  while (viewers.size === 0) {
    await sleep(1000);
  }
  console.log('👁️ Viewer connected - starting game!');
  
  initGrid();
  initBots();
  round = 0;
  chat = [];
  
  broadcast({ type: 'game_start', bots, grid });
  await sleep(2000);
  
  while (getAliveBots().length > 1 && getSafeTiles().length > 0) {
    round++;
    
    // WALKING PHASE
    phase = 'walking';
    broadcastState();
    await sleep(3000); // Shorter for demo
    
    // DELIBERATION PHASE - assign rolls, get AI decisions
    phase = 'deliberation';
    assignRolls();
    broadcastState();
    
    console.log(`\n📍 Round ${round} - Getting AI decisions...`);
    
    const alive = getAliveBots();
    const decisions = await Promise.all(
      alive.map(async (bot) => {
        const decision = await getBotDecision(bot);
        return { bot, decision };
      })
    );
    
    // Add chat messages
    for (const { bot, decision } of decisions) {
      if (decision.chat) {
        chat.push({
          botId: bot.id,
          botName: bot.name,
          avatar: bot.avatar,
          text: decision.chat,
          time: Date.now(),
        });
        broadcastState();
        await sleep(300);
      }
    }
    
    await sleep(2000);
    
    // REVEAL PHASE - show commits
    phase = 'reveal';
    for (const { bot, decision } of decisions) {
      bot.committedCol = decision.move.x;
      bot.committedRow = decision.move.y;
    }
    
    // Check for collisions
    const collisions: { col: number; row: number; bots: BotState[] }[] = [];
    const destinations = new Map<string, BotState[]>();
    for (const bot of alive) {
      const key = `${bot.committedCol},${bot.committedRow}`;
      const group = destinations.get(key) || [];
      group.push(bot);
      destinations.set(key, group);
    }
    for (const [key, group] of destinations) {
      if (group.length > 1) {
        const [col, row] = key.split(',').map(Number);
        collisions.push({ col, row, bots: group });
      }
    }
    
    broadcast({ type: 'reveal', bots, collisions });
    broadcastState();
    await sleep(5000);
    
    // RESOLVE PHASE - move and eliminate
    phase = 'resolve';
    
    for (const collision of collisions) {
      collision.bots.sort((a, b) => b.roll - a.roll);
      const winner = collision.bots[0];
      const losers = collision.bots.slice(1);
      
      // Add collision message to chat
      const loserNames = losers.map(l => `${l.avatar}${l.name}(🎲${l.roll})`).join(', ');
      chat.push({
        botId: 'system',
        botName: 'SYSTEM',
        avatar: '🚨',
        text: `COLLISION! ${winner.avatar}${winner.name}(🎲${winner.roll}) eliminated ${loserNames}`,
        time: Date.now(),
      });
      
      for (const loser of losers) {
        loser.eliminated = true;
      }
    }
    
    // Move survivors
    for (const bot of getAliveBots()) {
      if (bot.committedCol !== null) bot.col = bot.committedCol;
      if (bot.committedRow !== null) bot.row = bot.committedRow;
      bot.committedCol = null;
      bot.committedRow = null;
    }
    
    broadcastState();
    await sleep(2000);
    
    // Spread lava
    spreadLava();
    broadcastState();
    await sleep(1000);
  }
  
  // FINISHED
  phase = 'finished';
  const winner = getAliveBots()[0];
  broadcast({ 
    type: 'game_end', 
    winner: winner ? { name: winner.name, avatar: winner.avatar } : null,
    prize: PRIZE,
  });
  broadcastState();
  
  console.log(`\n🏆 ${winner ? `${winner.avatar} ${winner.name} WINS $${PRIZE}!` : 'No winner'}`);
}

console.log(`🎮 Game server starting on ws://localhost:${PORT}`);
runGame().catch(console.error);
