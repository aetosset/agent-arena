'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ========== INLINE GAME STATE (no imports, no indirection) ==========

type Phase = 'deliberation' | 'reveal' | 'elimination' | 'finished';

interface Bot {
  id: string;
  name: string;
  avatar: string;
  eliminated: boolean;
  col: number;
  row: number;
  bid: number | null;
}

interface Game {
  phase: Phase;
  round: number;
  startTime: number;
  bots: Bot[];
  price: number;
  eliminated: string[];
}

const COLS = 12;
const ROWS = 6;
const CELL = 64;

const PHASE_MS = {
  deliberation: 12000,
  reveal: 3000,
  elimination: 3000,
};

// Initial bot setup
function createBots(): Bot[] {
  const names = ['GROK', 'SNIPE', 'ARCH', 'HYPE', 'BID-LORD', 'FLUX', 'NEO', 'ZEN'];
  const avatars = ['🤖', '🦾', '👾', '🔮', '🧠', '⚡', '💎', '🎯'];
  
  return names.map((name, i) => {
    // Spread bots across grid
    const col = 2 + (i % 4) * 2;
    const row = 1 + Math.floor(i / 4) * 3;
    return {
      id: `bot-${i}`,
      name,
      avatar: avatars[i],
      eliminated: false,
      col,
      row,
      bid: null,
    };
  });
}

function createGame(): Game {
  return {
    phase: 'deliberation',
    round: 1,
    startTime: Date.now(),
    bots: createBots(),
    price: 4500, // $45.00
    eliminated: [],
  };
}

// ========== COMPONENT ==========

export default function MatchRound1() {
  const [game, setGame] = useState<Game | null>(null);
  const [tickCount, setTickCount] = useState(0);
  const tickRef = useRef(0);

  // Initialize game on mount
  useEffect(() => {
    console.log('🎮 Initializing game');
    setGame(createGame());
  }, []);

  // Movement loop - SEPARATE from game state
  useEffect(() => {
    if (!game || game.phase !== 'deliberation') {
      console.log('❌ Movement loop not starting:', game?.phase);
      return;
    }
    
    console.log('✅ Starting movement loop');
    
    const interval = setInterval(() => {
      tickRef.current++;
      setTickCount(tickRef.current);
      
      // Move bots randomly
      setGame(prev => {
        if (!prev || prev.phase !== 'deliberation') return prev;
        
        const occupied = new Set(prev.bots.map(b => `${b.col},${b.row}`));
        
        const newBots = prev.bots.map(bot => {
          if (bot.eliminated) return bot;
          if (Math.random() > 0.3) return bot; // 30% chance to move
          
          occupied.delete(`${bot.col},${bot.row}`);
          
          // Random direction
          const dirs = [[0,-1], [0,1], [-1,0], [1,0]];
          const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
          const newCol = bot.col + dx;
          const newRow = bot.row + dy;
          
          if (
            newCol >= 0 && newCol < COLS &&
            newRow >= 0 && newRow < ROWS &&
            !occupied.has(`${newCol},${newRow}`)
          ) {
            console.log(`🚶 ${bot.name} moved to (${newCol}, ${newRow})`);
            occupied.add(`${newCol},${newRow}`);
            return { ...bot, col: newCol, row: newRow };
          }
          
          occupied.add(`${bot.col},${bot.row}`);
          return bot;
        });
        
        return { ...prev, bots: newBots };
      });
    }, 300); // Move check every 300ms
    
    return () => {
      console.log('🛑 Stopping movement loop');
      clearInterval(interval);
    };
  }, [game?.phase]);

  // Phase timer
  useEffect(() => {
    if (!game || game.phase === 'finished') return;
    
    const duration = PHASE_MS[game.phase as keyof typeof PHASE_MS] || 3000;
    const elapsed = Date.now() - game.startTime;
    const remaining = duration - elapsed;
    
    if (remaining <= 0) {
      // Advance phase
      advancePhase();
      return;
    }
    
    const timeout = setTimeout(advancePhase, remaining);
    return () => clearTimeout(timeout);
  }, [game?.phase, game?.startTime]);

  function advancePhase() {
    setGame(prev => {
      if (!prev) return prev;
      
      console.log(`⏭️ Advancing from ${prev.phase}`);
      
      switch (prev.phase) {
        case 'deliberation': {
          // Generate bids
          const withBids = prev.bots.map(b => ({
            ...b,
            bid: b.eliminated ? null : Math.floor(prev.price * (0.6 + Math.random() * 0.8))
          }));
          return { ...prev, phase: 'reveal', startTime: Date.now(), bots: withBids };
        }
        
        case 'reveal': {
          // Eliminate 2 worst
          const active = prev.bots.filter(b => !b.eliminated);
          const sorted = [...active].sort((a, b) => {
            const distA = Math.abs((a.bid || 0) - prev.price);
            const distB = Math.abs((b.bid || 0) - prev.price);
            return distB - distA;
          });
          const elimIds = sorted.slice(0, 2).map(b => b.id);
          const newBots = prev.bots.map(b => 
            elimIds.includes(b.id) ? { ...b, eliminated: true } : b
          );
          return { ...prev, phase: 'elimination', startTime: Date.now(), bots: newBots, eliminated: elimIds };
        }
        
        case 'elimination': {
          const remaining = prev.bots.filter(b => !b.eliminated);
          if (remaining.length <= 1) {
            return { ...prev, phase: 'finished' };
          }
          // Next round
          return {
            ...prev,
            phase: 'deliberation',
            round: prev.round + 1,
            startTime: Date.now(),
            price: [4500, 4000, 20000, 900][prev.round] || 5000,
            eliminated: [],
            bots: prev.bots.map(b => ({ ...b, bid: null })),
          };
        }
        
        default:
          return prev;
      }
    });
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (game.phase === 'finished') {
    const winner = game.bots.find(b => !b.eliminated);
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-4xl font-bold text-green-400 mb-2">WINNER!</h1>
        <div className="text-6xl mb-4">{winner?.avatar}</div>
        <div className="text-2xl font-bold mb-8">{winner?.name}</div>
        <Link href="/" className="px-6 py-3 bg-green-400 text-black font-bold rounded-lg">
          Back to Lobby
        </Link>
      </div>
    );
  }

  const elapsed = Date.now() - game.startTime;
  const duration = PHASE_MS[game.phase as keyof typeof PHASE_MS] || 3000;
  const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b border-green-400/30 pb-4">
        <div>
          <span className="text-green-400 font-bold text-lg">ROUND {game.round}</span>
          <span className="text-gray-500 mx-2">|</span>
          <span className="text-yellow-400 uppercase">{game.phase}</span>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-bold text-green-400">{remaining}s</div>
          <div className="text-gray-500 text-xs">tick #{tickCount}</div>
        </div>
      </div>

      {/* Item */}
      <div className="bg-gray-900 rounded-lg p-4 mb-4 flex items-center gap-4">
        <div className="text-4xl">📦</div>
        <div className="flex-1">
          <div className="text-green-400 text-xs">GUESS THE PRICE</div>
          <div className="text-xl font-bold">Cat Butt Tissue Dispenser</div>
        </div>
        {(game.phase === 'reveal' || game.phase === 'elimination') && (
          <div className="text-right">
            <div className="text-gray-500 text-xs">ACTUAL</div>
            <div className="text-2xl font-bold text-green-400">${(game.price / 100).toFixed(2)}</div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div 
        className="relative bg-gray-900 rounded-lg overflow-hidden mx-auto"
        style={{ 
          width: COLS * CELL, 
          height: ROWS * CELL,
          backgroundImage: 'linear-gradient(rgba(0,255,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.1) 1px, transparent 1px)',
          backgroundSize: `${CELL}px ${CELL}px`
        }}
      >
        {game.bots.map(bot => {
          const isElimThisRound = game.eliminated.includes(bot.id);
          
          return (
            <div
              key={bot.id}
              className="absolute transition-all duration-200 ease-out flex flex-col items-center"
              style={{
                left: bot.col * CELL + CELL / 2 - 28,
                top: bot.row * CELL + CELL / 2 - 28,
                opacity: bot.eliminated && !isElimThisRound ? 0.3 : 1,
              }}
            >
              <div 
                className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl
                  ${bot.eliminated ? 'border-red-500 bg-red-500/20' : 'border-green-400/50 bg-gray-800'}
                  ${isElimThisRound ? 'animate-pulse' : ''}
                `}
              >
                {bot.avatar}
                {bot.eliminated && <span className="absolute text-red-500 text-3xl">✕</span>}
              </div>
              <div className={`text-xs font-bold mt-1 ${bot.eliminated ? 'text-red-400' : 'text-gray-400'}`}>
                {bot.name}
              </div>
              {(game.phase === 'reveal' || game.phase === 'elimination') && bot.bid && (
                <div className="text-xs text-green-400 font-mono">
                  ${(bot.bid / 100).toFixed(0)}
                </div>
              )}
            </div>
          );
        })}

        {/* Elimination overlay */}
        {game.phase === 'elimination' && game.eliminated.length > 0 && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-2xl font-bold mb-2">⚠️ ELIMINATED ⚠️</div>
              <div className="text-xl">
                {game.bots.filter(b => game.eliminated.includes(b.id)).map(b => 
                  `${b.avatar} ${b.name}`
                ).join('  •  ')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bid results */}
      {(game.phase === 'reveal' || game.phase === 'elimination') && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {game.bots.filter(b => !b.eliminated || game.eliminated.includes(b.id)).map(bot => {
            const isOut = game.eliminated.includes(bot.id);
            const dist = Math.abs((bot.bid || 0) - game.price);
            return (
              <div key={bot.id} className={`p-2 rounded ${isOut ? 'bg-red-500/20 border border-red-500' : 'bg-gray-800'}`}>
                <div className="flex items-center gap-1">
                  <span>{bot.avatar}</span>
                  <span className={`text-xs font-bold ${isOut ? 'text-red-400' : ''}`}>{bot.name}</span>
                </div>
                <div className="font-mono">${((bot.bid || 0) / 100).toFixed(2)}</div>
                <div className={`text-xs ${dist < game.price * 0.2 ? 'text-green-400' : 'text-red-400'}`}>
                  ${(dist / 100).toFixed(2)} off
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
