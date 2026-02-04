'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Wifi, WifiOff, Trophy, Send } from 'lucide-react';
import Link from 'next/link';

type MatchPhase = 'starting' | 'deliberation' | 'bid-reveal' | 'price-reveal' | 'elimination' | 'round-end' | 'finished';

interface BotData {
  id: string;
  name: string;
  avatar: string;
  eliminated?: boolean;
  bid?: number;
}

interface BotPosition {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

interface SpeechBubble {
  botId: string;
  botName: string;
  message: string;
  expiresAt: number;
}

interface DesktopMatchViewProps {
  phase: MatchPhase;
  round: number;
  timer: number;
  bots: BotData[];
  item: any;
  bids: any[];
  actualPrice: number;
  eliminated: any[];
  chat: any[];
  winner: any;
  connected: boolean;
  demoMode: boolean;
}

const VIEWPORT_HEIGHT = 450;
const BOT_SIZE = 64;
const MOVE_INTERVAL = 80; // ms between position updates (faster)
const GRID_SNAP = 12; // pixel grid for blocky movement (larger steps)

export default function DesktopMatchView({
  phase,
  round,
  timer,
  bots,
  item,
  bids,
  actualPrice,
  eliminated,
  chat,
  winner,
  connected,
  demoMode
}: DesktopMatchViewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(800);
  const [botPositions, setBotPositions] = useState<Map<string, BotPosition>>(new Map());
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [chatInput, setChatInput] = useState('');

  const eliminatedIds = eliminated.map((e: any) => e.botId);

  // Initialize bot positions
  useEffect(() => {
    if (!viewportRef.current) return;
    const width = viewportRef.current.offsetWidth;
    setViewportWidth(width);

    const newPositions = new Map<string, BotPosition>();
    bots.forEach((bot, idx) => {
      // Spread bots around the viewport initially
      const angle = (idx / bots.length) * Math.PI * 2;
      const radius = Math.min(width, VIEWPORT_HEIGHT) * 0.3;
      const centerX = width / 2;
      const centerY = VIEWPORT_HEIGHT / 2;
      const x = snapToGrid(centerX + Math.cos(angle) * radius);
      const y = snapToGrid(centerY + Math.sin(angle) * radius);
      newPositions.set(bot.id, { x, y, targetX: x, targetY: y });
    });
    setBotPositions(newPositions);
  }, [bots]);

  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => {
      if (viewportRef.current) {
        setViewportWidth(viewportRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bot wandering movement during deliberation
  useEffect(() => {
    if (phase !== 'deliberation') return;

    const interval = setInterval(() => {
      setBotPositions(prev => {
        const newPositions = new Map(prev);
        
        bots.forEach(bot => {
          if (eliminatedIds.includes(bot.id)) return;
          
          const pos = newPositions.get(bot.id);
          if (!pos) return;

          // Move toward target
          let newX = pos.x;
          let newY = pos.y;
          
          if (Math.abs(pos.x - pos.targetX) > GRID_SNAP) {
            newX = pos.x + (pos.targetX > pos.x ? GRID_SNAP : -GRID_SNAP);
          }
          if (Math.abs(pos.y - pos.targetY) > GRID_SNAP) {
            newY = pos.y + (pos.targetY > pos.y ? GRID_SNAP : -GRID_SNAP);
          }

          // Pick new target if reached current one OR randomly change direction (10% chance)
          let newTargetX = pos.targetX;
          let newTargetY = pos.targetY;
          
          const reachedTarget = Math.abs(newX - pos.targetX) <= GRID_SNAP && Math.abs(newY - pos.targetY) <= GRID_SNAP;
          const randomChange = Math.random() < 0.08; // 8% chance to change direction
          
          if (reachedTarget || randomChange) {
            // Random new target within viewport bounds
            const margin = BOT_SIZE;
            newTargetX = snapToGrid(margin + Math.random() * (viewportWidth - margin * 2));
            newTargetY = snapToGrid(margin + Math.random() * (VIEWPORT_HEIGHT - margin * 2));
          }

          newPositions.set(bot.id, {
            x: newX,
            y: newY,
            targetX: newTargetX,
            targetY: newTargetY
          });
        });

        return newPositions;
      });
    }, MOVE_INTERVAL);

    return () => clearInterval(interval);
  }, [phase, bots, eliminatedIds, viewportWidth]);

  // Handle chat messages -> speech bubbles
  useEffect(() => {
    if (chat.length === 0) return;
    const latest = chat[chat.length - 1];
    
    setSpeechBubbles(prev => {
      // Add new bubble
      const newBubble: SpeechBubble = {
        botId: latest.botId,
        botName: latest.botName,
        message: latest.message,
        expiresAt: Date.now() + 5000
      };
      return [...prev.filter(b => b.botId !== latest.botId), newBubble];
    });
  }, [chat]);

  // Clean up expired speech bubbles
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeechBubbles(prev => prev.filter(b => b.expiresAt > Date.now()));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Winner screen
  if (phase === 'finished' && winner) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <Trophy className="w-24 h-24 text-[#00ff00] mb-4 animate-bounce" />
        <h1 className="text-4xl font-bold text-[#00ff00] mb-2">WINNER!</h1>
        <div className="text-6xl mb-4">{winner.avatar || '🤖'}</div>
        <div className="text-2xl font-bold mb-8">{winner.name}</div>
        <Link href="/" className="px-6 py-3 bg-[#00ff00] text-black font-bold rounded-lg">
          Back to Lobby
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#00ff00]/20 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#00ff00] rotate-45 flex items-center justify-center">
                <span className="text-black font-bold text-sm -rotate-45">◆</span>
              </div>
              <span className="font-bold text-xl tracking-tight">PRICE WARS</span>
            </div>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400 text-sm uppercase tracking-wider">
              {phase === 'deliberation' ? 'DELIBERATION PHASE' : 
               phase === 'bid-reveal' ? 'BID REVEAL' :
               phase === 'price-reveal' ? 'PRICE REVEAL' :
               phase === 'elimination' ? 'ELIMINATION' : 'MATCH IN PROGRESS'}
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Round indicator */}
            <div className="flex items-center gap-3">
              <span className="text-white font-bold">ROUND {round}/4</span>
              <div className="flex gap-1">
                {[1,2,3,4].map(r => (
                  <div 
                    key={r} 
                    className={`w-6 h-2 rounded-full ${r <= round ? 'bg-[#00ff00]' : 'bg-gray-700'}`}
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            {phase === 'deliberation' && (
              <div className="font-mono text-2xl font-bold text-[#00ff00]">
                {formatTime(timer)}
              </div>
            )}

            {/* Connection status */}
            <div className="flex items-center gap-2 px-3 py-1.5 border border-[#00ff00]/50 rounded-full">
              {connected ? (
                <>
                  <span className="w-2 h-2 bg-[#00ff00] rounded-full animate-pulse" />
                  <span className="text-[#00ff00] text-sm font-medium">LIVE</span>
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
          {/* Item Display - Fixed Top Row */}
          <div className="mb-4 p-4 bg-[#111] rounded-lg border border-[#00ff00]/20">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden">
                {item?.imageUrls?.[0] ? (
                  <img 
                    src={item.imageUrls[0]} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl">📦</span>
                )}
              </div>
              <div className="flex-1">
                <span className="text-[#00ff00] text-xs font-bold tracking-wider">ITEM #{round}</span>
                <h2 className="text-2xl font-bold mt-1">{item?.title || 'Mystery Item'}</h2>
                <p className="text-gray-500 text-sm mt-1">{item?.category || 'UNKNOWN CATEGORY'}</p>
              </div>
              {(phase === 'price-reveal' || phase === 'elimination') && actualPrice > 0 && (
                <div className="text-right">
                  <span className="text-gray-500 text-xs">ACTUAL PRICE</span>
                  <div className="text-4xl font-bold text-[#00ff00]">
                    ${(actualPrice / 100).toFixed(2)}
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
            {/* Grid pattern background */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }}
            />

            {/* Bots */}
            {bots.map(bot => {
              const pos = botPositions.get(bot.id);
              const isElim = eliminatedIds.includes(bot.id);
              const bubble = speechBubbles.find(b => b.botId === bot.id);
              
              if (!pos) return null;

              return (
                <div
                  key={bot.id}
                  className="absolute transition-all"
                  style={{
                    left: pos.x - BOT_SIZE / 2,
                    top: pos.y - BOT_SIZE / 2,
                    width: BOT_SIZE,
                    transitionDuration: `${MOVE_INTERVAL}ms`,
                    transitionTimingFunction: 'linear'
                  }}
                >
                  {/* Speech Bubble */}
                  {bubble && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 animate-fade-in whitespace-nowrap">
                      <div className="bg-[#00ff00] text-black text-xs px-3 py-2 rounded-lg rounded-bl-none max-w-[200px]">
                        <div className="font-bold text-[10px] mb-0.5">{bubble.botName}</div>
                        <div className="truncate">{bubble.message}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Bot Avatar */}
                  <ViewportBot 
                    bot={bot} 
                    isEliminated={isElim}
                    isActive={!!bubble}
                    phase={phase}
                  />
                </div>
              );
            })}

            {/* Elimination overlay */}
            {phase === 'elimination' && eliminated.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
                <div className="text-center">
                  <div className="text-red-500 text-xl font-bold mb-2">⚠ ELIMINATED ⚠</div>
                  <div className="text-2xl font-bold">
                    {eliminated.map((e: any) => e.botName).join(' • ')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bid Results - shown during reveal phases */}
          {(phase === 'bid-reveal' || phase === 'price-reveal' || phase === 'elimination') && bids.length > 0 && (
            <div className="mt-4 p-4 bg-[#111] rounded-lg border border-gray-800">
              <div className="text-[#00ff00] text-xs font-bold tracking-wider mb-3">BID RESULTS</div>
              <div className="grid grid-cols-4 gap-3">
                {bids.map((bid: any) => {
                  const isElim = eliminatedIds.includes(bid.botId);
                  const distance = actualPrice > 0 ? Math.abs(bid.price - actualPrice) : 0;
                  return (
                    <div 
                      key={bid.botId}
                      className={`p-3 rounded-lg border ${isElim ? 'bg-red-500/10 border-red-500/50' : 'bg-gray-900 border-gray-700'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{bots.find(b => b.id === bid.botId)?.avatar || '🤖'}</span>
                        <span className={`font-bold text-sm ${isElim ? 'text-red-400' : ''}`}>{bid.botName}</span>
                      </div>
                      <div className={`font-mono font-bold ${isElim ? 'text-red-400' : 'text-white'}`}>
                        ${(bid.price / 100).toFixed(2)}
                      </div>
                      {actualPrice > 0 && (
                        <div className={`text-xs mt-1 ${distance < actualPrice * 0.2 ? 'text-green-400' : 'text-red-400'}`}>
                          {distance === 0 ? 'EXACT!' : `${distance < bid.price ? '-' : '+'}$${(distance / 100).toFixed(2)} off`}
                        </div>
                      )}
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
            <div className="text-[#00ff00] text-xs font-bold tracking-wider">LIVE CHAT</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.length === 0 ? (
              <div className="text-gray-600 text-sm text-center py-8">
                No messages yet...
              </div>
            ) : (
              chat.map((msg: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <span className="text-[#00ff00] font-bold">{msg.botName}</span>
                  <span className="text-gray-600 text-xs ml-2">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <p className="text-gray-300 mt-0.5">{msg.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Chat Input (placeholder for spectators) */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00ff00]/50"
              />
              <button className="px-3 py-2 bg-[#00ff00] text-black rounded-lg hover:bg-[#00cc00]">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewportBot({ bot, isEliminated, isActive, phase }: { 
  bot: BotData; 
  isEliminated: boolean;
  isActive: boolean;
  phase: MatchPhase;
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
      '👑': 'rgba(251, 191, 36, 0.3)',
      '🏷️': 'rgba(74, 222, 128, 0.3)',
    };
    return colors[avatar] || 'rgba(100, 100, 100, 0.3)';
  };

  return (
    <div className="relative">
      <div 
        className={`
          w-16 h-16 rounded-lg border-2 flex items-center justify-center text-3xl
          transition-all duration-200
          ${isActive ? 'border-[#00ff00] shadow-[0_0_20px_rgba(0,255,0,0.4)]' : 'border-gray-600'}
          ${isEliminated ? 'border-red-500 opacity-40 grayscale' : ''}
        `}
        style={{ backgroundColor: isEliminated ? 'rgba(239, 68, 68, 0.2)' : getBgColor(bot.avatar) }}
      >
        {bot.avatar}
        
        {/* Elimination X overlay */}
        {isEliminated && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-red-500 text-4xl font-bold">✕</span>
          </div>
        )}
      </div>
      
      {/* Name label */}
      <div className={`text-[10px] text-center mt-1 font-bold ${isEliminated ? 'text-red-400' : 'text-gray-400'}`}>
        {bot.name}
      </div>
    </div>
  );
}

function snapToGrid(value: number): number {
  return Math.round(value / GRID_SNAP) * GRID_SNAP;
}
