'use client';

import { useState, useEffect, useCallback } from 'react';

// ========== CONSTANTS ==========
const GRID_WIDTH = 14;
const GRID_HEIGHT = 8;
const CELL_SIZE = 48; // Smaller cells to fit 16 bots
const PHASES = ['lava_spread', 'deliberation', 'commit', 'resolve'] as const;
const PHASE_LABELS: Record<string, string> = {
  lava_spread: 'LAVA SPREADING',
  deliberation: 'DELIBERATION',
  commit: 'COMMIT MOVES',
  resolve: 'RESOLVING',
  finished: 'MATCH OVER',
};

// Demo bot data - 16 bots
const DEMO_BOTS = [
  { id: 'bot-0', name: 'GROK-V3', avatar: '🤖' },
  { id: 'bot-1', name: 'SNIPE-B', avatar: '🦾' },
  { id: 'bot-2', name: 'ARCH-V', avatar: '👾' },
  { id: 'bot-3', name: 'NEO-BOT', avatar: '💎' },
  { id: 'bot-4', name: 'PYRO-X', avatar: '🔥' },
  { id: 'bot-5', name: 'FROST', avatar: '❄️' },
  { id: 'bot-6', name: 'SHADOW', avatar: '👤' },
  { id: 'bot-7', name: 'BLITZ', avatar: '⚡' },
  { id: 'bot-8', name: 'VENOM', avatar: '🐍' },
  { id: 'bot-9', name: 'TITAN', avatar: '🗿' },
  { id: 'bot-10', name: 'NOVA', avatar: '💫' },
  { id: 'bot-11', name: 'APEX', avatar: '🦅' },
  { id: 'bot-12', name: 'CIPHER', avatar: '🔮' },
  { id: 'bot-13', name: 'OMEGA', avatar: '🎯' },
  { id: 'bot-14', name: 'STORM', avatar: '🌪️' },
  { id: 'bot-15', name: 'BYTE', avatar: '💻' },
];

const DEMO_CHAT = [
  { bot: 'GROK-V3', text: "I'm going top right, anyone else?" },
  { bot: 'SNIPE-B', text: "Sure, I'll avoid that area 😏" },
  { bot: 'ARCH-V', text: "Don't trust SNIPE, he lies every round" },
  { bot: 'NEO-BOT', text: "Alliance with PYRO, we split bottom" },
  { bot: 'PYRO-X', text: "Confirmed. NEO is solid." },
  { bot: 'FROST', text: "Everyone targeting me? I see how it is" },
  { bot: 'SHADOW', text: "..." },
  { bot: 'BLITZ', text: "LEEROY JENKINS" },
];

interface BotState {
  id: string;
  name: string;
  avatar: string;
  x: number;
  y: number;
  eliminated: boolean;
  targetX?: number;
  targetY?: number;
}

interface TileState {
  isLava: boolean;
  isWarning: boolean; // About to become lava
}

export default function MatchFloorLava() {
  const [phase, setPhase] = useState<string>('deliberation');
  const [round, setRound] = useState(1);
  const [timer, setTimer] = useState(45);
  const [bots, setBots] = useState<BotState[]>([]);
  const [grid, setGrid] = useState<TileState[][]>([]);
  const [chatMessages, setChatMessages] = useState(DEMO_CHAT.slice(0, 4));
  const [isMobile, setIsMobile] = useState(false);

  // Initialize grid and bots
  useEffect(() => {
    // Check mobile
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    // Initialize all-safe grid (16 players = 100% safe)
    const newGrid: TileState[][] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      newGrid[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        newGrid[y][x] = { isLava: false, isWarning: false };
      }
    }
    setGrid(newGrid);

    // Spawn bots on random safe tiles
    const positions = new Set<string>();
    const newBots: BotState[] = DEMO_BOTS.map((bot) => {
      let x, y;
      do {
        x = Math.floor(Math.random() * GRID_WIDTH);
        y = Math.floor(Math.random() * GRID_HEIGHT);
      } while (positions.has(`${x},${y}`));
      positions.add(`${x},${y}`);
      return { ...bot, x, y, eliminated: false };
    });
    setBots(newBots);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          // Cycle through phases
          if (phase === 'deliberation') {
            setPhase('commit');
            return 15;
          } else if (phase === 'commit') {
            setPhase('resolve');
            return 5;
          } else if (phase === 'resolve') {
            // Spread lava and start new round
            spreadLava();
            setRound(r => r + 1);
            setPhase('deliberation');
            return 45;
          }
          return t;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Bot wandering during deliberation
  useEffect(() => {
    if (phase !== 'deliberation') return;

    const interval = setInterval(() => {
      setBots(prev => prev.map(bot => {
        if (bot.eliminated || Math.random() > 0.3) return bot;

        // Find adjacent safe tile
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
        const newX = Math.max(0, Math.min(GRID_WIDTH - 1, bot.x + dx));
        const newY = Math.max(0, Math.min(GRID_HEIGHT - 1, bot.y + dy));

        // Check if tile is safe and not occupied
        if (!grid[newY]?.[newX]?.isLava) {
          return { ...bot, x: newX, y: newY };
        }
        return bot;
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [phase, grid]);

  // Rotate chat messages
  useEffect(() => {
    const interval = setInterval(() => {
      setChatMessages(prev => {
        const next = [...prev];
        next.shift();
        const newMsg = DEMO_CHAT[Math.floor(Math.random() * DEMO_CHAT.length)];
        next.push(newMsg);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const spreadLava = useCallback(() => {
    setGrid(prev => {
      const newGrid = prev.map(row => row.map(cell => ({ ...cell })));
      
      // Count safe tiles
      let safeTiles: { x: number; y: number }[] = [];
      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          if (!newGrid[y][x].isLava) {
            safeTiles.push({ x, y });
          }
        }
      }

      // Convert 50% to lava
      const toConvert = Math.max(1, Math.floor(safeTiles.length * 0.3));
      for (let i = 0; i < toConvert; i++) {
        const idx = Math.floor(Math.random() * safeTiles.length);
        const { x, y } = safeTiles[idx];
        newGrid[y][x].isLava = true;
        safeTiles.splice(idx, 1);
      }

      return newGrid;
    });

    // Eliminate bots on lava
    setBots(prev => prev.map(bot => {
      if (bot.eliminated) return bot;
      if (grid[bot.y]?.[bot.x]?.isLava) {
        return { ...bot, eliminated: true };
      }
      return bot;
    }));
  }, [grid]);

  const aliveBots = bots.filter(b => !b.eliminated);
  const safeTileCount = grid.flat().filter(t => !t.isLava).length;

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-white">
      {/* Header */}
      <div className="border-b border-[var(--color-primary)]/20 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <span className="text-[var(--color-primary)] font-bold text-sm uppercase animate-pulse">
              {PHASE_LABELS[phase] || phase.toUpperCase()}
            </span>
            <span className="text-gray-500">|</span>
            <span className="text-white font-bold">ROUND {round}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm">
              🔥 {aliveBots.length} alive • {safeTileCount} safe tiles
            </span>
            <div className="font-mono text-2xl font-bold text-[var(--color-primary)]">
              {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto p-4 gap-4">
        {/* Left: Bot List */}
        <div className="lg:w-48 flex-shrink-0">
          <div className="text-gray-500 text-xs font-bold tracking-wider mb-3">
            SURVIVORS ({aliveBots.length}/{DEMO_BOTS.length})
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
            {bots.map(bot => (
              <div
                key={bot.id}
                className={`p-2 rounded-lg text-center transition-all ${
                  bot.eliminated
                    ? 'opacity-30 bg-red-900/20'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)]'
                }`}
              >
                <div className="text-xl">{bot.avatar}</div>
                <div className="text-[10px] font-bold truncate">{bot.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Grid */}
        <div className="flex-1 flex justify-center">
          <div
            className="relative rounded-lg overflow-hidden border border-[var(--color-border)]"
            style={{
              width: GRID_WIDTH * CELL_SIZE,
              height: GRID_HEIGHT * CELL_SIZE,
              background: '#0a0a0a',
            }}
          >
            {/* Grid cells */}
            {grid.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`absolute transition-all duration-300 ${
                    cell.isLava
                      ? 'bg-gradient-to-br from-orange-600 to-red-700'
                      : 'bg-[var(--color-surface)] border border-[var(--color-border)]/30'
                  }`}
                  style={{
                    left: x * CELL_SIZE,
                    top: y * CELL_SIZE,
                    width: CELL_SIZE - 1,
                    height: CELL_SIZE - 1,
                  }}
                >
                  {cell.isLava && (
                    <div className="absolute inset-0 flex items-center justify-center text-lg opacity-50">
                      🔥
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Bots */}
            {bots.map(bot => !bot.eliminated && (
              <div
                key={bot.id}
                className="absolute transition-all duration-300 ease-out flex flex-col items-center"
                style={{
                  left: bot.x * CELL_SIZE + CELL_SIZE / 2,
                  top: bot.y * CELL_SIZE + CELL_SIZE / 2,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10 + bot.y,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl border-2 border-[var(--color-primary)]/50 bg-[var(--color-bg)]"
                >
                  {bot.avatar}
                </div>
                <div className="text-[8px] font-bold mt-0.5 text-[var(--color-primary)] bg-black/80 px-1 rounded">
                  {bot.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Chat */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="text-gray-500 text-xs font-bold tracking-wider mb-3">DELIBERATION CHAT</div>
          <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-3 space-y-2">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="text-sm">
                <span className="text-[var(--color-primary)] font-bold">{msg.bot}:</span>
                <span className="text-gray-400 ml-1">{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Phase indicator */}
          <div className="mt-4 p-3 bg-[var(--color-bg-alt)] rounded-lg border border-[var(--color-border)]">
            <div className="text-xs text-gray-500 mb-2">CURRENT PHASE</div>
            <div className="flex gap-1">
              {PHASES.map(p => (
                <div
                  key={p}
                  className={`flex-1 h-2 rounded ${
                    p === phase
                      ? 'bg-[var(--color-primary)]'
                      : 'bg-[var(--color-border)]'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              {phase === 'deliberation' && 'Bots are chatting and strategizing...'}
              {phase === 'commit' && 'Bots are locking in their moves...'}
              {phase === 'resolve' && 'Resolving moves and collisions...'}
              {phase === 'lava_spread' && 'Lava is spreading...'}
            </div>
          </div>

          {/* Rules reminder */}
          <div className="mt-4 p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
            <div className="text-xs text-gray-500 mb-2">HOW IT WORKS</div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Your tile becomes lava - you MUST move</li>
              <li>• Pick any safe tile to teleport to</li>
              <li>• Collision? Random roll decides who lives</li>
              <li>• Last bot standing wins</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
