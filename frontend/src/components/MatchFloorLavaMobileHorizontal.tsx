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
    if (!audioContextRef.current) initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const baseFreq = 500 + Math.random() * 300;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, ctx.currentTime + 0.1);
    osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {}
}

function playEliminationSound() {
  try {
    if (!audioContextRef.current) initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
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
type Phase = 'deliberation' | 'commit' | 'resolve' | 'finished';

interface Bot {
  id: string;
  name: string;
  avatar: string;
  eliminated: boolean;
  eliminatedThisRound: boolean;
  col: number;
  row: number;
  committedCol: number | null;
  committedRow: number | null;
  preCol: number | null;
  preRow: number | null;
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
  loserId: string;
}

interface Game {
  phase: Phase;
  round: number;
  startTime: number;
  bots: Bot[];
  chat: ChatMsg[];
  grid: boolean[][];
  collisions: CollisionInfo[];
  eliminatedThisRound: string[];
}

// ========== CONSTANTS ==========
// HORIZONTAL MOBILE: Same as desktop but smaller cells
const COLS = 14;
const ROWS = 8;
const CELL = 25; // Small cells to fit ~350px width (14*25=350)

const PHASE_MS = {
  deliberation: 15000,
  commit: 5000,
  resolve: 9000,
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
      col = Math.floor(Math.random() * COLS);
      row = Math.floor(Math.random() * ROWS);
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
    phase: 'deliberation',
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
export default function MatchFloorLavaMobileHorizontal() {
  const [game, setGame] = useState<Game>(createGame);
  const [now, setNow] = useState(Date.now());
  const prevChatLengthRef = useRef(0);

  // Timer tick
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  // Initialize audio on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Chat sound effect (NO auto-scroll)
  useEffect(() => {
    if (game.chat.length > prevChatLengthRef.current) {
      playBotSound();
    }
    prevChatLengthRef.current = game.chat.length;
  }, [game.chat.length]);

  // Phase management
  useEffect(() => {
    const elapsed = now - game.startTime;
    const phaseDuration = PHASE_MS[game.phase as keyof typeof PHASE_MS] || 5000;

    if (elapsed >= phaseDuration) {
      setGame(g => {
        if (g.phase === 'deliberation') {
          const safeTiles: { x: number; y: number }[] = [];
          for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
              if (!g.grid[y][x]) safeTiles.push({ x, y });
            }
          }
          
          // 8-direction adjacency offsets (including diagonals)
          const ADJACENT_OFFSETS = [
            [-1, -1], [0, -1], [1, -1],
            [-1,  0],          [1,  0],
            [-1,  1], [0,  1], [1,  1],
          ];
          
          // Each bot commits to current tile OR adjacent safe tile
          // Exception: if on "island" (all 8 adjacent are lava), can teleport anywhere
          const newBots = g.bots.map(bot => {
            if (bot.eliminated) return bot;
            
            const validTiles: { x: number; y: number }[] = [];
            
            // Current tile is valid if safe
            if (!g.grid[bot.row]?.[bot.col]) {
              validTiles.push({ x: bot.col, y: bot.row });
            }
            
            // Check all 8 adjacent tiles
            for (const [dx, dy] of ADJACENT_OFFSETS) {
              const nx = bot.col + dx;
              const ny = bot.row + dy;
              if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !g.grid[ny]?.[nx]) {
                validTiles.push({ x: nx, y: ny });
              }
            }
            
            // Island: no valid adjacent, teleport anywhere
            if (validTiles.length === 0) {
              const tile = safeTiles[Math.floor(Math.random() * safeTiles.length)];
              return { ...bot, committedCol: tile.x, committedRow: tile.y };
            }
            
            // Normal: pick from valid adjacent
            const tile = validTiles[Math.floor(Math.random() * validTiles.length)];
            return { ...bot, committedCol: tile.x, committedRow: tile.y };
          });
          
          return { ...g, phase: 'commit' as Phase, startTime: Date.now(), bots: newBots };
        }
        
        if (g.phase === 'commit') {
          const aliveBots = g.bots.filter(b => !b.eliminated);
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
          
          positionMap.forEach((bots, key) => {
            if (bots.length > 1) {
              const [col, row] = key.split(',').map(Number);
              const loserIdx = Math.floor(Math.random() * bots.length);
              const loserId = bots[loserIdx].id;
              collisions.push({ col, row, botIds: bots.map(b => b.id), loserId });
              eliminatedIds.push(loserId);
            }
          });
          
          aliveBots.forEach(bot => {
            if (bot.committedCol !== null && bot.committedRow !== null) {
              if (g.grid[bot.committedRow]?.[bot.committedCol]) {
                if (!eliminatedIds.includes(bot.id)) {
                  eliminatedIds.push(bot.id);
                }
              }
            }
          });
          
          // DON'T move bots yet - store their pre-move positions
          const newBots = g.bots.map(bot => {
            if (bot.eliminated) return bot;
            return { 
              ...bot, 
              preCol: bot.col, 
              preRow: bot.row,
              eliminatedThisRound: eliminatedIds.includes(bot.id),
            };
          });
          
          return {
            ...g,
            phase: 'resolve' as Phase,
            startTime: Date.now(),
            bots: newBots,
            collisions,
            eliminatedThisRound: eliminatedIds,
          };
        }
        
        if (g.phase === 'resolve') {
          // Play elimination sound now
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
          
          const newGrid = g.grid.map(row => [...row]);
          const safeTiles: { x: number; y: number }[] = [];
          
          for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
              if (!newGrid[y][x]) safeTiles.push({ x, y });
            }
          }
          
          const toConvert = Math.max(1, Math.floor(safeTiles.length * 0.5));
          for (let i = 0; i < toConvert && safeTiles.length > 0; i++) {
            const idx = Math.floor(Math.random() * safeTiles.length);
            const { x, y } = safeTiles[idx];
            newGrid[y][x] = true;
            safeTiles.splice(idx, 1);
          }
          
          const newBots = movedBots.map(bot => ({
            ...bot,
            eliminatedThisRound: false,
            committedCol: null,
            committedRow: null,
            preCol: null,
            preRow: null,
          }));
          
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
            phase: 'deliberation' as Phase,
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

  // Bot movement during deliberation
  useEffect(() => {
    if (game.phase !== 'deliberation') return;
    
    const moveInterval = setInterval(() => {
      setGame(g => {
        if (g.phase !== 'deliberation') return g;
        
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
    }, 600);

    return () => clearInterval(moveInterval);
  }, [game.phase]);

  const elapsed = now - game.startTime;
  const duration = PHASE_MS[game.phase as keyof typeof PHASE_MS] || 5000;
  const remaining = duration - elapsed;
  const aliveBots = game.bots.filter(b => !b.eliminated);
  const safeTileCount = game.grid.flat().filter(t => !t).length;
  const collisionTiles = new Set(game.collisions.map(c => `${c.col},${c.row}`));
  
  // Who's speaking (for agent bar + chat highlight)
  const speakingBotIds = new Set(
    game.chat.filter(c => now - c.time < 3000).map(c => c.botId)
  );
  
  // Resolve phase sub-stages
  const resolveStage = game.phase === 'resolve' 
    ? elapsed < 3000 ? 'showing' : elapsed < 6000 ? 'moving' : 'eliminating'
    : null;
  
  // Build map of committed tiles to bot avatars
  const committedTileMap = new Map<string, Bot[]>();
  if (game.phase === 'resolve' || game.phase === 'commit') {
    game.bots.forEach(bot => {
      if (!bot.eliminated && bot.committedCol !== null && bot.committedRow !== null) {
        const key = `${bot.committedCol},${bot.committedRow}`;
        const existing = committedTileMap.get(key) || [];
        existing.push(bot);
        committedTileMap.set(key, existing);
      }
    });
  }

  // Find the winner
  const winner = game.phase === 'finished' ? game.bots.find(b => !b.eliminated) : null;

  // ============ MOBILE HORIZONTAL RENDER ============
  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden relative">
      {/* END SCREEN OVERLAY */}
      {game.phase === 'finished' && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="text-center p-6 bg-[#111] rounded-xl border border-[var(--color-primary)]/30 shadow-2xl w-full max-w-sm">
            <div className="text-5xl mb-3">🏆</div>
            <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-1">MATCH COMPLETE</h1>
            <p className="text-gray-400 text-sm mb-4">Round {game.round} • {game.bots.filter(b => b.eliminated).length} eliminated</p>
            
            {winner ? (
              <div className="mb-4">
                <div className="text-gray-500 text-xs mb-2">WINNER</div>
                <div className="flex items-center justify-center gap-3">
                  <div 
                    className="w-14 h-14 rounded-lg text-3xl flex items-center justify-center border-2 border-[var(--color-primary)] shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                    style={{ backgroundColor: AVATAR_COLORS[winner.avatar] }}
                  >
                    {winner.avatar}
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold">{winner.name}</div>
                    <div className="text-[var(--color-primary)] font-bold text-sm">$5.00 Prize</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="text-gray-500 text-xs mb-1">NO SURVIVORS</div>
                <div className="text-lg text-red-400">Everyone got scrapped! 💀</div>
              </div>
            )}
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2.5 bg-[var(--color-primary)] text-black font-bold rounded-lg text-sm"
            >
              WATCH ANOTHER MATCH
            </button>
          </div>
        </div>
      )}
      
      {/* Compact Banner */}
      <div className="p-2 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded flex items-center justify-center">
              <span className="text-lg">🔥</span>
            </div>
            <div>
              <div className={`text-xs font-bold uppercase ${
                game.phase === 'deliberation' ? 'text-[var(--color-primary)]' :
                game.phase === 'commit' ? 'text-blue-400' :
                game.phase === 'resolve' ? 'text-orange-400' : 'text-gray-400'
              }`}>
                {game.phase === 'deliberation' && 'DELIBERATION'}
                {game.phase === 'commit' && '🔒 LOCKING'}
                {game.phase === 'resolve' && resolveStage === 'showing' && '🎯 REVEALING'}
                {game.phase === 'resolve' && resolveStage === 'moving' && '⚡ MOVING'}
                {game.phase === 'resolve' && resolveStage === 'eliminating' && '💀 ELIMINATING'}
                {game.phase === 'finished' && '🏆 DONE'}
              </div>
              <div className="text-[10px] text-gray-500">
                R{game.round} • {aliveBots.length} alive • {safeTileCount} tiles
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-mono text-xl font-bold ${
              game.phase === 'resolve' ? 'text-orange-400' : 'text-[var(--color-primary)]'
            }`}>
              {formatTime(remaining)}
            </div>
            <div className="text-[var(--color-primary)] text-xs font-bold">$5.00</div>
          </div>
        </div>
        {game.phase === 'resolve' && game.eliminatedThisRound.length > 0 && (
          <div className="text-red-400 text-xs font-bold text-center mt-1 animate-pulse">
            💀 {game.eliminatedThisRound.length} ELIMINATED
          </div>
        )}
      </div>

      {/* Agent Rows - 2 rows of 8, horizontally scrollable */}
      <div className="border-b border-gray-800 py-2 flex-shrink-0 space-y-2">
        {/* Row 1: Bots 0-7 */}
        <div className="flex gap-2 overflow-x-auto px-2" style={{ scrollbarWidth: 'none' }}>
          {game.bots.slice(0, 8).map(bot => {
            const isElim = bot.eliminated;
            const isSpeaking = speakingBotIds.has(bot.id);
            const justElim = bot.eliminatedThisRound;
            
            return (
              <div
                key={bot.id}
                className={`flex-shrink-0 transition-all ${isElim ? 'opacity-40' : ''}`}
              >
                <div 
                  className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl relative transition-all ${
                    justElim
                      ? 'border-2 border-red-500 grayscale'
                      : isSpeaking
                        ? 'border-2 border-[var(--color-primary)] shadow-[0_0_12px_#22c55e] scale-110'
                        : isElim
                          ? 'grayscale border border-gray-700'
                          : 'border border-gray-700'
                  }`}
                  style={{ backgroundColor: isElim ? 'rgba(100,100,100,0.2)' : AVATAR_COLORS[bot.avatar] }}
                >
                  {bot.avatar}
                  {isElim && <span className="absolute text-red-500 text-sm">✕</span>}
                </div>
              </div>
            );
          })}
        </div>
        {/* Row 2: Bots 8-15 */}
        <div className="flex gap-2 overflow-x-auto px-2" style={{ scrollbarWidth: 'none' }}>
          {game.bots.slice(8, 16).map(bot => {
            const isElim = bot.eliminated;
            const isSpeaking = speakingBotIds.has(bot.id);
            const justElim = bot.eliminatedThisRound;
            
            return (
              <div
                key={bot.id}
                className={`flex-shrink-0 transition-all ${isElim ? 'opacity-40' : ''}`}
              >
                <div 
                  className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl relative transition-all ${
                    justElim
                      ? 'border-2 border-red-500 grayscale'
                      : isSpeaking
                        ? 'border-2 border-[var(--color-primary)] shadow-[0_0_12px_#22c55e] scale-110'
                        : isElim
                          ? 'grayscale border border-gray-700'
                          : 'border border-gray-700'
                  }`}
                  style={{ backgroundColor: isElim ? 'rgba(100,100,100,0.2)' : AVATAR_COLORS[bot.avatar] }}
                >
                  {bot.avatar}
                  {isElim && <span className="absolute text-red-500 text-sm">✕</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid - Horizontal (14 wide x 8 tall, smaller cells) - no vertical centering */}
      <div className="flex justify-center pt-2 pb-1">
        <div 
          className="relative bg-[#0d0d0d] rounded-lg overflow-hidden border border-gray-800"
          style={{ 
            width: COLS * CELL, 
            height: ROWS * CELL,
            backgroundImage: 'linear-gradient(rgba(255,100,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,100,0,0.03) 1px, transparent 1px)',
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
              const isShowingCommits = (game.phase === 'commit' || resolveStage === 'showing') && hasCommittedBot;
              const hasMultipleBots = committedBots.length > 1;
              
              return (
                <div
                  key={tileKey}
                  className={`absolute transition-all duration-500 ${
                    isLava
                      ? 'bg-gradient-to-br from-orange-600 to-red-800'
                      : isCollisionTile && resolveStage !== 'showing'
                        ? 'bg-yellow-500/30 border border-yellow-400 animate-pulse'
                        : isShowingCommits
                          ? hasMultipleBots 
                            ? 'bg-red-500/30 border border-red-400 animate-pulse'
                            : 'bg-blue-500/20 border border-blue-400/50'
                          : ''
                  }`}
                  style={{
                    left: x * CELL,
                    top: y * CELL,
                    width: CELL - 1,
                    height: CELL - 1,
                    borderRadius: 2,
                  }}
                >
                  {isLava && (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] opacity-40">
                      🔥
                    </div>
                  )}
                  {/* Show committed bot avatar during 'showing' phase - single bot */}
                  {isShowingCommits && !hasMultipleBots && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div 
                        className="w-7 h-7 rounded text-lg flex items-center justify-center opacity-40"
                        style={{ backgroundColor: AVATAR_COLORS[committedBots[0].avatar] }}
                      >
                        {committedBots[0].avatar}
                      </div>
                    </div>
                  )}
                  {/* COLLISION: Show ALL bot icons ABOVE the tile */}
                  {isShowingCommits && hasMultipleBots && (
                    <div 
                      className="absolute left-1/2 flex items-end justify-center pointer-events-none"
                      style={{ 
                        bottom: '100%', 
                        transform: 'translateX(-50%)',
                        marginBottom: '2px',
                      }}
                    >
                      {committedBots.map((bot, idx) => (
                        <div 
                          key={bot.id}
                          className="w-8 h-8 rounded text-xl flex items-center justify-center opacity-60 border border-red-500 shadow-md"
                          style={{ 
                            backgroundColor: AVATAR_COLORS[bot.avatar],
                            marginLeft: idx > 0 ? '-4px' : '0',
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

          {/* Bots - NO speech bubbles, just icons */}
          {game.bots.map(bot => {
            const justElim = bot.eliminatedThisRound;
            const isSpeaking = speakingBotIds.has(bot.id);
            
            if (bot.eliminated && !justElim) return null;
            
            const botSize = 20;
            
            // During 'showing' stage, bots stay at old position
            let displayCol = bot.col;
            let displayRow = bot.row;
            
            if (game.phase === 'resolve' && bot.preCol !== null && bot.preRow !== null) {
              if (resolveStage === 'showing') {
                displayCol = bot.preCol;
                displayRow = bot.preRow;
              } else {
                displayCol = bot.committedCol ?? bot.col;
                displayRow = bot.committedRow ?? bot.row;
              }
            }
            
            // Collision stacking
            const collision = game.collisions.find(c => c.botIds.includes(bot.id));
            const collisionIndex = collision ? collision.botIds.indexOf(bot.id) : 0;
            const stackOffset = collision && resolveStage !== 'showing' ? collisionIndex * 8 : 0;
            
            return (
              <div
                key={bot.id}
                className={`absolute ease-out ${
                  resolveStage === 'showing' ? 'transition-all duration-200' : 'transition-all duration-700'
                } ${
                  justElim && resolveStage === 'eliminating' ? 'animate-pulse opacity-30 scale-75' : ''
                }`}
                style={{
                  left: displayCol * CELL + CELL / 2 - botSize / 2 + stackOffset,
                  top: displayRow * CELL + CELL / 2 - botSize / 2 - stackOffset,
                  zIndex: displayRow + 10 + collisionIndex,
                }}
              >
                <div 
                  className={`flex items-center justify-center text-xs rounded transition-all ${
                    justElim 
                      ? 'border border-red-500 grayscale' 
                      : isSpeaking
                        ? 'border border-[var(--color-primary)] shadow-[0_0_8px_#22c55e] scale-110'
                        : 'border border-gray-600/50'
                  }`}
                  style={{ 
                    width: botSize, 
                    height: botSize,
                    backgroundColor: justElim ? 'rgba(100,100,100,0.3)' : AVATAR_COLORS[bot.avatar] || 'rgba(100,100,100,0.3)' 
                  }}
                >
                  {bot.avatar}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat - Takes remaining space, starts right after grid */}
      <div className="flex-1 border-t border-gray-800 flex flex-col bg-[#0a0a0a]">
        <div className="px-2 py-1 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <span className="text-[var(--color-primary)] text-xs font-bold">LIVE CHAT</span>
          <span className="text-gray-600 text-[10px]">{aliveBots.length} active</span>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {game.chat.slice(-30).map(msg => {
            const isSpeaking = now - msg.time < 3000;
            return (
              <div 
                key={msg.id} 
                className={`flex gap-1.5 py-0.5 px-1 rounded transition-all ${
                  isSpeaking ? 'bg-[var(--color-primary)]/20 border-l-2 border-[var(--color-primary)]' : ''
                }`}
              >
                <span 
                  className={`w-4 h-4 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${
                    isSpeaking ? 'shadow-[0_0_6px_#22c55e]' : ''
                  }`}
                  style={{ backgroundColor: AVATAR_COLORS[msg.avatar] }}
                >
                  {msg.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <span className={`text-xs font-bold ${isSpeaking ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
                    {msg.botName}
                  </span>
                  <span className="text-gray-300 text-xs ml-1">{msg.text}</span>
                </div>
              </div>
            );
          })}
          
          {/* Elimination announcements */}
          {game.phase === 'resolve' && game.eliminatedThisRound.map(botId => {
            const bot = game.bots.find(b => b.id === botId);
            if (!bot) return null;
            return (
              <div key={`elim-${botId}`} className="bg-red-900/30 border border-red-500/30 rounded px-1.5 py-0.5">
                <span className="text-red-400 font-bold text-xs">💀 {bot.name} scrapped!</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
