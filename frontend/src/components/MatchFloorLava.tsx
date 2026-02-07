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
type Phase = 'deliberation' | 'commit' | 'resolve' | 'finished';

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
  loserId: string; // Bot that loses collision
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
  deliberation: 15000,
  commit: 5000,
  resolve: 9000, // 9 seconds to show eliminations
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

  // Phase management
  useEffect(() => {
    const elapsed = now - game.startTime;
    const phaseDuration = PHASE_MS[game.phase as keyof typeof PHASE_MS] || 5000;

    if (elapsed >= phaseDuration) {
      setGame(g => {
        if (g.phase === 'deliberation') {
          // Transition to COMMIT phase - bots lock in their moves
          const aliveBots = g.bots.filter(b => !b.eliminated);
          const safeTiles: { x: number; y: number }[] = [];
          
          for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
              if (!g.grid[y][x]) {
                safeTiles.push({ x, y });
              }
            }
          }
          
          // Each bot commits to a random safe tile
          const newBots = g.bots.map(bot => {
            if (bot.eliminated) return bot;
            const tile = safeTiles[Math.floor(Math.random() * safeTiles.length)];
            return { ...bot, committedCol: tile.x, committedRow: tile.y };
          });
          
          return { ...g, phase: 'commit' as Phase, startTime: Date.now(), bots: newBots };
        }
        
        if (g.phase === 'commit') {
          // Transition to RESOLVE phase - check for collisions and eliminations
          const aliveBots = g.bots.filter(b => !b.eliminated);
          const collisions: CollisionInfo[] = [];
          const eliminatedIds: string[] = [];
          
          // Group bots by their committed position
          const positionMap = new Map<string, Bot[]>();
          aliveBots.forEach(bot => {
            if (bot.committedCol !== null && bot.committedRow !== null) {
              const key = `${bot.committedCol},${bot.committedRow}`;
              const existing = positionMap.get(key) || [];
              existing.push(bot);
              positionMap.set(key, existing);
            }
          });
          
          // Check for collisions and determine losers
          positionMap.forEach((bots, key) => {
            if (bots.length > 1) {
              // Collision! Random bot loses
              const [col, row] = key.split(',').map(Number);
              const loserIdx = Math.floor(Math.random() * bots.length);
              const loserId = bots[loserIdx].id;
              collisions.push({ col, row, botIds: bots.map(b => b.id), loserId });
              eliminatedIds.push(loserId);
            }
          });
          
          // Check for bots that landed on lava (invalid move = death)
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
          
          // Play elimination sound if anyone died
          if (eliminatedIds.length > 0) {
            playEliminationSound();
          }
          
          // Mark bots as eliminated and move survivors to their committed positions
          const newBots = g.bots.map(bot => {
            if (eliminatedIds.includes(bot.id)) {
              return { ...bot, eliminated: true, eliminatedThisRound: true };
            }
            if (!bot.eliminated && bot.committedCol !== null && bot.committedRow !== null) {
              return { ...bot, col: bot.committedCol, row: bot.committedRow };
            }
            return bot;
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
          
          // Convert 50% of safe tiles to lava (THE FIX!)
          const toConvert = Math.max(1, Math.floor(safeTiles.length * 0.5));
          for (let i = 0; i < toConvert && safeTiles.length > 0; i++) {
            const idx = Math.floor(Math.random() * safeTiles.length);
            const { x, y } = safeTiles[idx];
            newGrid[y][x] = true;
            safeTiles.splice(idx, 1);
          }
          
          // Reset bot states for new round
          const newBots = g.bots.map(bot => ({
            ...bot,
            eliminatedThisRound: false,
            committedCol: null,
            committedRow: null,
          }));
          
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

  // ============ RENDER ============
  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {/* Main Layout - FIXED HEIGHT, NO SCROLL */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Bot Roster */}
        <div className="w-64 border-r border-gray-800 flex flex-col bg-[#0a0a0a] overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex-shrink-0">
            <div className="text-white text-sm font-bold">COMPETITORS</div>
            <div className="text-gray-600 text-xs mt-1">{game.bots.length} bots • {aliveBots.length} alive</div>
          </div>
        
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {game.bots.map(bot => {
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
                        : isInCollision && game.phase === 'resolve'
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
                        ) : isInCollision && game.phase === 'resolve' ? (
                          <span className="text-yellow-400">⚠️ Collision!</span>
                        ) : game.phase === 'commit' && bot.committedCol !== null ? (
                          <span className="text-blue-400">Locked in</span>
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

          {/* Match Info */}
          <div className="p-4 border-t border-gray-800 flex-shrink-0">
            <div className="text-xs text-gray-600 mb-2">MATCH INFO</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Players</span>
                <span className="text-white">{aliveBots.length} / {game.bots.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Safe Tiles</span>
                <span className="text-white">{safeTileCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Prize Pool</span>
                <span className="text-[var(--color-primary)] font-bold">$5.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - NO SCROLL */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Game Status Bar */}
          <div className="py-3 border-b border-gray-800 flex items-center justify-between mx-auto" style={{ width: COLS * CELL }}>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-bold uppercase tracking-wider ${
                game.phase === 'deliberation' ? 'text-[var(--color-primary)] animate-pulse' :
                game.phase === 'commit' ? 'text-blue-400' :
                game.phase === 'resolve' ? 'text-orange-400 animate-pulse' :
                'text-gray-400'
              }`}>
                {game.phase === 'deliberation' && 'DELIBERATION PHASE'}
                {game.phase === 'commit' && '🔒 LOCKING MOVES...'}
                {game.phase === 'resolve' && '⚡ RESOLVING!'}
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
                  const isCollisionTile = collisionTiles.has(`${x},${y}`) && game.phase === 'resolve';
                  const hasCommittedBot = game.phase === 'commit' && game.bots.some(
                    b => !b.eliminated && b.committedCol === x && b.committedRow === y
                  );
                  
                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`absolute transition-all duration-500 ${
                        isLava
                          ? 'bg-gradient-to-br from-orange-600 to-red-800'
                          : isCollisionTile
                            ? 'bg-yellow-500/30 border-2 border-yellow-400 animate-pulse'
                            : hasCommittedBot
                              ? 'bg-blue-500/20 border border-blue-400/50'
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
                      {isCollisionTile && (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl">
                          💥
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
                const isCollisionLoser = game.collisions.some(c => c.loserId === bot.id);
                
                if (bot.eliminated && !justElim) return null;
                
                return (
                  <div
                    key={bot.id}
                    className={`absolute transition-all duration-200 ease-out ${
                      justElim ? 'animate-pulse opacity-50' : ''
                    }`}
                    style={{
                      left: bot.col * CELL + CELL / 2 - 32,
                      top: bot.row * CELL + CELL / 2 - 32,
                      zIndex: bot.row + 10,
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
                              : game.phase === 'commit' && bot.committedCol !== null
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
              const isCollisionLoser = game.collisions.some(c => c.loserId === botId);
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
