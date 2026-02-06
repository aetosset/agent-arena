'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ========== SOUND EFFECTS ==========
const audioContextRef = { current: null as AudioContext | null };

function playBotSound() {
  try {
    // Lazy init audio context (needs user interaction first)
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    
    // Create oscillator for a cute blip
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Random pitch variation for variety (400-800 Hz range, cute bloop sounds)
    const baseFreq = 500 + Math.random() * 300;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, ctx.currentTime + 0.1);
    
    // Sine wave = soft/cute, triangle = slightly brighter
    osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
    
    // Quick fade in/out for a soft blip
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Audio not supported or not allowed - fail silently
  }
}

// ========== TYPES ==========

type Phase = 'deliberation' | 'reveal' | 'elimination' | 'roundSummary' | 'finished';

interface Bot {
  id: string;
  name: string;
  avatar: string;
  eliminated: boolean;
  col: number;
  row: number;
  bid: number | null;
}

interface ChatMsg {
  id: string;
  botId: string;
  botName: string;
  avatar: string;
  text: string;
  time: number;
}

interface Game {
  phase: Phase;
  round: number;
  startTime: number;
  bots: Bot[];
  price: number;
  eliminated: string[]; // eliminated THIS round
  eliminationOrder: string[]; // ALL eliminations in order (for rankings)
  chat: ChatMsg[];
  item: typeof DEMO_ITEMS[0];
}

// ========== CONSTANTS ==========

const COLS = 14;
const ROWS = 8;
const CELL = 72; // Larger cells

const PHASE_MS = {
  deliberation: 15000,
  reveal: 4000,
  elimination: 4000,
  roundSummary: 5000, // 5 second countdown before next round
};

// Demo products for each round
const DEMO_ITEMS = [
  { title: 'Cat Butt Tissue Dispenser', category: 'NOVELTY / HOME', price: 4500, emoji: '🐱' },
  { title: 'Nicolas Cage Sequin Pillow', category: 'HOME / DECOR', price: 1999, emoji: '🎭' },
  { title: 'Inflatable T-Rex Costume', category: 'COSTUMES', price: 5999, emoji: '🦖' },
  { title: 'Banana Phone Handset', category: 'ELECTRONICS', price: 2499, emoji: '🍌' },
];

const CHAT_LINES = [
  "Analyzing market data...",
  "This looks interesting.",
  "Running calculations...",
  "My neural nets are tingling.",
  "Computing optimal bid...",
  "Easy money.",
  "Don't even try.",
  "I've seen better.",
  "This one's mine.",
  "Processing... confidence: HIGH.",
  "Adjusting for market volatility...",
  "Too easy. Next.",
  "Y'all are about to get wrecked.",
  "My algorithms are unmatched.",
  "Interesting piece. Let me calculate.",
  "Running the numbers... looking good.",
];

const AVATAR_COLORS: Record<string, string> = {
  '🤖': 'rgba(59, 130, 246, 0.3)',   // blue
  '🦾': 'rgba(234, 179, 8, 0.3)',    // yellow
  '👾': 'rgba(168, 85, 247, 0.3)',   // purple
  '🔮': 'rgba(236, 72, 153, 0.3)',   // pink
  '🧠': 'rgba(244, 114, 182, 0.3)',  // rose
  '⚡': 'rgba(250, 204, 21, 0.3)',   // amber
  '💎': 'rgba(34, 211, 238, 0.3)',   // cyan
  '🎯': 'rgba(239, 68, 68, 0.3)',    // red
};

// ========== INIT ==========

function createBots(): Bot[] {
  const names = ['GROK-V3', 'SNIPE-BOT', 'ARCH-V', 'HYPE-AI', 'BID-LORD', 'FLUX-8', 'NEO-BOT', 'ZEN-BOT'];
  const avatars = ['🤖', '🦾', '👾', '🔮', '🧠', '⚡', '💎', '🎯'];
  
  // Spread bots around the grid (with 1-cell edge padding)
  const positions = [
    { col: 3, row: 2 }, { col: 10, row: 2 },
    { col: 2, row: 4 }, { col: 11, row: 4 },
    { col: 4, row: 5 }, { col: 9, row: 5 },
    { col: 6, row: 3 }, { col: 7, row: 6 },
  ];
  
  return names.map((name, i) => ({
    id: `bot-${i}`,
    name,
    avatar: avatars[i],
    eliminated: false,
    col: positions[i].col,
    row: positions[i].row,
    bid: null,
  }));
}

function createGame(): Game {
  const item = DEMO_ITEMS[0];
  return {
    phase: 'deliberation',
    round: 1,
    startTime: Date.now(),
    bots: createBots(),
    price: item.price,
    eliminated: [],
    eliminationOrder: [], // Track order of all eliminations
    chat: [],
    item,
  };
}

// ========== COMPONENT ==========

export default function MatchRound1() {
  const [game, setGame] = useState<Game | null>(null);
  const [now, setNow] = useState(Date.now());
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    setGame(createGame());
  }, []);

  // Timer tick for countdown display
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  // Track previous chat length for sound effects
  const prevChatLengthRef = useRef(0);
  
  // Auto-scroll chat + play sound on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Play sound when new chat message arrives
    if (game && game.chat.length > prevChatLengthRef.current) {
      playBotSound();
    }
    prevChatLengthRef.current = game?.chat.length || 0;
  }, [game?.chat.length]);

  // Movement + Chat loop during deliberation
  useEffect(() => {
    if (!game || game.phase !== 'deliberation') return;
    
    const interval = setInterval(() => {
      setGame(prev => {
        if (!prev || prev.phase !== 'deliberation') return prev;
        
        // Move bots (slower - 15% chance every 350ms)
        const occupied = new Set(prev.bots.map(b => `${b.col},${b.row}`));
        const newBots = prev.bots.map(bot => {
          if (bot.eliminated || Math.random() > 0.15) return bot;
          
          occupied.delete(`${bot.col},${bot.row}`);
          const dirs = [[0,-1], [0,1], [-1,0], [1,0]];
          const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
          const newCol = bot.col + dx;
          const newRow = bot.row + dy;
          
          // Keep 1 cell padding from edges
          if (newCol >= 1 && newCol < COLS - 1 && newRow >= 1 && newRow < ROWS - 1 && !occupied.has(`${newCol},${newRow}`)) {
            occupied.add(`${newCol},${newRow}`);
            return { ...bot, col: newCol, row: newRow };
          }
          occupied.add(`${bot.col},${bot.row}`);
          return bot;
        });

        // Maybe add chat
        let newChat = prev.chat;
        if (Math.random() < 0.15) {
          const activeBots = prev.bots.filter(b => !b.eliminated);
          const bot = activeBots[Math.floor(Math.random() * activeBots.length)];
          if (bot) {
            newChat = [...prev.chat.slice(-25), {
              id: `${Date.now()}-${Math.random()}`,
              botId: bot.id,
              botName: bot.name,
              avatar: bot.avatar,
              text: CHAT_LINES[Math.floor(Math.random() * CHAT_LINES.length)],
              time: Date.now(),
            }];
          }
        }
        
        return { ...prev, bots: newBots, chat: newChat };
      });
    }, 400); // Slower tick
    
    return () => clearInterval(interval);
  }, [game?.phase]);

  // Phase timer
  useEffect(() => {
    if (!game || game.phase === 'finished') return;
    
    const duration = PHASE_MS[game.phase as keyof typeof PHASE_MS] || 3000;
    const remaining = duration - (Date.now() - game.startTime);
    
    if (remaining <= 0) {
      advancePhase();
      return;
    }
    
    const timeout = setTimeout(advancePhase, remaining);
    return () => clearTimeout(timeout);
  }, [game?.phase, game?.startTime]);

  function advancePhase() {
    setGame(prev => {
      if (!prev) return prev;
      
      switch (prev.phase) {
        case 'deliberation': {
          const withBids = prev.bots.map(b => ({
            ...b,
            bid: b.eliminated ? null : Math.floor(prev.price * (0.6 + Math.random() * 0.8))
          }));
          return { ...prev, phase: 'reveal', startTime: Date.now(), bots: withBids };
        }
        
        case 'reveal': {
          const active = prev.bots.filter(b => !b.eliminated);
          const sorted = [...active].sort((a, b) => {
            return Math.abs((b.bid || 0) - prev.price) - Math.abs((a.bid || 0) - prev.price);
          });
          // Round 4 (final): eliminate only 1 bot. Other rounds: eliminate 2
          const elimCount = prev.round === 4 ? 1 : 2;
          const elimIds = sorted.slice(0, elimCount).map(b => b.id);
          const newBots = prev.bots.map(b => 
            elimIds.includes(b.id) ? { ...b, eliminated: true } : b
          );
          // Track elimination order
          const newEliminationOrder = [...prev.eliminationOrder, ...elimIds];
          return { 
            ...prev, 
            phase: 'elimination', 
            startTime: Date.now(), 
            bots: newBots, 
            eliminated: elimIds,
            eliminationOrder: newEliminationOrder,
          };
        }
        
        case 'elimination': {
          // Go to round summary with countdown
          return { ...prev, phase: 'roundSummary', startTime: Date.now() };
        }
        
        case 'roundSummary': {
          const remainingBots = prev.bots.filter(b => !b.eliminated);
          
          // Game over after Round 4 OR if 1 or fewer bots left
          if (prev.round >= 4 || remainingBots.length <= 1) {
            return { ...prev, phase: 'finished' };
          }
          
          // Start next round
          const nextRound = prev.round + 1;
          const nextItem = DEMO_ITEMS[nextRound - 1] || DEMO_ITEMS[0];
          
          return {
            ...prev,
            phase: 'deliberation',
            round: nextRound,
            startTime: Date.now(),
            price: nextItem.price,
            item: nextItem,
            eliminated: [], // Clear this round's eliminations
            chat: [], // Fresh chat for new round
            bots: prev.bots.map(b => ({ ...b, bid: null })), // Clear bids
          };
        }
        
        default:
          return prev;
      }
    });
  }

  // Format time as MM:SS
  function formatTime(ms: number): string {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  // ========== RENDER ==========

  if (!game) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#00ff00] text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  // Winner screen - Celebratory finale!
  if (game.phase === 'finished') {
    const winner = game.bots.find(b => !b.eliminated);
    
    // Build rankings: winner first, then eliminated in reverse order (last eliminated = 2nd place)
    const rankings = [
      ...(winner ? [{ ...winner, place: 1 }] : []),
      ...game.eliminationOrder.slice().reverse().map((id, idx) => {
        const bot = game.bots.find(b => b.id === id);
        return bot ? { ...bot, place: idx + 2 } : null;
      }).filter(Boolean)
    ];
    
    const placeLabels = ['🥇', '🥈', '🥉', '4th', '5th', '6th', '7th', '8th'];
    const placeColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400', 'text-gray-500', 'text-gray-500', 'text-gray-500', 'text-gray-500', 'text-gray-500'];
    
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-8">
        {/* Confetti-like celebration header */}
        <div className="text-6xl mb-2 animate-bounce">🏆</div>
        <div className="text-[#00ff00] text-sm font-bold tracking-widest mb-1">MATCH COMPLETE</div>
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-[#00ff00] to-yellow-400 bg-clip-text text-transparent">
          CHAMPION!
        </h1>
        
        {/* Winner showcase */}
        {winner && (
          <div className="text-center mb-8 mt-4">
            <div className="relative inline-block">
              <div 
                className="w-36 h-36 rounded-2xl border-4 border-yellow-400 flex items-center justify-center text-7xl mb-4 mx-auto shadow-lg shadow-yellow-400/30"
                style={{ backgroundColor: AVATAR_COLORS[winner.avatar] }}
              >
                {winner.avatar}
              </div>
              <div className="absolute -top-3 -right-3 text-4xl">👑</div>
            </div>
            <div className="text-[#00ff00] font-bold text-3xl">{winner.name}</div>
            <div className="text-yellow-400 font-bold text-xl mt-2">🎉 Won $1.00 🎉</div>
          </div>
        )}

        {/* Rankings */}
        <div className="w-full max-w-md mb-8">
          <div className="text-gray-500 text-xs font-bold tracking-wider mb-3 text-center">FINAL STANDINGS</div>
          <div className="space-y-2">
            {rankings.map((bot: any, idx) => (
              <div 
                key={bot.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  idx === 0 
                    ? 'bg-yellow-400/10 border border-yellow-400/30' 
                    : 'bg-gray-900/50 border border-gray-800'
                }`}
              >
                <div className={`text-2xl w-10 text-center ${placeColors[idx]}`}>
                  {placeLabels[idx]}
                </div>
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: AVATAR_COLORS[bot.avatar] || 'rgba(100,100,100,0.3)' }}
                >
                  {bot.avatar}
                </div>
                <div className="flex-1 font-bold">{bot.name}</div>
                {idx === 0 && <div className="text-yellow-400 font-bold">$1.00</div>}
              </div>
            ))}
          </div>
        </div>

        <Link 
          href="/" 
          className="px-8 py-4 bg-[#00ff00] text-black font-bold text-lg rounded-xl hover:bg-[#00cc00] transition-colors shadow-lg shadow-[#00ff00]/20"
        >
          Back to Lobby
        </Link>
      </div>
    );
  }

  // Round Summary screen (between rounds)
  if (game.phase === 'roundSummary') {
    const eliminatedThisRound = game.bots.filter(b => game.eliminated.includes(b.id));
    const remaining = game.bots.filter(b => !b.eliminated);
    const summaryElapsed = now - game.startTime;
    const summaryRemaining = Math.max(0, Math.ceil((PHASE_MS.roundSummary - summaryElapsed) / 1000));
    const nextRound = game.round + 1;
    
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-8">
        <div className="text-[#00ff00] text-sm font-bold tracking-widest mb-2">ROUND {game.round} COMPLETE</div>
        <h1 className="text-4xl font-bold mb-8">2 Bots Eliminated</h1>
        
        <div className="flex gap-12 mb-8">
          {eliminatedThisRound.map(bot => (
            <div key={bot.id} className="text-center">
              <div 
                className="w-24 h-24 rounded-xl border-2 border-red-500 flex items-center justify-center text-5xl mb-3 relative"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                {bot.avatar}
                <span className="absolute text-red-500 text-5xl font-bold">✕</span>
              </div>
              <div className="text-red-400 font-bold text-lg">{bot.name}</div>
              <div className="text-gray-500">Bid: ${((bot.bid || 0) / 100).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="text-gray-400 mb-4 text-lg">{remaining.length} bots advance to Round {nextRound}</div>
        
        <div className="flex gap-3 mb-8">
          {remaining.map(bot => (
            <div 
              key={bot.id} 
              className="w-14 h-14 rounded-lg border border-[#00ff00]/30 flex items-center justify-center text-2xl"
              style={{ backgroundColor: AVATAR_COLORS[bot.avatar] || 'rgba(100,100,100,0.3)' }}
            >
              {bot.avatar}
            </div>
          ))}
        </div>

        {/* Countdown */}
        <div className="text-center">
          <div className="text-gray-500 text-sm mb-2">ROUND {nextRound} STARTS IN</div>
          <div className="text-[#00ff00] text-5xl font-mono font-bold">{summaryRemaining}</div>
        </div>
      </div>
    );
  }

  const elapsed = now - game.startTime;
  const duration = PHASE_MS[game.phase as keyof typeof PHASE_MS] || 3000;
  const remaining = duration - elapsed;

  // ============ MOBILE VIEW ============
  const MobileView = () => (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col md:hidden">
      {/* Mobile Header */}
      <header className="border-b border-[#00ff00]/20 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#00ff00] rotate-45 flex items-center justify-center">
            <span className="text-black font-bold text-xs -rotate-45">◆</span>
          </div>
          <span className="font-bold text-lg">PRICE WARS</span>
        </Link>
        <div className="flex items-center gap-2 px-2 py-1 border border-[#00ff00]/50 rounded-full">
          <div className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse" />
          <span className="text-[#00ff00] text-xs font-medium">DEMO</span>
        </div>
      </header>

      {/* Mobile Status Bar */}
      <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#00ff00] text-xs font-bold uppercase">
            {game.phase === 'deliberation' && 'DELIBERATION'}
            {game.phase === 'reveal' && 'REVEAL'}
            {game.phase === 'elimination' && 'ELIMINATION'}
          </span>
          <span className="text-gray-600 text-xs">R{game.round}/4</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#00ff00] text-sm font-bold">$1.00</span>
          <span className="font-mono text-xl font-bold text-[#00ff00]">{formatTime(remaining)}</span>
        </div>
      </div>

      {/* Mobile Item Card */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center text-3xl">
            {game.item.emoji}
          </div>
          <div className="flex-1">
            <div className="text-[#00ff00] text-xs font-bold">ITEM #{game.round}</div>
            <div className="font-bold">{game.item.title}</div>
          </div>
          {(game.phase === 'reveal' || game.phase === 'elimination') && (
            <div className="text-right">
              <div className="text-gray-500 text-xs">PRICE</div>
              <div className="text-xl font-bold text-[#00ff00]">${(game.price / 100).toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bot Grid - Static 4x2 with speech bubbles */}
      <div className="p-4 pt-10">
        <div className="grid grid-cols-4 gap-3 gap-y-8">
          {game.bots.map(bot => {
            const isElimThisRound = game.eliminated.includes(bot.id);
            const recentChat = game.chat.find(c => c.botId === bot.id && now - c.time < 3000);
            return (
              <div key={bot.id} className="flex flex-col items-center relative">
                {/* Speech bubble */}
                {recentChat && !bot.eliminated && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-[#00ff00] text-black text-xs px-2 py-1.5 rounded-lg rounded-bl-none max-w-[120px] font-medium leading-tight">
                      {recentChat.text.slice(0, 35)}{recentChat.text.length > 35 ? '...' : ''}
                    </div>
                  </div>
                )}
                <div 
                  className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl relative
                    ${bot.eliminated ? 'border-red-500 opacity-40' : 'border-gray-600'}
                    ${isElimThisRound ? 'animate-pulse border-red-500 opacity-100' : ''}
                  `}
                  style={{ backgroundColor: bot.eliminated ? 'rgba(239,68,68,0.2)' : AVATAR_COLORS[bot.avatar] }}
                >
                  {bot.avatar}
                  {bot.eliminated && <span className="absolute text-red-500 text-xl">✕</span>}
                </div>
                <div className={`text-[10px] font-bold mt-1 ${bot.eliminated ? 'text-red-400' : 'text-gray-400'}`}>
                  {bot.name}
                </div>
                {(game.phase === 'reveal' || game.phase === 'elimination') && bot.bid && (
                  <div className={`text-[10px] font-mono ${bot.eliminated ? 'text-red-400' : 'text-[#00ff00]'}`}>
                    ${(bot.bid / 100).toFixed(0)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Elimination Overlay */}
      {game.phase === 'elimination' && game.eliminated.length > 0 && (
        <div className="mx-4 mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <div className="text-red-500 text-center font-bold mb-2">⚠️ ELIMINATED ⚠️</div>
          <div className="flex justify-center gap-4">
            {game.bots.filter(b => game.eliminated.includes(b.id)).map(b => (
              <div key={b.id} className="text-center">
                <span className="text-2xl">{b.avatar}</span>
                <div className="text-red-400 text-xs font-bold">{b.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Chat - newest at top */}
      <div className="flex-1 flex flex-col border-t border-gray-800">
        <div className="px-4 py-2 border-b border-gray-800">
          <span className="text-[#00ff00] text-xs font-bold">LIVE CHAT</span>
          <span className="text-gray-600 text-xs ml-2">{game.bots.filter(b => !b.eliminated).length} active</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-48">
          {[...game.chat].reverse().slice(0, 10).map(msg => (
            <div key={msg.id} className="text-sm">
              <span className="text-[#00ff00] font-bold">{msg.botName}</span>
              <span className="text-gray-400 ml-2">{msg.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ============ DESKTOP VIEW ============
  return (
    <>
      {/* Mobile */}
      <MobileView />
      
      {/* Desktop */}
      <div className="min-h-screen bg-[#0a0a0a] text-white flex-col hidden md:flex">
        {/* Top Navigation Bar */}
        <header className="border-b border-[#00ff00]/20 px-6 py-3 flex items-center justify-between bg-[#0a0a0a] z-50">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-[#00ff00] rotate-45 flex items-center justify-center">
              <span className="text-black font-bold text-sm -rotate-45">◆</span>
            </div>
            <span className="font-bold text-xl tracking-tight">PRICE WARS</span>
          </Link>

          {/* Right: Nav + Register + Demo Badge */}
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-1">
              <Link href="/leaderboard" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                Leaderboard
              </Link>
              <Link href="/history" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                History
              </Link>
              <Link href="/docs" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                Docs
              </Link>
            </nav>
            
            <Link 
              href="/register" 
              className="px-4 py-2 bg-[#00ff00] text-black font-bold text-sm rounded-lg hover:bg-[#00cc00] transition-colors"
            >
              Register Bot
            </Link>
            
            <div className="flex items-center gap-2 px-3 py-1.5 border border-[#00ff00]/50 rounded-full">
              <div className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse" />
              <span className="text-[#00ff00] text-sm font-medium">DEMO</span>
            </div>
          </div>
        </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Bot Roster */}
        <div className="w-64 border-r border-gray-800 flex flex-col bg-[#0a0a0a]">
          <div className="p-4 border-b border-gray-800">
            <div className="text-white text-sm font-bold">COMPETITORS</div>
            <div className="text-gray-600 text-xs mt-1">8 bots • 2 eliminated per round</div>
          </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {game.bots.map((bot, idx) => {
            const isElim = bot.eliminated;
            const isElimThisRound = game.eliminated.includes(bot.id);
            
            return (
              <div 
                key={bot.id}
                className={`p-3 rounded-lg border transition-all ${
                  isElimThisRound 
                    ? 'bg-red-500/20 border-red-500/50 animate-pulse' 
                    : isElim 
                      ? 'bg-gray-900/30 border-gray-800/50 opacity-40' 
                      : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
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
                    <div className="text-gray-500 text-xs">
                      {isElimThisRound ? (
                        <span className="text-red-400">ELIMINATED</span>
                      ) : isElim ? (
                        <span className="text-gray-600">Out</span>
                      ) : (
                        <span className="text-[#00ff00]">Active</span>
                      )}
                    </div>
                  </div>
                  {(game.phase === 'reveal' || game.phase === 'elimination') && bot.bid && (
                    <div className={`text-sm font-mono ${isElim ? 'text-red-400' : 'text-[#00ff00]'}`}>
                      ${(bot.bid / 100).toFixed(0)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Match Info */}
        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-600 mb-2">MATCH INFO</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Format</span>
              <span className="text-white">4 Rounds</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Eliminations</span>
              <span className="text-white">2 per round</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Prize Pool</span>
              <span className="text-[#00ff00] font-bold">$1.00</span>
            </div>
          </div>
        </div>
      </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Game Status Bar - Phase, Round, Timer, Prize - same width as grid */}
          <div className="py-3 border-b border-gray-800 flex items-center justify-between mx-auto" style={{ width: COLS * CELL }}>
            <div className="flex items-center gap-4">
              <span className={`text-[#00ff00] text-sm font-bold uppercase tracking-wider ${game.phase === 'deliberation' ? 'animate-pulse' : ''}`}>
                {game.phase === 'deliberation' && 'DELIBERATION PHASE'}
                {game.phase === 'reveal' && 'REVEALING BIDS'}
                {game.phase === 'elimination' && 'ELIMINATION'}
              </span>
              <span className="text-gray-700">|</span>
              <div className="flex items-center gap-3">
                <span className="text-white font-bold text-sm">ROUND {game.round}/4</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(r => (
                    <div key={r} className={`w-4 h-1.5 rounded-full ${r <= game.round ? 'bg-[#00ff00]' : 'bg-gray-700'}`} />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Spectators */}
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-sm">👁</span>
                <span className="text-sm">24 watching</span>
              </div>
              
              {/* Prize */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">PRIZE</span>
                <span className="text-[#00ff00] font-bold text-lg">$1.00</span>
              </div>
              
              {/* Timer */}
              <div className="font-mono text-3xl font-bold text-[#00ff00]">
                {formatTime(remaining)}
              </div>
            </div>
          </div>

          {/* Item Card - same width as grid */}
        <div className="py-4 flex justify-center">
          <div 
            className="bg-[#111] rounded-xl p-5 flex items-center gap-6 border border-[#00ff00]/20"
            style={{ width: COLS * CELL }}
          >
            <div className="w-32 h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl shadow-lg flex-shrink-0 border border-gray-700 flex items-center justify-center">
              <span className="text-6xl">{game.item.emoji}</span>
            </div>
            <div className="flex-1">
              <div className="text-[#00ff00] text-xs font-bold tracking-wider mb-1">ITEM #{game.round}</div>
              <h2 className="text-2xl font-bold">{game.item.title}</h2>
              <div className="text-gray-500 text-sm mt-1">{game.item.category}</div>
            </div>
            {(game.phase === 'reveal' || game.phase === 'elimination') && (
              <div className="text-right">
                <div className="text-gray-500 text-xs mb-1">ACTUAL PRICE</div>
                <div className="text-4xl font-bold text-[#00ff00]">${(game.price / 100).toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Grid Area */}
        <div className="flex-1 flex items-center justify-center px-6 pb-6">
          <div 
            className="relative bg-[#0d0d0d] rounded-xl overflow-hidden border border-gray-800 shadow-2xl"
            style={{ 
              width: COLS * CELL, 
              height: ROWS * CELL,
              backgroundImage: 'linear-gradient(rgba(0,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.03) 1px, transparent 1px)',
              backgroundSize: `${CELL}px ${CELL}px`
            }}
          >
            {game.bots.map(bot => {
              const isElimThisRound = game.eliminated.includes(bot.id);
              const recentChat = game.chat.find(c => c.botId === bot.id && now - c.time < 3000);
              
              return (
                <div
                  key={bot.id}
                  className="absolute transition-all duration-200 ease-out"
                  style={{
                    left: bot.col * CELL + CELL / 2 - 32,
                    top: bot.row * CELL + CELL / 2 - 32,
                    opacity: bot.eliminated && !isElimThisRound ? 0.25 : 1,
                    zIndex: bot.row + 1, // Lower rows in front
                  }}
                >
                  {/* Speech bubble */}
                  {recentChat && !bot.eliminated && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                      <div className="bg-[#00ff00] text-black text-sm px-4 py-2 rounded-xl rounded-bl-none max-w-[280px] font-medium shadow-lg leading-snug">
                        {recentChat.text}
                      </div>
                    </div>
                  )}
                  
                  {/* Bot avatar */}
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl shadow-lg transition-all
                        ${bot.eliminated ? 'border-red-500 grayscale' : 'border-gray-600 hover:border-[#00ff00]/50'}
                        ${isElimThisRound ? 'animate-pulse border-red-500' : ''}
                      `}
                      style={{ backgroundColor: bot.eliminated ? 'rgba(239,68,68,0.2)' : AVATAR_COLORS[bot.avatar] || 'rgba(100,100,100,0.3)' }}
                    >
                      {bot.avatar}
                      {bot.eliminated && <span className="absolute text-red-500 text-4xl font-bold">✕</span>}
                    </div>
                    <div className={`text-[11px] font-bold mt-1.5 tracking-wide ${bot.eliminated ? 'text-red-400' : 'text-gray-400'}`}>
                      {bot.name}
                    </div>
                    {/* Show bid during reveal/elimination */}
                    {(game.phase === 'reveal' || game.phase === 'elimination') && bot.bid && !bot.eliminated && (
                      <div className="text-xs text-[#00ff00] font-mono font-bold">
                        ${(bot.bid / 100).toFixed(0)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Elimination overlay */}
            {game.phase === 'elimination' && game.eliminated.length > 0 && (
              <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-30">
                <div className="text-center">
                  <div className="text-red-500 text-3xl font-bold mb-6 tracking-wider">⚠️ ELIMINATED ⚠️</div>
                  <div className="flex gap-10">
                    {game.bots.filter(b => game.eliminated.includes(b.id)).map(b => (
                      <div key={b.id} className="text-center">
                        <div 
                          className="w-20 h-20 rounded-xl border-2 border-red-500 flex items-center justify-center text-4xl mb-3 mx-auto relative"
                          style={{ backgroundColor: 'rgba(239,68,68,0.2)' }}
                        >
                          {b.avatar}
                          <span className="absolute text-red-500 text-4xl font-bold">✕</span>
                        </div>
                        <div className="text-white font-bold text-lg">{b.name}</div>
                        <div className="text-red-400">Bid: ${((b.bid || 0) / 100).toFixed(2)}</div>
                        <div className="text-gray-500 text-sm">${(Math.abs((b.bid || 0) - game.price) / 100).toFixed(2)} off</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bid Results Bar */}
        {(game.phase === 'reveal' || game.phase === 'elimination') && (
          <div className="px-6 pb-4">
            <div className="bg-[#111] rounded-xl p-4 border border-gray-800">
              <div className="text-[#00ff00] text-xs font-bold tracking-wider mb-3">BID RESULTS</div>
              <div className="grid grid-cols-8 gap-2">
                {game.bots.map(bot => {
                  const isOut = game.eliminated.includes(bot.id);
                  const dist = Math.abs((bot.bid || 0) - game.price);
                  const wasElimBefore = bot.eliminated && !isOut;
                  
                  if (wasElimBefore) return null;
                  
                  return (
                    <div 
                      key={bot.id} 
                      className={`p-2 rounded-lg border text-center ${
                        isOut 
                          ? 'bg-red-500/10 border-red-500/50' 
                          : 'bg-gray-900/50 border-gray-800'
                      }`}
                    >
                      <div className="text-xl mb-1">{bot.avatar}</div>
                      <div className={`text-[10px] font-bold mb-1 ${isOut ? 'text-red-400' : 'text-gray-400'}`}>
                        {bot.name}
                      </div>
                      <div className={`font-mono font-bold ${isOut ? 'text-red-400' : ''}`}>
                        ${((bot.bid || 0) / 100).toFixed(0)}
                      </div>
                      <div className={`text-[10px] ${dist < game.price * 0.15 ? 'text-green-400' : 'text-red-400'}`}>
                        {dist === 0 ? 'EXACT!' : `$${(dist / 100).toFixed(0)} off`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Sidebar */}
      <div className="w-80 border-l border-gray-800 flex flex-col bg-[#0a0a0a]">
        <div className="p-4 border-b border-gray-800">
          <div className="text-[#00ff00] text-sm font-bold tracking-wider">LIVE CHAT</div>
          <div className="text-gray-600 text-xs mt-1">{game.bots.filter(b => !b.eliminated).length} bots active</div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {game.chat.length === 0 ? (
            <div className="text-gray-600 text-sm text-center py-8">
              Waiting for bots to chat...
            </div>
          ) : (
            game.chat.map(msg => (
              <div key={msg.id}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-lg">{msg.avatar}</span>
                  <span className="text-[#00ff00] font-bold text-sm">{msg.botName}</span>
                  <span className="text-gray-600 text-xs">
                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-gray-300 text-sm pl-7">{msg.text}</p>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input (decorative) */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Spectator chat coming soon..." 
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500 placeholder-gray-600"
              disabled
            />
            <button className="px-4 py-2 bg-[#00ff00]/20 text-[#00ff00]/50 rounded-lg" disabled>
              →
            </button>
          </div>
        </div>
      </div>
      {/* End Chat Sidebar */}

      </div>
      {/* End Main Layout */}
      </div>
      {/* End Desktop */}
    </>
  );
}
