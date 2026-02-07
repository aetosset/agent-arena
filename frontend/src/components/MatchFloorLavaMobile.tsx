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
// MOBILE VERTICAL: Same 14x8 grid as desktop, just smaller cells
const COLS = 14;
const ROWS = 8;
const CELL = 24; // Tiny cells to fit vertically (14*24=336px wide, 8*24=192px tall)

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
export default function MatchFloorLavaMobile() {
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

  // Chat sound effect (NO auto-scroll on mobile)
  useEffect(() => {
    if (game.chat.length > prevChatLengthRef.current) {
      playBotSound();
    }
    prevChatLengthRef.current = game.chat.length;
  }, [game.chat.length]);

  // Phase management (same logic as desktop)
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
          
          const newBots = g.bots.map(bot => {
            if (bot.eliminated) return bot;
            const tile = safeTiles[Math.floor(Math.random() * safeTiles.length)];
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
          
          if (eliminatedIds.length > 0) playEliminationSound();
          
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
          const newGrid = g.grid.map(row => [...row]);
          const safeTiles: { x: number; y: number }[] = [];
          
          for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
              if (!newGrid[y][x]) safeTiles.push({ x, y });
            }
          }
          
          // 50% tile reduction
          const toConvert = Math.max(1, Math.floor(safeTiles.length * 0.5));
          for (let i = 0; i < toConvert && safeTiles.length > 0; i++) {
            const idx = Math.floor(Math.random() * safeTiles.length);
            const { x, y } = safeTiles[idx];
            newGrid[y][x] = true;
            safeTiles.splice(idx, 1);
          }
          
          const newBots = g.bots.map(bot => ({
            ...bot,
            eliminatedThisRound: false,
            committedCol: null,
            committedRow: null,
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
  
  // Find who's currently speaking (for agent bar glow)
  const speakingBotIds = new Set(
    game.chat.filter(c => now - c.time < 3000).map(c => c.botId)
  );

  // ============ MOBILE RENDER ============
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Banner - Game Info */}
      <div className="p-3 border-b border-gray-800">
        <div className="bg-[#111] rounded-xl p-3 border border-[var(--color-primary)]/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🔥</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  game.phase === 'deliberation' ? 'text-[var(--color-primary)]' :
                  game.phase === 'commit' ? 'text-blue-400' :
                  game.phase === 'resolve' ? 'text-orange-400' : 'text-gray-400'
                }`}>
                  {game.phase === 'deliberation' && 'DELIBERATION'}
                  {game.phase === 'commit' && '🔒 LOCKING'}
                  {game.phase === 'resolve' && '⚡ RESOLVE'}
                  {game.phase === 'finished' && '🏆 COMPLETE'}
                </span>
                <span className="text-gray-600 text-xs">R{game.round}</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-gray-500 text-xs">{aliveBots.length} alive</span>
                <span className="text-gray-500 text-xs">{safeTileCount} tiles</span>
                <span className="text-[var(--color-primary)] text-xs font-bold">$5.00</span>
              </div>
            </div>
            <div className={`font-mono text-2xl font-bold ${
              game.phase === 'resolve' ? 'text-orange-400' : 'text-[var(--color-primary)]'
            }`}>
              {formatTime(remaining)}
            </div>
          </div>
          
          {/* Elimination alert */}
          {game.phase === 'resolve' && game.eliminatedThisRound.length > 0 && (
            <div className="mt-2 text-red-400 text-xs font-bold text-center animate-pulse">
              💀 {game.eliminatedThisRound.length} ELIMINATED THIS ROUND
            </div>
          )}
        </div>
      </div>

      {/* Agent Bar - Horizontal Scroll */}
      <div className="border-b border-gray-800 py-2">
        <div className="flex gap-2 overflow-x-auto px-3 pb-1" style={{ scrollbarWidth: 'none' }}>
          {game.bots.map(bot => {
            const isElim = bot.eliminated;
            const isSpeaking = speakingBotIds.has(bot.id);
            const justElim = bot.eliminatedThisRound;
            
            return (
              <div
                key={bot.id}
                className={`flex-shrink-0 flex flex-col items-center transition-all ${
                  isElim ? 'opacity-40' : ''
                }`}
              >
                <div 
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg relative transition-all ${
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
                <div className={`text-[9px] mt-1 truncate w-10 text-center ${
                  isElim ? 'text-gray-600 line-through' : isSpeaking ? 'text-[var(--color-primary)]' : 'text-gray-500'
                }`}>
                  {bot.name.slice(0, 6)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid - TRANSPOSED: displays 8 wide x 14 tall (game logic still 14x8) */}
      <div className="flex-1 flex items-center justify-center p-3 overflow-hidden">
        <div 
          className="relative bg-[#0d0d0d] rounded-xl overflow-hidden border border-gray-800"
          style={{ 
            width: ROWS * CELL,  // 8 * CELL = visual width
            height: COLS * CELL, // 14 * CELL = visual height
            backgroundImage: 'linear-gradient(rgba(255,100,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,100,0,0.03) 1px, transparent 1px)',
            backgroundSize: `${CELL}px ${CELL}px`
          }}
        >
          {/* Grid tiles - TRANSPOSED: x becomes visual y, y becomes visual x */}
          {game.grid.map((row, y) =>
            row.map((isLava, x) => {
              const isCollisionTile = collisionTiles.has(`${x},${y}`) && game.phase === 'resolve';
              // Transpose: game (x,y) -> visual (y,x)
              const visualX = y * CELL;
              const visualY = x * CELL;
              
              return (
                <div
                  key={`${x}-${y}`}
                  className={`absolute transition-all duration-500 ${
                    isLava
                      ? 'bg-gradient-to-br from-orange-600 to-red-800'
                      : isCollisionTile
                        ? 'bg-yellow-500/30 border border-yellow-400 animate-pulse'
                        : ''
                  }`}
                  style={{
                    left: visualX + 1,
                    top: visualY + 1,
                    width: CELL - 2,
                    height: CELL - 2,
                    borderRadius: 3,
                  }}
                >
                  {isLava && (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] opacity-50 animate-pulse">
                      🔥
                    </div>
                  )}
                  {isCollisionTile && (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px]">
                      💥
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Bots - TRANSPOSED: col becomes visual y, row becomes visual x */}
          {game.bots.map(bot => {
            const justElim = bot.eliminatedThisRound;
            const isSpeaking = speakingBotIds.has(bot.id);
            
            if (bot.eliminated && !justElim) return null;
            
            const botSize = 18;
            // Transpose: game (col, row) -> visual (row, col)
            const visualX = bot.row * CELL + CELL / 2 - botSize / 2;
            const visualY = bot.col * CELL + CELL / 2 - botSize / 2;
            
            return (
              <div
                key={bot.id}
                className={`absolute transition-all duration-200 ease-out ${
                  justElim ? 'animate-pulse opacity-50' : ''
                }`}
                style={{
                  left: visualX,
                  top: visualY,
                  zIndex: bot.col + 10,
                }}
              >
                <div 
                  className={`flex items-center justify-center text-sm rounded transition-all ${
                    justElim 
                      ? 'border border-red-500 grayscale' 
                      : isSpeaking
                        ? 'border-2 border-[var(--color-primary)] shadow-[0_0_10px_#22c55e] scale-110'
                        : 'border border-gray-600'
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

      {/* Chat - Fixed Height, Scrollable (no auto-scroll) */}
      <div className="h-36 border-t border-gray-800 flex flex-col bg-[#0a0a0a]">
        <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
          <span className="text-[var(--color-primary)] text-xs font-bold">LIVE CHAT</span>
          <span className="text-gray-600 text-xs">{aliveBots.length} active</span>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {game.chat.slice(-20).map(msg => {
            const isSpeaking = now - msg.time < 3000;
            return (
              <div key={msg.id} className={`flex gap-2 ${isSpeaking ? 'bg-[var(--color-primary)]/10 -mx-2 px-2 py-1 rounded' : ''}`}>
                <span 
                  className="w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0"
                  style={{ backgroundColor: AVATAR_COLORS[msg.avatar] }}
                >
                  {msg.avatar}
                </span>
                <div className="min-w-0">
                  <span className="text-[var(--color-primary)] text-xs font-bold">{msg.botName}</span>
                  <span className="text-gray-300 text-xs ml-2">{msg.text}</span>
                </div>
              </div>
            );
          })}
          
          {/* Elimination announcements */}
          {game.phase === 'resolve' && game.eliminatedThisRound.map(botId => {
            const bot = game.bots.find(b => b.id === botId);
            if (!bot) return null;
            const isCollisionLoser = game.collisions.some(c => c.loserId === botId);
            return (
              <div key={`elim-${botId}`} className="bg-red-900/30 border border-red-500/30 rounded px-2 py-1">
                <span className="text-red-400 font-bold text-xs">
                  💀 {bot.name} {isCollisionLoser ? 'lost collision!' : 'got scrapped!'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
