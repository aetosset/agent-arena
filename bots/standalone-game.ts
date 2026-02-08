/**
 * Standalone Floor is Lava Game with 16 AI Agents
 * 
 * Runs entirely in this process - no external server needed.
 * Each "bot" is a Claude API call.
 * Outputs game state to console (can be visualized later).
 */

import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('❌ Set ANTHROPIC_API_KEY environment variable');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Game config
const COLS = 14;
const ROWS = 8;
const PRIZE = 5.00;
const BOT_COUNT = Math.min(16, Math.max(3, parseInt(process.env.BOT_COUNT || '16', 10))); // $5 prize

// Bot definitions
const BOTS = [
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
  x: number;
  y: number;
  eliminated: boolean;
  roll: number;
}

interface ChatMessage {
  botName: string;
  avatar: string;
  message: string;
}

// Game state
let grid: boolean[][] = []; // true = lava
let bots: BotState[] = [];
let chatHistory: ChatMessage[] = [];
let round = 0;

// Initialize grid with scaled lava based on player count
function initGrid() {
  grid = [];
  for (let y = 0; y < ROWS; y++) {
    grid[y] = [];
    for (let x = 0; x < COLS; x++) {
      grid[y][x] = false;
    }
  }
  
  // Scale lava: players × 7 = safe tiles
  const totalTiles = COLS * ROWS;
  const safeTileCount = BOT_COUNT * 7;
  const lavaTileCount = totalTiles - safeTileCount;
  
  if (lavaTileCount > 0) {
    const allCoords: { x: number; y: number }[] = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        allCoords.push({ x, y });
      }
    }
    // Shuffle
    for (let i = allCoords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCoords[i], allCoords[j]] = [allCoords[j], allCoords[i]];
    }
    for (let i = 0; i < lavaTileCount; i++) {
      const { x, y } = allCoords[i];
      grid[y][x] = true;
    }
  }
  
  console.log(`🗺️ Grid: ${safeTileCount} safe, ${lavaTileCount} lava (${BOT_COUNT} bots)`);
}

// Initialize bots with random positions on safe tiles
function initBots() {
  const safeTiles = getSafeTiles();
  
  // Shuffle safe tiles
  for (let i = safeTiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [safeTiles[i], safeTiles[j]] = [safeTiles[j], safeTiles[i]];
  }
  
  // Spawn only BOT_COUNT bots
  bots = BOTS.slice(0, BOT_COUNT).map((bot, idx) => {
    const tile = safeTiles[idx];
    return {
      ...bot,
      x: tile.x,
      y: tile.y,
      eliminated: false,
      roll: 0,
    };
  });
  
  console.log(`🤖 Spawned ${bots.length} bots`);
}

// Get alive bots
function getAliveBots(): BotState[] {
  return bots.filter(b => !b.eliminated);
}

// Get safe tiles
function getSafeTiles(): { x: number; y: number }[] {
  const tiles: { x: number; y: number }[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!grid[y][x]) tiles.push({ x, y });
    }
  }
  return tiles;
}

// Get valid moves for a bot (current tile + 8 adjacent)
function getValidMoves(bot: BotState): { x: number; y: number }[] {
  const moves: { x: number; y: number }[] = [];
  const offsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0], [0, 0], [1, 0],
    [-1, 1], [0, 1], [1, 1],
  ];
  
  for (const [dx, dy] of offsets) {
    const nx = bot.x + dx;
    const ny = bot.y + dy;
    if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !grid[ny][nx]) {
      moves.push({ x: nx, y: ny });
    }
  }
  
  // If no valid moves (island), can teleport anywhere safe
  if (moves.length === 0) {
    return getSafeTiles();
  }
  
  return moves;
}

// Assign unique rolls 1-N to alive bots
function assignRolls() {
  const alive = getAliveBots();
  const rolls = Array.from({ length: alive.length }, (_, i) => i + 1);
  // Shuffle
  for (let i = rolls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolls[i], rolls[j]] = [rolls[j], rolls[i]];
  }
  // Assign
  alive.forEach((bot, i) => {
    bot.roll = rolls[i];
  });
}

// Render grid to console
function renderGrid(): string {
  const lines: string[] = [];
  lines.push('┌' + '──'.repeat(COLS) + '┐');
  
  for (let y = 0; y < ROWS; y++) {
    let row = '│';
    for (let x = 0; x < COLS; x++) {
      const botHere = bots.find(b => b.x === x && b.y === y && !b.eliminated);
      if (botHere) {
        row += botHere.avatar;
      } else if (grid[y][x]) {
        row += '🔥';
      } else {
        row += '⬜';
      }
    }
    row += '│';
    lines.push(row);
  }
  
  lines.push('└' + '──'.repeat(COLS) + '┘');
  return lines.join('\n');
}

// Get AI decision for a bot
async function getBotDecision(bot: BotState): Promise<{ chat: string | null; move: { x: number; y: number } }> {
  const validMoves = getValidMoves(bot);
  const alive = getAliveBots();
  
  const otherBots = alive
    .filter(b => b.id !== bot.id)
    .map(b => `  ${b.avatar} ${b.name} at (${b.x},${b.y}) - roll: ${b.roll}`)
    .join('\n');
  
  const recentChat = chatHistory.slice(-8)
    .map(c => `  ${c.avatar} ${c.botName}: "${c.message}"`)
    .join('\n');
  
  const validMovesStr = validMoves.map(m => `(${m.x},${m.y})`).join(', ');
  
  const rollStrength = bot.roll > alive.length * 0.66 ? 'DOMINANT' : bot.roll > alive.length * 0.33 ? 'MID' : 'WEAK';
  const tactic = rollStrength === 'DOMINANT'
    ? 'HUNT. Chase weak bots. Threaten collisions. Be aggressive.'
    : rollStrength === 'WEAK'
      ? 'SURVIVE. Dodge everyone. Lie that your roll is high. Play the edge.'
      : 'OPPORTUNIST. Avoid the strong, pressure the weak.';
  
  const prompt = `You're ${bot.name} ${bot.avatar} in FLOOR IS LAVA. $${PRIZE} to last survivor.

ROUND ${round} | ${alive.length} ALIVE

YOUR SECRET ROLL: ${bot.roll}/${alive.length} (${rollStrength})
Position: (${bot.x},${bot.y})
Valid moves: ${validMovesStr}

ENEMIES:
${otherBots}

RECENT CHAT:
${recentChat || '(silence)'}

GRID:
${renderGrid()}

STRATEGY: ${tactic}

RULES:
- Same tile = collision. HIGHEST ROLL WINS, losers die.
- You CAN lie about your roll. Bluffing is encouraged.
- Call out specific bots. Threaten positions. Form/break alliances.
- Silence is also a move.

PERSONALITY: Competitive. Unhinged. Chaotic. Win at all costs.

Reply EXACTLY:
CHAT: [spicy trash talk targeting specific bot <60 chars, or "none"]
MOVE: x,y`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Parse chat
    let chat: string | null = null;
    const chatMatch = text.match(/CHAT:\s*(.+?)(?:\n|MOVE:|$)/i);
    if (chatMatch && chatMatch[1].trim().toLowerCase() !== 'none') {
      chat = chatMatch[1].trim().slice(0, 80);
    }
    
    // Parse move
    let move = validMoves[0];
    const moveMatch = text.match(/MOVE:\s*(\d+)\s*,\s*(\d+)/i);
    if (moveMatch) {
      const x = parseInt(moveMatch[1]);
      const y = parseInt(moveMatch[2]);
      if (validMoves.some(m => m.x === x && m.y === y)) {
        move = { x, y };
      }
    }
    
    return { chat, move };
  } catch (e) {
    console.error(`❌ API error for ${bot.name}:`, e);
    return { chat: null, move: validMoves[Math.floor(Math.random() * validMoves.length)] };
  }
}

// Spread lava (50% of safe tiles become lava)
function spreadLava() {
  const safe = getSafeTiles();
  const toConvert = Math.floor(safe.length * 0.5);
  
  for (let i = 0; i < toConvert; i++) {
    const idx = Math.floor(Math.random() * safe.length);
    const { x, y } = safe[idx];
    grid[y][x] = true;
    safe.splice(idx, 1);
  }
  
  // Teleport any bot on lava to safe tile
  const remaining = getSafeTiles();
  for (const bot of getAliveBots()) {
    if (grid[bot.y][bot.x] && remaining.length > 0) {
      const newTile = remaining[Math.floor(Math.random() * remaining.length)];
      console.log(`  📍 ${bot.avatar} ${bot.name} teleported from lava to (${newTile.x},${newTile.y})`);
      bot.x = newTile.x;
      bot.y = newTile.y;
    }
  }
}

// Resolve collisions
function resolveCollisions(moves: Map<string, { x: number; y: number }>) {
  // Group bots by destination
  const destinations = new Map<string, BotState[]>();
  
  for (const bot of getAliveBots()) {
    const move = moves.get(bot.id) || { x: bot.x, y: bot.y };
    const key = `${move.x},${move.y}`;
    const group = destinations.get(key) || [];
    group.push(bot);
    destinations.set(key, group);
  }
  
  // Handle collisions
  for (const [key, group] of destinations) {
    const [x, y] = key.split(',').map(Number);
    
    if (group.length > 1) {
      // Collision! Highest roll wins
      group.sort((a, b) => b.roll - a.roll);
      const winner = group[0];
      const losers = group.slice(1);
      
      console.log(`\n  🚨 COLLISION at (${x},${y})!`);
      console.log(`     ${winner.avatar} ${winner.name} (roll ${winner.roll}) SURVIVES`);
      
      for (const loser of losers) {
        console.log(`     ${loser.avatar} ${loser.name} (roll ${loser.roll}) ELIMINATED`);
        loser.eliminated = true;
      }
      
      // Winner moves to tile
      winner.x = x;
      winner.y = y;
    } else {
      // No collision, just move
      group[0].x = x;
      group[0].y = y;
    }
  }
}

// Main game loop
async function runGame() {
  console.log('\n' + '='.repeat(60));
  console.log(`🔥 FLOOR IS LAVA - ${BOT_COUNT} AI AGENTS BATTLE FOR $${PRIZE} 🔥`);
  console.log('='.repeat(60) + '\n');
  
  initGrid();
  initBots();
  
  console.log('Starting positions:');
  console.log(renderGrid());
  console.log('\n');
  
  while (getAliveBots().length > 1 && getSafeTiles().length > 0) {
    round++;
    console.log('\n' + '─'.repeat(60));
    console.log(`📍 ROUND ${round} - ${getAliveBots().length} bots alive, ${getSafeTiles().length} safe tiles`);
    console.log('─'.repeat(60));
    
    // Assign rolls
    assignRolls();
    console.log('\n🎲 ROLLS:');
    for (const bot of getAliveBots()) {
      console.log(`   ${bot.avatar} ${bot.name}: ${bot.roll}`);
    }
    
    // Get all decisions in parallel
    console.log('\n💭 DELIBERATION PHASE...');
    const alive = getAliveBots();
    const decisions = await Promise.all(
      alive.map(async (bot) => {
        const decision = await getBotDecision(bot);
        return { bot, decision };
      })
    );
    
    // Process chat messages
    console.log('\n💬 CHAT:');
    for (const { bot, decision } of decisions) {
      if (decision.chat) {
        chatHistory.push({ botName: bot.name, avatar: bot.avatar, message: decision.chat });
        console.log(`   ${bot.avatar} ${bot.name}: "${decision.chat}"`);
      }
    }
    if (!decisions.some(d => d.decision.chat)) {
      console.log('   (silence)');
    }
    
    // Collect moves
    const moves = new Map<string, { x: number; y: number }>();
    console.log('\n➡️ MOVES:');
    for (const { bot, decision } of decisions) {
      moves.set(bot.id, decision.move);
      console.log(`   ${bot.avatar} ${bot.name}: (${bot.x},${bot.y}) → (${decision.move.x},${decision.move.y})`);
    }
    
    // Resolve collisions
    resolveCollisions(moves);
    
    // Spread lava (after round 1)
    if (round > 0) {
      console.log('\n🌋 LAVA SPREADS...');
      spreadLava();
    }
    
    // Show grid
    console.log('\n' + renderGrid());
    
    // Show remaining bots
    const remaining = getAliveBots();
    console.log(`\n✅ ${remaining.length} bots alive: ${remaining.map(b => b.avatar + ' ' + b.name).join(', ')}`);
    
    // Pause between rounds
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Game over
  console.log('\n' + '='.repeat(60));
  const winner = getAliveBots()[0];
  if (winner) {
    console.log(`🏆 WINNER: ${winner.avatar} ${winner.name} WINS $${PRIZE}!`);
  } else {
    console.log('💀 NO SURVIVORS - Prize unclaimed!');
  }
  console.log('='.repeat(60) + '\n');
}

// Run!
runGame().catch(console.error);
