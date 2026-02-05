'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  GameState,
  createGame,
  tick,
  timeLeft,
  activeBots,
  COLS,
  ROWS,
} from '@/lib/gameEngineV2';

const CELL = 56;
const BOT_SIZE = 48;

export default function MatchRound1() {
  const [game, setGame] = useState<GameState | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [vpWidth, setVpWidth] = useState(800);

  // Start game immediately on mount
  useEffect(() => {
    setGame(createGame());
  }, []);

  // Track viewport width
  useEffect(() => {
    const update = () => {
      if (viewportRef.current) {
        setVpWidth(viewportRef.current.offsetWidth);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Game loop - tick every 100ms
  useEffect(() => {
    if (!game || game.phase === 'finished') return;
    const id = setInterval(() => setGame(g => g ? tick(g) : null), 100);
    return () => clearInterval(id);
  }, [game?.phase]);

  // Grid position to pixels
  const toPixel = useCallback((col: number, row: number) => {
    const gw = COLS * CELL;
    const ox = (vpWidth - gw) / 2;
    return {
      x: ox + col * CELL + CELL / 2,
      y: 20 + row * CELL + CELL / 2,
    };
  }, [vpWidth]);

  if (!game) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#00ff00] text-xl">Loading...</div>
      </div>
    );
  }

  const remaining = timeLeft(game);
  const active = activeBots(game);

  // Winner screen
  if (game.phase === 'finished') {
    const winner = game.bots.find(b => b.id === game.winnerId);
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-4xl font-bold text-[#00ff00] mb-2">WINNER!</h1>
        <div className="text-6xl mb-4">{winner?.avatar}</div>
        <div className="text-2xl font-bold mb-8">{winner?.name}</div>
        <Link href="/" className="px-6 py-3 bg-[#00ff00] text-black font-bold rounded-lg">
          Back to Lobby
        </Link>
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#00ff00]/20 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-[#00ff00] rotate-45 flex items-center justify-center">
              <span className="text-black font-bold text-sm -rotate-45">◆</span>
            </div>
            <span className="font-bold text-xl">PRICE WARS</span>
            <span className="text-gray-500">|</span>
            <span className="text-[#00ff00] text-sm font-bold uppercase tracking-wider">
              {game.phase === 'deliberation' && 'DELIBERATION'}
              {game.phase === 'reveal' && 'REVEALING BIDS'}
              {game.phase === 'elimination' && 'ELIMINATION'}
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">ROUND {game.round}/4</span>
              <div className="flex gap-1">
                {[1,2,3,4].map(r => (
                  <div key={r} className={`w-5 h-2 rounded-full ${r <= game.round ? 'bg-[#00ff00]' : 'bg-gray-700'}`} />
                ))}
              </div>
            </div>
            
            <div className="font-mono text-2xl font-bold text-[#00ff00] w-16 text-right">
              {formatTime(remaining)}
            </div>

            <div className="px-3 py-1.5 border border-[#00ff00]/50 rounded-full">
              <span className="text-gray-400 text-sm">DEMO</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex max-w-[1600px] mx-auto">
        {/* Main Area */}
        <div className="flex-1 p-6">
          {/* Item Card */}
          <div className="mb-4 p-4 bg-[#111] rounded-lg border border-[#00ff00]/20">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center text-4xl">
                📦
              </div>
              <div className="flex-1">
                <span className="text-[#00ff00] text-xs font-bold">ITEM #{game.round}</span>
                <h2 className="text-xl font-bold">{game.item.title}</h2>
              </div>
              {(game.phase === 'reveal' || game.phase === 'elimination') && (
                <div className="text-right">
                  <span className="text-gray-500 text-xs">ACTUAL PRICE</span>
                  <div className="text-3xl font-bold text-[#00ff00]">
                    ${(game.actualPrice / 100).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bot Viewport */}
          <div 
            ref={viewportRef}
            className="relative bg-[#0d0d0d] rounded-lg border border-gray-800 overflow-hidden"
            style={{ height: ROWS * CELL + 40 }}
          >
            {/* Grid lines */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                backgroundSize: `${CELL}px ${CELL}px`
              }}
            />

            {/* Bots */}
            {game.bots.map(bot => {
              const pos = toPixel(bot.gridCol, bot.gridRow);
              const chat = game.chat.find(c => c.botId === bot.id && Date.now() - c.time < 3000);
              const isElimThisRound = game.eliminatedThisRound.includes(bot.id);
              
              return (
                <div
                  key={bot.id}
                  className="absolute transition-all duration-150 ease-out"
                  style={{
                    left: pos.x - BOT_SIZE / 2,
                    top: pos.y - BOT_SIZE / 2,
                    opacity: bot.eliminated && !isElimThisRound ? 0.3 : 1,
                  }}
                >
                  {/* Chat bubble */}
                  {chat && !bot.eliminated && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20">
                      <div className="bg-[#00ff00] text-black text-xs px-2 py-1 rounded-lg rounded-bl-none max-w-[160px] truncate">
                        {chat.message}
                      </div>
                    </div>
                  )}
                  
                  {/* Avatar */}
                  <div 
                    className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl
                      ${bot.eliminated ? 'border-red-500 grayscale' : 'border-gray-600'}
                      ${isElimThisRound ? 'animate-pulse border-red-500' : ''}
                    `}
                    style={{ backgroundColor: bot.eliminated ? 'rgba(239,68,68,0.2)' : getColor(bot.avatar) }}
                  >
                    {bot.avatar}
                    {bot.eliminated && (
                      <span className="absolute text-red-500 text-2xl font-bold">✕</span>
                    )}
                  </div>
                  
                  <div className={`text-center mt-1 text-[10px] font-bold truncate ${bot.eliminated ? 'text-red-400' : 'text-gray-400'}`}>
                    {bot.name}
                  </div>
                </div>
              );
            })}

            {/* Elimination overlay */}
            {game.phase === 'elimination' && game.eliminatedThisRound.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
                <div className="text-center">
                  <div className="text-red-500 text-xl font-bold mb-2">⚠ ELIMINATED ⚠</div>
                  <div className="text-2xl font-bold text-white">
                    {game.bots
                      .filter(b => game.eliminatedThisRound.includes(b.id))
                      .map(b => `${b.avatar} ${b.name}`)
                      .join('  •  ')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bid Results Table */}
          {(game.phase === 'reveal' || game.phase === 'elimination') && (
            <div className="mt-4 p-4 bg-[#111] rounded-lg border border-gray-800">
              <div className="text-[#00ff00] text-xs font-bold mb-3">BID RESULTS</div>
              <div className="grid grid-cols-4 gap-2">
                {game.bots.filter(b => !b.eliminated || game.eliminatedThisRound.includes(b.id)).map(bot => {
                  const isOut = game.eliminatedThisRound.includes(bot.id);
                  const dist = Math.abs((bot.bid || 0) - game.actualPrice);
                  
                  return (
                    <div 
                      key={bot.id}
                      className={`p-2 rounded-lg border ${isOut ? 'bg-red-500/10 border-red-500/50' : 'bg-gray-900 border-gray-700'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{bot.avatar}</span>
                        <span className={`font-bold text-xs ${isOut ? 'text-red-400' : ''}`}>{bot.name}</span>
                      </div>
                      <div className={`font-mono font-bold ${isOut ? 'text-red-400' : ''}`}>
                        ${((bot.bid || 0) / 100).toFixed(2)}
                      </div>
                      <div className={`text-xs mt-0.5 ${dist < game.actualPrice * 0.15 ? 'text-green-400' : 'text-red-400'}`}>
                        ${(dist / 100).toFixed(2)} off
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="w-[280px] border-l border-gray-800 flex flex-col h-[calc(100vh-73px)]">
          <div className="p-4 border-b border-gray-800">
            <div className="text-[#00ff00] text-xs font-bold">LIVE CHAT</div>
            <div className="text-gray-500 text-xs mt-1">{active.length} bots active</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {game.chat.length === 0 ? (
              <div className="text-gray-600 text-sm text-center py-8">
                Waiting for bots...
              </div>
            ) : (
              game.chat.map(msg => (
                <div key={msg.id} className="text-sm">
                  <span className="text-[#00ff00] font-bold">{msg.botName}</span>
                  <p className="text-gray-300">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getColor(avatar: string): string {
  const colors: Record<string, string> = {
    '🤖': 'rgba(59,130,246,0.3)',
    '🦾': 'rgba(234,179,8,0.3)',
    '👾': 'rgba(168,85,247,0.3)',
    '🔮': 'rgba(236,72,153,0.3)',
    '🧠': 'rgba(244,114,182,0.3)',
    '⚡': 'rgba(250,204,21,0.3)',
    '💎': 'rgba(34,211,238,0.3)',
    '🎯': 'rgba(239,68,68,0.3)',
  };
  return colors[avatar] || 'rgba(100,100,100,0.3)';
}
