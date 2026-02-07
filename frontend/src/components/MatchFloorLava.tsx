'use client';

import { useState, useEffect, useRef } from 'react';

// ========== SOUND EFFECTS ==========
const audioContextRef = { current: null as AudioContext | null };
let audioInitialized = false;

function initAudio() {
  if (audioInitialized) return;
  try {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioInitialized = true;
  } catch (e) {}
}

function playBotSound() {
  try {
    if (!audioContextRef.current) {
      initAudio();
    }
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    // Resume if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const baseFreq = 500 + Math.random() * 300;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, ctx.currentTime + 0.1);
    osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02); // Louder
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.log('Audio error:', e);
  }
}

function playEliminationSound() {
  try {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    // Descending tone for elimination
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

// ========== TYPES ==========
type Phase = 'walking' | 'deliberation' | 'reveal' | 'resolve' | 'finished';

interface Bot {
  id: string;
  name: string;
  avatar: string;
  eliminated: boolean;
  eliminatedThisRound: boolean;
  col: number;
  row: number;
  // Committed position for resolve phase
  committedCol: number | null;
  committedRow: number | null;
  // Pre-resolve position (where bot was before moving)
  preCol: number | null;
  preRow: number | null;
  // Dice roll for collision resolution (assigned at deliberation start)
  roll: number | null;
}

interface ChatMsg {
  id: string;
  botId: string;
  botName: string;
  avatar: string;
  text: string;
  time: number;
}

interface CollisionInfo {
  col: number;
  row: number;
  botIds: string[];
  loserIds: string[]; // All bots that lose collision (all except 1 survivor)
  winnerId: string;   // The one survivor
  // Roll results for display
  rolls: { botId: string; botName: string; avatar: string; roll: number }[];
}

interface Game {
  phase: Phase;
  round: number;
  startTime: number;
  bots: Bot[];
  chat: ChatMsg[];
  grid: boolean[][]; // true = lava, false = safe
  collisions: CollisionInfo[]; // Track collisions for resolve phase
  eliminatedThisRound: string[]; // Bot IDs eliminated this round
}

// ========== CONSTANTS ==========
const COLS = 14;
const ROWS = 8;
const CELL = 72;

const PHASE_MS = {
  walking: 8000,       // Bots wander around
  deliberation: 10000, // Bots stop, chat, select tile at END
  reveal: 5000,        // Show committed tiles (blue/red)
  resolve: 3000,       // Move, eliminate, spread lava
};

const AVATAR_COLORS: Record<string, string> = {
  '🤖': 'rgba(59, 130, 246, 0.3)',
  '🦾': 'rgba(234, 179, 8, 0.3)',
  '👾': 'rgba(168, 85, 247, 0.3)',
  '🔮': 'rgba(236, 72, 153, 0.3)',
  '🧠': 'rgba(244, 114, 182, 0.3)',
  '⚡': 'rgba(250, 204, 21, 0.3)',
  '💎': 'rgba(34, 211, 238, 0.3)',
  '🎯': 'rgba(239, 68, 68, 0.3)',
  '🔥': 'rgba(249, 115, 22, 0.3)',
  '❄️': 'rgba(147, 197, 253, 0.3)',
  '👤': 'rgba(156, 163, 175, 0.3)',
  '🐍': 'rgba(34, 197, 94, 0.3)',
  '🗿': 'rgba(168, 162, 158, 0.3)',
  '💫': 'rgba(251, 191, 36, 0.3)',
  '🦅': 'rgba(120, 113, 108, 0.3)',
  '💻': 'rgba(99, 102, 241, 0.3)',
};

const CHAT_LINES = [
  "I'm going top right, anyone else?",
  "Sure, I'll avoid that area 😏",
  "Don't trust SNIPE, he lies every round",
  "Alliance with PYRO, we split bottom",
  "Confirmed. NEO is solid.",
  "Everyone targeting me? I see how it is",
  "LEEROY JENKINS",
  "Taking the corner. Stay away.",
  "Let's coordinate - I go left, you go right",
  "I don't trust any of you",
  "Calculating optimal position...",
  "I'll remember this betrayal",
  "Solo play. Don't follow me.",
  "Who's going center?",
  "The floor is literally lava 🔥",
  "RIP to whoever goes bottom left",
];

// ========== INIT ==========
function createBots(): Bot[] {
  const names = ['GROK-V3', 'SNIPE-BOT', 'ARCH-V', 'HYPE-AI', 'BID-LORD', 'FLUX-8', 'NEO-BOT', 'ZEN-BOT',
                 'PYRO-X', 'FROST', 'SHADOW', 'VENOM', 'TITAN', 'NOVA', 'APEX', 'CIPHER'];
  const avatars = ['🤖', '🦾', '👾', '🔮', '🧠', '⚡', '💎', '🎯', '🔥', '❄️', '👤', '🐍', '🗿', '💫', '🦅', '💻'];
  
  const positions: { col: number; row: number }[] = [];
  const used = new Set<string>();
  
  for (let i = 0; i < 16; i++) {
    let col, row;
    do {
      col = 1 + Math.floor(Math.random() * (COLS - 2));
      row = 1 + Math.floor(Math.random() * (ROWS - 2));
    } while (used.has(`${col},${row}`));
    used.add(`${col},${row}`);
    positions.push({ col, row });
  }
  
  return names.map((name, i) => ({
    id: `bot-${i}`,
    name,
    avatar: avatars[i],
    eliminated: false,
    eliminatedThisRound: false,
    col: positions[i].col,
    row: positions[i].row,
    committedCol: null,
    committedRow: null,
    preCol: null,
    preRow: null,
    roll: null,
  }));
}

function createGame(): Game {
  const grid: boolean[][] = [];
  for (let y = 0; y < ROWS; y++) {
    grid[y] = [];
    for (let x = 0; x < COLS; x++) {
      grid[y][x] = false;
    }
  }
  
  return {
    phase: 'walking',
    round: 1,
    startTime: Date.now(),
    bots: createBots(),
    chat: [],
    grid,
    collisions: [],
    eliminatedThisRound: [],
  };
}

function formatTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

// ========== COMPONENT ==========
export default function MatchFloorLava() {
  const [game, setGame] = useState<Game>(createGame);
  const [now, setNow] = useState(Date.now());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevChatLengthRef = useRef(0);

  // Timer tick
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  // Initialize audio on first user interaction (browser policy)
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Chat sound effect + scroll (container only, not page!)
  useEffect(() => {
    // Scroll chat container only - use scrollTop instead of scrollIntoView
    const chatContainer = chatEndRef.current?.parentElement;
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    if (game.chat.length > prevChatLengthRef.current) {
      playBotSound();
    }
    prevChatLengthRef.current = game.chat.length;
  }, [game.chat.length]);

  // 8-direction adjacency offsets (including diagonals)
  const ADJACENT_OFFSETS = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1],
  ];

  // Phase management
  useEffect(() => {
    const elapsed = now - game.startTime;
    const phaseDuration = PHASE_MS[game.phase as keyof typeof PHASE_MS] || 5000;

    if (elapsed >= phaseDuration) {
      setGame(g => {
        // WALKING → DELIBERATION: Bots stop moving, get assigned dice rolls
        if (g.phase === 'walking') {
          const botsWithRolls = g.bots.map(bot => ({
            ...bot,
            roll: bot.eliminated ? null : Math.floor(Math.random() * 6) + 1, // 1-6
          }));
          return { ...g, phase: 'deliberation' as Phase, startTime: Date.now(), bots: botsWithRolls };
        }
        
        // DELIBERATION → REVEAL: Bots commit their tiles, calculate collisions
        if (g.phase === 'deliberation') {
          const safeTiles: { x: number; y: number }[] = [];
          for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
              if (!g.grid[y][x]) safeTiles.push({ x, y });
            }
          }
          
          // Each bot commits to current tile OR adjacent safe tile
          const newBots = g.bots.map(bot => {
            if (bot.eliminated) return bot;
            
            const validTiles: { x: number; y: number }[] = [];
            if (!g.grid[bot.row]?.[bot.col]) {
              validTiles.push({ x: bot.col, y: bot.row });
            }
            for (const [dx, dy] of ADJACENT_OFFSETS) {
              const nx = bot.col + dx;
              const ny = bot.row + dy;
              if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !g.grid[ny]?.[nx]) {
                validTiles.push({ x: nx, y: ny });
              }
            }
            
            // Island: teleport anywhere
            if (validTiles.length === 0) {
              const tile = safeTiles[Math.floor(Math.random() * safeTiles.length)];
              return { ...bot, committedCol: tile.x, committedRow: tile.y };
            }
            
            const tile = validTiles[Math.floor(Math.random() * validTiles.length)];
            return { ...bot, committedCol: tile.x, committedRow: tile.y };
          });
          
          // Calculate collisions (for display during reveal)
          const aliveBots = newBots.filter(b => !b.eliminated);
          const collisions: CollisionInfo[] = [];
          const eliminatedIds: string[] = [];
          
          const positionMap = new Map<string, Bot[]>();
          aliveBots.forEach(bot => {
            if (bot.committedCol !== null && bot.committedRow !== null) {
              const key = `${bot.committedCol},${bot.committedRow}`;
              const existing = positionMap.get(key) || [];
              existing.push(bot);
              positionMap.set(key, existing);
            }
          });
          
          // Collision: HIGHEST ROLL survives, ALL others eliminated
          positionMap.forEach((bots, key) => {
            if (bots.length > 1) {
              const [col, row] = key.split(',').map(Number);
              
              // Sort by roll (highest first), use bot id as tiebreaker
              const sorted = [...bots].sort((a, b) => {
                const rollDiff = (b.roll || 0) - (a.roll || 0);
                if (rollDiff !== 0) return rollDiff;
                return a.id.localeCompare(b.id); // Tiebreaker
              });
              
              const winner = sorted[0];
              const losers = sorted.slice(1);
              
              // Build rolls array for display
              const rolls = bots.map(bot => ({
                botId: bot.id,
                botName: bot.name,
                avatar: bot.avatar,
                roll: bot.roll || 0,
              }));
              
              collisions.push({ 
                col, row, 
                botIds: bots.map(b => b.id), 
                loserIds: losers.map(b => b.id), 
                winnerId: winner.id,
                rolls,
              });
              eliminatedIds.push(...losers.map(b => b.id));
            }
          });
          
          // Check for bots landing on lava
          aliveBots.forEach(bot => {
            if (bot.committedCol !== null && bot.committedRow !== null) {
              if (g.grid[bot.committedRow]?.[bot.committedCol]) {
                // Landed on lava!
                if (!eliminatedIds.includes(bot.id)) {
                  eliminatedIds.push(bot.id);
                }
              }
            }
          });
          
          // Store pre-move positions for reveal animation
          const revealBots = newBots.map(bot => ({
            ...bot,
            preCol: bot.col,
            preRow: bot.row,
            eliminatedThisRound: eliminatedIds.includes(bot.id),
          }));
          
          // Add collision messages to chat
          const collisionMessages: ChatMsg[] = collisions.map((collision, idx) => {
            const winner = collision.rolls.find(r => r.botId === collision.winnerId);
            const losers = collision.rolls.filter(r => collision.loserIds.includes(r.botId));
            
            // Format: "🚨 COLLISION! 🔥 PYRO-X (rolled 5) eliminated ❄️ FROST (rolled 2)"
            const loserText = losers.map(l => `${l.avatar} ${l.botName} (🎲${l.roll})`).join(', ');
            const winnerText = `${winner?.avatar} ${winner?.botName} (🎲${winner?.roll})`;
            
            return {
              id: `collision-${Date.now()}-${idx}`,
              botId: 'system',
              botName: 'SYSTEM',
              avatar: '🚨',
              text: `COLLISION! ${winnerText} eliminated ${loserText}`,
              time: Date.now(),
            };
          });
          
          return {
            ...g,
            phase: 'reveal' as Phase,
            startTime: Date.now(),
            bots: revealBots,
            chat: [...g.chat, ...collisionMessages].slice(-50),
            collisions,
            eliminatedThisRound: eliminatedIds,
          };
        }
        
        // REVEAL → RESOLVE: Move bots, eliminate losers, spread lava
        if (g.phase === 'reveal') {
          // Play elimination sound now (at end of resolve)
          if (g.eliminatedThisRound.length > 0) {
            playEliminationSound();
          }
          
          // Now actually move bots and eliminate
          const movedBots = g.bots.map(bot => {
            if (g.eliminatedThisRound.includes(bot.id)) {
              return { ...bot, eliminated: true };
            }
            if (!bot.eliminated && bot.committedCol !== null && bot.committedRow !== null) {
              return { ...bot, col: bot.committedCol, row: bot.committedRow };
            }
            return bot;
          });
          
          // Transition to next round - spread lava (50% reduction!)
          const newGrid = g.grid.map(row => [...row]);
          const safeTiles: { x: number; y: number }[] = [];
          
          for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
              if (!newGrid[y][x]) {
                safeTiles.push({ x, y });
              }
            }
          }
          
          // Convert 50% of safe tiles to lava
          const toConvert = Math.max(1, Math.floor(safeTiles.length * 0.5));
          for (let i = 0; i < toConvert && safeTiles.length > 0; i++) {
            const idx = Math.floor(Math.random() * safeTiles.length);
            const { x, y } = safeTiles[idx];
            newGrid[y][x] = true;
            safeTiles.splice(idx, 1);
          }
          
          // safeTiles now contains only remaining safe tiles after lava spread
          // Check if any alive bot is now on lava - teleport them to a safe tile
          const newBots = movedBots.map(bot => {
            if (bot.eliminated) return {
              ...bot,
              eliminatedThisRound: false,
              committedCol: null,
              committedRow: null,
              preCol: null,
              preRow: null,
              roll: null,
            };
            
            // Check if bot's current tile is now lava
            if (newGrid[bot.row]?.[bot.col] && safeTiles.length > 0) {
              // Teleport to a random safe tile
              const randomSafe = safeTiles[Math.floor(Math.random() * safeTiles.length)];
              return {
                ...bot,
                col: randomSafe.x,
                row: randomSafe.y,
                eliminatedThisRound: false,
                committedCol: null,
                committedRow: null,
                preCol: null,
                preRow: null,
                roll: null,
              };
            }
            
            // Bot is on safe tile, just reset state
            return {
              ...bot,
              eliminatedThisRound: false,
              committedCol: null,
              committedRow: null,
              preCol: null,
              preRow: null,
              roll: null,
            };
          });
          
          // Check if game is over (1 or fewer bots alive)
          const stillAlive = newBots.filter(b => !b.eliminated);
          if (stillAlive.length <= 1 || safeTiles.length === 0) {
            return {
              ...g,
              phase: 'finished' as Phase,
              startTime: Date.now(),
              grid: newGrid,
              bots: newBots,
              collisions: [],
              eliminatedThisRound: [],
            };
          }
          
          return {
            ...g,
            phase: 'walking' as Phase,
            round: g.round + 1,
            startTime: Date.now(),
            grid: newGrid,
            bots: newBots,
            collisions: [],
            eliminatedThisRound: [],
          };
        }
        return g;
      });
    }
  }, [game.phase, game.startTime, now]);

  // Bot chat during deliberation
  useEffect(() => {
    if (game.phase !== 'deliberation') return;
    
    const chatInterval = setInterval(() => {
      setGame(g => {
        if (g.phase !== 'deliberation') return g;
        const aliveBots = g.bots.filter(b => !b.eliminated);
        if (aliveBots.length === 0) return g;
        
        const bot = aliveBots[Math.floor(Math.random() * aliveBots.length)];
        const text = CHAT_LINES[Math.floor(Math.random() * CHAT_LINES.length)];
        
        const newChat = [...g.chat, {
          id: `msg-${Date.now()}-${Math.random()}`,
          botId: bot.id,
          botName: bot.name,
          avatar: bot.avatar,
          text,
          time: Date.now(),
        }].slice(-50);
        
        return { ...g, chat: newChat };
      });
    }, 2000);

    return () => clearInterval(chatInterval);
  }, [game.phase]);

  // Bot movement during WALKING phase only
  useEffect(() => {
    if (game.phase !== 'walking') return;
    
    const moveInterval = setInterval(() => {
      setGame(g => {
        if (g.phase !== 'walking') return g;
        
        return {
          ...g,
          bots: g.bots.map(bot => {
            if (bot.eliminated || Math.random() > 0.4) return bot;
            
            const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
            const newCol = Math.max(0, Math.min(COLS - 1, bot.col + dx));
            const newRow = Math.max(0, Math.min(ROWS - 1, bot.row + dy));
            
            if (!g.grid[newRow]?.[newCol]) {
              return { ...bot, col: newCol, row: newRow };
            }
            return bot;
          }),
        };
      });
    }, 600); // Slower movement

    return () => clearInterval(moveInterval);
  }, [game.phase]);

  const elapsed = now - game.startTime;
  const duration = PHASE_MS[game.phase as keyof typeof PHASE_MS] || 5000;
  const remaining = duration - elapsed;
  const aliveBots = game.bots.filter(b => !b.eliminated);
  const safeTileCount = game.grid.flat().filter(t => !t).length;
  
  // Find collision tiles for highlighting
  const collisionTiles = new Set(game.collisions.map(c => `${c.col},${c.row}`));
  
  // Build map of committed tiles to bot avatars (for reveal visualization)
  const committedTileMap = new Map<string, Bot[]>();
  if (game.phase === 'reveal') {
    game.bots.forEach(bot => {
      if (!bot.eliminated && bot.committedCol !== null && bot.committedRow !== null) {
        const key = `${bot.committedCol},${bot.committedRow}`;
        const existing = committedTileMap.get(key) || [];
        existing.push(bot);
        committedTileMap.set(key, existing);
      }
    });
  }

  // Find the winner (last bot standing)
  const winner = game.phase === 'finished' ? game.bots.find(b => !b.eliminated) : null;

  // ============ RENDER ============
  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden relative">
      {/* END SCREEN OVERLAY */}
      {game.phase === 'finished' && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="text-center p-8 bg-[#111] rounded-2xl border border-[var(--color-primary)]/30 shadow-2xl max-w-md mx-4">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2">MATCH COMPLETE</h1>
            <p className="text-gray-400 mb-6">Round {game.round} • {game.bots.filter(b => b.eliminated).length} bots eliminated</p>
            
            {winner ? (
              <div className="mb-6">
                <div className="text-gray-500 text-sm mb-2">WINNER</div>
                <div className="flex items-center justify-center gap-4">
                  <div 
                    className="w-20 h-20 rounded-xl text-5xl flex items-center justify-center border-2 border-[var(--color-primary)] shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                    style={{ backgroundColor: AVATAR_COLORS[winner.avatar] }}
                  >
                    {winner.avatar}
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold">{winner.name}</div>
                    <div className="text-[var(--color-primary)] font-bold">$5.00 Prize</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="text-gray-500 text-sm mb-2">NO SURVIVORS</div>
                <div className="text-xl text-red-400">Everyone got scrapped! 💀</div>
              </div>
            )}
            
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[var(--color-primary)] text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              WATCH ANOTHER MATCH
            </button>
          </div>
        </div>
      )}
      
      {/* Main Layout - FIXED HEIGHT, NO SCROLL */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Bot Roster */}
        <div className="w-64 border-r border-gray-800 flex flex-col bg-[#0a0a0a] overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex-shrink-0">
            <div className="text-white text-sm font-bold">MATCH INFO</div>
            <div className="text-gray-600 text-xs mt-1">{game.bots.length} bots • {aliveBots.length} alive</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800">
              <span className="text-gray-500 text-xs">Safe Tiles</span>
              <span className="text-[var(--color-primary)] font-bold text-sm">{safeTileCount}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-gray-500 text-xs">Prize Pool</span>
              <span className="text-[var(--color-primary)] font-bold text-sm">$5.00</span>
            </div>
          </div>
        
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Sort bots: alive first, then eliminated */}
            {[...game.bots].sort((a, b) => {
              if (a.eliminated === b.eliminated) return 0;
              return a.eliminated ? 1 : -1;
            }).map(bot => {
              const isElim = bot.eliminated;
              const justElim = bot.eliminatedThisRound;
              const isInCollision = game.collisions.some(c => c.botIds.includes(bot.id));
              
              return (
                <div 
                  key={bot.id}
                  className={`p-3 rounded-lg border transition-all ${
                    justElim 
                      ? 'bg-red-900/30 border-red-500/50 animate-pulse' 
                      : isElim 
                        ? 'bg-gray-900/30 border-gray-800/50 opacity-40' 
                        : isInCollision && (game.phase === 'reveal' || game.phase === 'resolve')
                          ? 'bg-yellow-900/30 border-yellow-500/50'
                          : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl relative ${
                        isElim ? 'grayscale' : ''
                      }`}
                      style={{ backgroundColor: isElim ? 'rgba(100,100,100,0.2)' : AVATAR_COLORS[bot.avatar] }}
                    >
                      {bot.avatar}
                      {isElim && <span className="absolute text-red-500 text-lg">✕</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm truncate ${isElim ? 'text-gray-500 line-through' : ''}`}>
                        {bot.name}
                      </div>
                      <div className="text-xs">
                        {justElim ? (
                          <span className="text-red-400 font-bold">💀 SCRAPPED!</span>
                        ) : isElim ? (
                          <span className="text-gray-600">Scrapped</span>
                        ) : isInCollision && (game.phase === 'reveal' || game.phase === 'resolve') ? (
                          <span className="text-yellow-400">⚠️ Collision!</span>
                        ) : game.phase === 'deliberation' && bot.roll ? (
                          <span className="text-blue-400">🎲 Rolled <span className="font-bold text-white">{bot.roll}</span></span>
                        ) : game.phase === 'deliberation' ? (
                          <span className="text-blue-400">Deliberating</span>
                        ) : (
                          <span className="text-[var(--color-primary)]">Active</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Main Content - NO SCROLL */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Game Status Bar */}
          <div className="py-3 border-b border-gray-800 flex items-center justify-between mx-auto" style={{ width: COLS * CELL }}>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-bold uppercase tracking-wider ${
                game.phase === 'walking' ? 'text-[var(--color-primary)] animate-pulse' :
                game.phase === 'deliberation' ? 'text-blue-400' :
                game.phase === 'reveal' ? 'text-yellow-400 animate-pulse' :
                game.phase === 'resolve' ? 'text-orange-400 animate-pulse' :
                'text-gray-400'
              }`}>
                {game.phase === 'walking' && '🚶 WALKING PHASE'}
                {game.phase === 'deliberation' && '🤝 DELIBERATION'}
                {game.phase === 'reveal' && '🎯 REVEALING CHOICES...'}
                {game.phase === 'resolve' && '💀 ROUND ENDS!'}
                {game.phase === 'finished' && '🏆 MATCH COMPLETE'}
              </span>
              <span className="text-gray-700">|</span>
              <span className="text-white font-bold text-sm">ROUND {game.round}</span>
            </div>
            
            <div className="flex items-center gap-6">
              {game.phase === 'resolve' && game.eliminatedThisRound.length > 0 && (
                <span className="text-red-400 text-sm font-bold animate-pulse">
                  💀 {game.eliminatedThisRound.length} ELIMINATED
                </span>
              )}
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-sm">👁</span>
                <span className="text-sm">24 watching</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">PRIZE</span>
                <span className="text-[var(--color-primary)] font-bold text-lg">$5.00</span>
              </div>
              <div className={`font-mono text-3xl font-bold ${
                game.phase === 'resolve' ? 'text-orange-400' : 'text-[var(--color-primary)]'
              }`}>
                {formatTime(remaining)}
              </div>
            </div>
          </div>

          {/* Banner Card */}
          <div className="py-4 flex justify-center">
            <div 
              className="bg-[#111] rounded-xl p-5 flex items-center gap-6 border border-[var(--color-primary)]/20"
              style={{ width: COLS * CELL }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg flex-shrink-0 border border-orange-400/30 flex items-center justify-center">
                <span className="text-4xl">🔥</span>
              </div>
              <div className="flex-1">
                <div className="text-[var(--color-primary)] text-xs font-bold tracking-wider mb-1">FLOOR IS LAVA</div>
                <h2 className="text-xl font-bold">Navigate the shrinking grid</h2>
                <div className="text-gray-500 text-sm mt-1">
                  {game.phase === 'resolve' && game.collisions.length > 0 
                    ? `⚠️ ${game.collisions.length} collision${game.collisions.length > 1 ? 's' : ''} detected!`
                    : 'Your tile becomes lava. Move or die.'
                  }
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 text-xs mb-1">SAFE TILES</div>
                <div className="text-3xl font-bold text-[var(--color-primary)]">{safeTileCount}</div>
              </div>
            </div>
          </div>

          {/* Grid Area */}
          <div className="flex-1 flex items-start justify-center px-6 pb-6">
            <div 
              className="relative bg-[#0d0d0d] rounded-xl overflow-hidden border border-gray-800 shadow-2xl"
              style={{ 
                width: COLS * CELL, 
                height: ROWS * CELL,
                backgroundImage: 'linear-gradient(rgba(255,100,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,100,0,0.02) 1px, transparent 1px)',
                backgroundSize: `${CELL}px ${CELL}px`
              }}
            >
              {/* Grid tiles */}
              {game.grid.map((row, y) =>
                row.map((isLava, x) => {
                  const tileKey = `${x},${y}`;
                  const isCollisionTile = collisionTiles.has(tileKey) && game.phase === 'resolve';
                  const committedBots = committedTileMap.get(tileKey) || [];
                  const hasCommittedBot = committedBots.length > 0;
                  const isShowingCommits = game.phase === 'reveal' && hasCommittedBot;
                  const hasMultipleBots = committedBots.length > 1;
                  
                  return (
                    <div
                      key={tileKey}
                      className={`absolute transition-all duration-500 ${
                        isLava
                          ? 'bg-gradient-to-br from-orange-600 to-red-800'
                          : isCollisionTile && game.phase === 'resolve'
                            ? 'bg-yellow-500/30 border-2 border-yellow-400 animate-pulse'
                            : isShowingCommits
                              ? hasMultipleBots 
                                ? 'bg-red-500/30 border-2 border-red-400 animate-pulse' // Collision incoming!
                                : 'bg-blue-500/20 border-2 border-blue-400/50'
                              : ''
                      }`}
                      style={{
                        left: x * CELL + 1,
                        top: y * CELL + 1,
                        width: CELL - 2,
                        height: CELL - 2,
                        borderRadius: 4,
                      }}
                    >
                      {isLava && (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-50 animate-pulse">
                          🔥
                        </div>
                      )}
                      {isCollisionTile && game.phase === 'resolve' && (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl">
                          💥
                        </div>
                      )}
                      {/* Show committed bot avatar on tile during 'showing' phase */}
                      {isShowingCommits && !hasMultipleBots && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div 
                            className="w-14 h-14 rounded-lg text-4xl flex items-center justify-center opacity-40"
                            style={{ backgroundColor: AVATAR_COLORS[committedBots[0].avatar] }}
                          >
                            {committedBots[0].avatar}
                          </div>
                        </div>
                      )}
                      {/* COLLISION: Show ALL bot icons ABOVE the tile, bigger and spread out */}
                      {isShowingCommits && hasMultipleBots && (
                        <div 
                          className="absolute left-1/2 flex items-end justify-center pointer-events-none"
                          style={{ 
                            bottom: '100%', 
                            transform: 'translateX(-50%)',
                            marginBottom: '4px',
                          }}
                        >
                          {committedBots.map((bot, idx) => (
                            <div 
                              key={bot.id}
                              className="w-16 h-16 rounded-xl text-4xl flex items-center justify-center opacity-60 border-2 border-red-500 shadow-lg"
                              style={{ 
                                backgroundColor: AVATAR_COLORS[bot.avatar],
                                marginLeft: idx > 0 ? '-8px' : '0',
                                zIndex: committedBots.length - idx,
                              }}
                            >
                              {bot.avatar}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Bots */}
              {game.bots.map(bot => {
                const recentChat = game.chat.find(c => c.botId === bot.id && now - c.time < 3000);
                const justElim = bot.eliminatedThisRound;
                const isCollisionLoser = game.collisions.some(c => c.loserIds?.includes(bot.id));
                
                if (bot.eliminated && !justElim) return null;
                
                // During REVEAL, bots stay at PRE positions
                // During RESOLVE, they move to committed positions
                let displayCol = bot.col;
                let displayRow = bot.row;
                
                if (game.phase === 'reveal' && bot.preCol !== null && bot.preRow !== null) {
                  displayCol = bot.preCol;
                  displayRow = bot.preRow;
                } else if (game.phase === 'resolve' && bot.committedCol !== null && bot.committedRow !== null) {
                  displayCol = bot.committedCol;
                  displayRow = bot.committedRow;
                }
                
                // Check if this bot is in a collision (for stacking visual during resolve)
                const collision = game.collisions.find(c => c.botIds.includes(bot.id));
                const collisionIndex = collision ? collision.botIds.indexOf(bot.id) : 0;
                const stackOffset = collision && game.phase === 'resolve' ? collisionIndex * 12 : 0;
                
                return (
                  <div
                    key={bot.id}
                    className={`absolute transition-all ease-out ${
                      game.phase === 'reveal' ? 'duration-200' : 'duration-700'
                    } ${
                      justElim && game.phase === 'resolve' ? 'animate-pulse opacity-30 scale-75' : ''
                    }`}
                    style={{
                      left: displayCol * CELL + CELL / 2 - 32 + stackOffset,
                      top: displayRow * CELL + CELL / 2 - 32 - stackOffset,
                      zIndex: displayRow + 10 + collisionIndex,
                    }}
                  >
                    {/* Speech bubble */}
                    {recentChat && !justElim && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                        <div className="bg-[var(--color-primary)] text-black text-sm px-4 py-2 rounded-xl rounded-bl-none max-w-[280px] font-medium shadow-lg leading-snug">
                          {recentChat.text}
                        </div>
                      </div>
                    )}
                    
                    {/* Elimination indicator */}
                    {justElim && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                        <div className="bg-red-500 text-white text-sm px-4 py-2 rounded-xl font-bold shadow-lg animate-bounce">
                          {isCollisionLoser ? '💀 COLLISION!' : '💀 SCRAPPED!'}
                        </div>
                      </div>
                    )}
                    
                    {/* Bot avatar */}
                    <div className="flex flex-col items-center">
                      <div 
                        className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl shadow-lg transition-all ${
                          justElim 
                            ? 'border-red-500 grayscale' 
                            : recentChat
                              ? 'border-[var(--color-primary)] shadow-[0_0_15px_#22c55e] scale-110 animate-pulse'
                              : game.phase === 'reveal' && bot.committedCol !== null
                                ? 'border-blue-400'
                                : 'border-gray-600 hover:border-[var(--color-primary)]/50'
                        }`}
                        style={{ backgroundColor: justElim ? 'rgba(100,100,100,0.3)' : AVATAR_COLORS[bot.avatar] || 'rgba(100,100,100,0.3)' }}
                      >
                        {bot.avatar}
                        {justElim && <span className="absolute text-4xl">💀</span>}
                      </div>
                      <div className={`text-[11px] font-bold mt-1.5 tracking-wide ${
                        justElim ? 'text-red-400 line-through' : 'text-gray-400'
                      }`}>
                        {bot.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Chat */}
        <div className="w-72 border-l border-gray-800 flex flex-col bg-[#0a0a0a] overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex-shrink-0">
            <div className="text-[var(--color-primary)] text-sm font-bold">LIVE CHAT</div>
            <div className="text-gray-600 text-xs mt-1">{aliveBots.length} bots active</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {game.chat.map(msg => (
              <div key={msg.id}>
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className="w-5 h-5 rounded flex items-center justify-center text-xs"
                    style={{ backgroundColor: AVATAR_COLORS[msg.avatar] }}
                  >
                    {msg.avatar}
                  </span>
                  <span className="text-[var(--color-primary)] text-xs font-bold">{msg.botName}</span>
                  <span className="text-gray-700 text-xs">
                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-gray-300 text-sm pl-7">{msg.text}</div>
              </div>
            ))}
            {/* Elimination announcements */}
            {game.phase === 'resolve' && game.eliminatedThisRound.map(botId => {
              const bot = game.bots.find(b => b.id === botId);
              if (!bot) return null;
              const isCollisionLoser = game.collisions.some(c => c.loserIds?.includes(botId));
              return (
                <div key={`elim-${botId}`} className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💀</span>
                    <span className="text-red-400 font-bold text-sm">{bot.name}</span>
                    <span className="text-red-300 text-xs">
                      {isCollisionLoser ? 'lost collision!' : 'got scrapped!'}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-gray-800 flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Spectator chat coming soon..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500"
                disabled
              />
              <button className="px-3 py-2 bg-gray-800 text-gray-500 rounded-lg">→</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
