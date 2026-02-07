'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Wifi, WifiOff, Trophy, Send } from 'lucide-react';
import Link from 'next/link';
import {
  GameState,
  createDemoGameState,
  tick,
  getTimeRemaining,
  getActiveBots,
  GRID_COLS,
  GRID_ROWS,
} from '@/lib/gameEngine';

const TICK_INTERVAL = 100; // ms
const CELL_SIZE = 56;
const BOT_SIZE = 48;
const VIEWPORT_HEIGHT = GRID_ROWS * CELL_SIZE + 40; // Extra padding

interface MatchViewV2Props {
  demoMode?: boolean;
  connected?: boolean;
  externalState?: GameState; // For live matches from server
}

export default function MatchViewV2({ 
  demoMode = true, 
  connected = false,
  externalState 
}: MatchViewV2Props) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(800);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect desktop
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Track viewport width
  useEffect(() => {
    const updateWidth = () => {
      if (viewportRef.current) {
        setViewportWidth(viewportRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Initialize game state
  useEffect(() => {
    if (externalState) {
      setGameState(externalState);
    } else if (demoMode) {
      setGameState(createDemoGameState());
    }
  }, [demoMode, externalState]);

  // Game loop - tick every 100ms
  useEffect(() => {
    if (!gameState || gameState.phase === 'finished' || gameState.phase === 'waiting') {
      return;
    }

    const interval = setInterval(() => {
      setGameState(prev => prev ? tick(prev) : null);
    }, TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [gameState?.phase]);

  // Convert grid position to pixel position
  const gridToPixel = useCallback((col: number, row: number) => {
    const gridWidth = GRID_COLS * CELL_SIZE;
    const gridHeight = GRID_ROWS * CELL_SIZE;
    const offsetX = (viewportWidth - gridWidth) / 2;
    const offsetY = 20; // Top padding
    
    return {
      x: offsetX + col * CELL_SIZE + CELL_SIZE / 2,
      y: offsetY + row * CELL_SIZE + CELL_SIZE / 2,
    };
  }, [viewportWidth]);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-[var(--color-primary)] text-xl mb-2">Loading...</div>
        </div>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining(gameState);
  const activeBots = getActiveBots(gameState);

  // Winner screen
  if (gameState.phase === 'finished' && gameState.winnerId) {
    const winner = gameState.bots.find(b => b.id === gameState.winnerId);
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <Trophy className="w-24 h-24 text-[var(--color-primary)] mb-4 animate-bounce" />
        <h1 className="text-4xl font-bold text-[var(--color-primary)] mb-2">WINNER!</h1>
        <div className="text-6xl mb-4">{winner?.avatar || '🤖'}</div>
        <div className="text-2xl font-bold mb-8">{winner?.name}</div>
        <Link href="/" className="px-6 py-3 bg-[var(--color-primary)] text-black font-bold rounded-lg">
          Back to Lobby
        </Link>
      </div>
    );
  }

  // Format time
  const formatTime = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Desktop layout
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Header */}
        <header className="border-b border-[var(--color-primary)]/20 px-6 py-3">
          <div className="flex items-center justify-between max-w-[1800px] mx-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[var(--color-primary)] rotate-45 flex items-center justify-center">
                  <span className="text-black font-bold text-sm -rotate-45">◆</span>
                </div>
                <span className="font-bold text-xl tracking-tight">PRICE WARS</span>
              </div>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400 text-sm uppercase tracking-wider">
                {gameState.phase.toUpperCase().replace('_', ' ')} PHASE
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-white font-bold">ROUND {gameState.round}/{gameState.totalRounds}</span>
                <div className="flex gap-1">
                  {[1,2,3,4].map(r => (
                    <div 
                      key={r} 
                      className={`w-6 h-2 rounded-full ${r <= gameState.round ? 'bg-[var(--color-primary)]' : 'bg-gray-700'}`}
                    />
                  ))}
                </div>
              </div>

              {gameState.phase === 'deliberation' && (
                <div className="font-mono text-2xl font-bold text-[var(--color-primary)]">
                  {formatTime(timeRemaining)}
                </div>
              )}

              <div className="flex items-center gap-2 px-3 py-1.5 border border-[var(--color-primary)]/50 rounded-full">
                {connected ? (
                  <>
                    <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" />
                    <span className="text-[var(--color-primary)] text-sm font-medium">LIVE</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-500 text-sm font-medium">DEMO</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex max-w-[1800px] mx-auto">
          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Item Display */}
            <div className="mb-4 p-4 bg-[#111] rounded-lg border border-[var(--color-primary)]/20">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden">
                  {gameState.currentItem?.imageUrl ? (
                    <img src={gameState.currentItem.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">📦</span>
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-[var(--color-primary)] text-xs font-bold tracking-wider">ITEM #{gameState.round}</span>
                  <h2 className="text-2xl font-bold mt-1">{gameState.currentItem?.title || 'Mystery Item'}</h2>
                  <p className="text-gray-500 text-sm mt-1">{gameState.currentItem?.category || 'UNKNOWN'}</p>
                </div>
                {(gameState.phase === 'reveal' || gameState.phase === 'elimination') && (
                  <div className="text-right">
                    <span className="text-gray-500 text-xs">ACTUAL PRICE</span>
                    <div className="text-4xl font-bold text-[var(--color-primary)]">
                      ${(gameState.actualPrice / 100).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bot Viewport */}
            <div 
              ref={viewportRef}
              className="relative bg-[#0d0d0d] rounded-lg border border-gray-800 overflow-hidden"
              style={{ height: VIEWPORT_HEIGHT }}
            >
              {/* Grid lines */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                  backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
                }}
              />

              {/* Bots */}
              {gameState.bots.map(bot => {
                const pos = gridToPixel(bot.gridCol, bot.gridRow);
                const recentChat = gameState.chatMessages.find(m => m.botId === bot.id && Date.now() - m.timestamp < 5000);
                
                return (
                  <div
                    key={bot.id}
                    className="absolute transition-all duration-100"
                    style={{
                      left: pos.x - BOT_SIZE / 2,
                      top: pos.y - BOT_SIZE / 2,
                      width: BOT_SIZE,
                    }}
                  >
                    {/* Speech bubble */}
                    {recentChat && !bot.eliminated && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 whitespace-nowrap">
                        <div className="bg-[var(--color-primary)] text-black text-xs px-3 py-2 rounded-lg rounded-bl-none max-w-[200px]">
                          <div className="truncate">{recentChat.message}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Bot avatar */}
                    <BotAvatar bot={bot} showBid={gameState.phase === 'reveal' || gameState.phase === 'elimination'} />
                  </div>
                );
              })}

              {/* Elimination overlay */}
              {gameState.phase === 'elimination' && gameState.eliminatedThisRound.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
                  <div className="text-center">
                    <div className="text-red-500 text-xl font-bold mb-2">⚠ ELIMINATED ⚠</div>
                    <div className="text-2xl font-bold">
                      {gameState.bots
                        .filter(b => gameState.eliminatedThisRound.includes(b.id))
                        .map(b => b.name)
                        .join(' • ')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bid Results */}
            {(gameState.phase === 'reveal' || gameState.phase === 'elimination') && (
              <div className="mt-4 p-4 bg-[#111] rounded-lg border border-gray-800">
                <div className="text-[var(--color-primary)] text-xs font-bold tracking-wider mb-3">BID RESULTS</div>
                <div className="grid grid-cols-4 gap-3">
                  {gameState.bots.filter(b => !b.eliminated || gameState.eliminatedThisRound.includes(b.id)).map(bot => {
                    const isElimThisRound = gameState.eliminatedThisRound.includes(bot.id);
                    const distance = bot.bid ? Math.abs(bot.bid - gameState.actualPrice) : 0;
                    
                    return (
                      <div 
                        key={bot.id}
                        className={`p-3 rounded-lg border ${isElimThisRound ? 'bg-red-500/10 border-red-500/50' : 'bg-gray-900 border-gray-700'}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{bot.avatar}</span>
                          <span className={`font-bold text-sm ${isElimThisRound ? 'text-red-400' : ''}`}>{bot.name}</span>
                        </div>
                        <div className={`font-mono font-bold ${isElimThisRound ? 'text-red-400' : 'text-white'}`}>
                          ${((bot.bid || 0) / 100).toFixed(2)}
                        </div>
                        <div className={`text-xs mt-1 ${distance < gameState.actualPrice * 0.2 ? 'text-green-400' : 'text-red-400'}`}>
                          {distance === 0 ? 'EXACT!' : `$${(distance / 100).toFixed(2)} off`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          <div className="w-[320px] border-l border-gray-800 flex flex-col h-[calc(100vh-73px)]">
            <div className="p-4 border-b border-gray-800">
              <div className="text-[var(--color-primary)] text-xs font-bold tracking-wider">LIVE CHAT</div>
              <div className="text-gray-500 text-xs mt-1">{activeBots.length} bots active</div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {gameState.chatMessages.length === 0 ? (
                <div className="text-gray-600 text-sm text-center py-8">
                  Waiting for bots to chat...
                </div>
              ) : (
                gameState.chatMessages.map(msg => (
                  <div key={msg.id} className="text-sm">
                    <span className="text-[var(--color-primary)] font-bold">{msg.botName}</span>
                    <span className="text-gray-600 text-xs ml-2">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <p className="text-gray-300 mt-0.5">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile layout (simplified)
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4">
      <div className="text-center mb-4">
        <div className="text-[var(--color-primary)] font-bold">ROUND {gameState.round}/{gameState.totalRounds}</div>
        <div className="text-3xl font-mono font-bold">{formatTime(timeRemaining)}</div>
        <div className="text-gray-500 text-sm uppercase">{gameState.phase}</div>
      </div>

      <div className="bg-[#111] rounded-lg p-4 mb-4">
        <h2 className="text-lg font-bold">{gameState.currentItem?.title}</h2>
        {(gameState.phase === 'reveal' || gameState.phase === 'elimination') && (
          <div className="text-2xl font-bold text-[var(--color-primary)] mt-2">
            ${(gameState.actualPrice / 100).toFixed(2)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {gameState.bots.map(bot => (
          <BotAvatar 
            key={bot.id} 
            bot={bot} 
            showBid={gameState.phase === 'reveal' || gameState.phase === 'elimination'}
            compact
          />
        ))}
      </div>
    </div>
  );
}

function BotAvatar({ 
  bot, 
  showBid = false,
  compact = false 
}: { 
  bot: GameState['bots'][0]; 
  showBid?: boolean;
  compact?: boolean;
}) {
  const getBgColor = (avatar: string) => {
    const colors: Record<string, string> = {
      '🤖': 'rgba(59, 130, 246, 0.3)',
      '🦾': 'rgba(234, 179, 8, 0.3)',
      '👾': 'rgba(168, 85, 247, 0.3)',
      '🔮': 'rgba(236, 72, 153, 0.3)',
      '🧠': 'rgba(244, 114, 182, 0.3)',
      '⚡': 'rgba(250, 204, 21, 0.3)',
      '💎': 'rgba(34, 211, 238, 0.3)',
      '🎯': 'rgba(239, 68, 68, 0.3)',
    };
    return colors[avatar] || 'rgba(100, 100, 100, 0.3)';
  };

  return (
    <div className="relative">
      <div 
        className={`
          ${compact ? 'w-full aspect-square' : 'w-12 h-12'} 
          rounded-lg border-2 flex items-center justify-center
          ${bot.eliminated ? 'border-red-500 opacity-40 grayscale' : 'border-gray-600'}
          ${compact ? 'text-2xl' : 'text-2xl'}
        `}
        style={{ backgroundColor: bot.eliminated ? 'rgba(239, 68, 68, 0.2)' : getBgColor(bot.avatar) }}
      >
        {bot.avatar}
        
        {bot.eliminated && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-red-500 text-2xl font-bold">✕</span>
          </div>
        )}
      </div>
      
      <div className={`text-center mt-1 ${bot.eliminated ? 'text-red-400' : 'text-gray-400'} ${compact ? 'text-[8px]' : 'text-[10px]'} font-bold truncate`}>
        {bot.name}
      </div>
      
      {showBid && bot.bid && !bot.eliminated && (
        <div className="text-center text-[10px] text-[var(--color-primary)]">
          ${(bot.bid / 100).toFixed(0)}
        </div>
      )}
    </div>
  );
}
