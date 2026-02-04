'use client';

import { useState, useEffect } from 'react';
import { Home, BarChart3, Bot, Radio, Wifi, Grid3X3, Settings, Trophy } from 'lucide-react';

// Types
type MatchPhase = 'matchmaking' | 'deliberation' | 'price-reveal';

interface BotData {
  id: string;
  name: string;
  avatar: string;
  eliminated: boolean;
  bid?: number;
  speaking?: boolean;
  speech?: string;
}

// Demo bot avatars (pixel art robot style)
const DEMO_BOTS: BotData[] = [
  { id: '1', name: 'SNIPE-BOT', avatar: '🤖', eliminated: false, bid: 4800 },
  { id: '2', name: 'GROK-V3', avatar: '🦾', eliminated: false, bid: 5100 },
  { id: '3', name: 'ARCH-V', avatar: '👾', eliminated: false, bid: 5400 },
  { id: '4', name: 'HYPE-AI', avatar: '🔮', eliminated: true, bid: 7200 },
  { id: '5', name: 'BID-LORD', avatar: '🧠', eliminated: false, bid: 5000 },
  { id: '6', name: 'FLUX-8', avatar: '⚡', eliminated: false, bid: 4900 },
  { id: '7', name: 'NEO-BOT', avatar: '💎', eliminated: false, bid: 5300 },
  { id: '8', name: 'ZEN-BOT', avatar: '🎯', eliminated: true, bid: 2100 },
];

const DEMO_ITEM = {
  title: 'Air Jordan 1 Chicago (1985)',
  category: 'SNEAKERS • VINTAGE',
  refId: 'AJ1-85-CHI',
  grade: '9.5',
  actualPrice: 5200,
  imageUrl: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&h=600&fit=crop',
};

interface MatchViewProps {
  initialPhase?: MatchPhase;
}

export default function MatchView({ initialPhase = 'deliberation' }: MatchViewProps) {
  const [phase, setPhase] = useState<MatchPhase>(initialPhase);
  const [timer, setTimer] = useState(14.82);
  const [round, setRound] = useState(1);
  const [liveCount] = useState(1247);
  const [botsRegistered, setBotsRegistered] = useState(5);
  const [matchId] = useState('#4829');
  const [nextRoundIn, setNextRoundIn] = useState(8);
  
  // Speech bubbles state
  const [activeSpeakers, setActiveSpeakers] = useState<{[key: string]: string}>({
    '1': "Classic Chicago 1s, thinking $4,500-5,500 range...",
    '3': "Condition is pristine. Secondary market indicates +12% premium.",
  });

  // Timer countdown
  useEffect(() => {
    if (phase !== 'deliberation') return;
    const interval = setInterval(() => {
      setTimer(t => Math.max(0, t - 0.01));
    }, 10);
    return () => clearInterval(interval);
  }, [phase]);

  // Matchmaking bot registration animation
  useEffect(() => {
    if (phase !== 'matchmaking') return;
    if (botsRegistered >= 8) return;
    const interval = setInterval(() => {
      setBotsRegistered(b => Math.min(8, b + 1));
    }, 2000);
    return () => clearInterval(interval);
  }, [phase, botsRegistered]);

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const progressPercent = (timer / 45) * 100;
  const survivingBots = DEMO_BOTS.filter(b => !b.eliminated).length;

  // Render based on phase
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#00ff00]/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#00ff00] rotate-45 flex items-center justify-center">
              <span className="text-black font-bold text-xs -rotate-45">◆</span>
            </div>
            <span className="font-bold text-lg tracking-tight">PRICE WARS</span>
          </div>
          {phase === 'matchmaking' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 border border-[#00ff00]/50 rounded-full">
              <span className="text-[#00ff00] text-sm font-mono">👁 {843}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 border border-[#00ff00]/50 rounded-full">
              <span className="w-2 h-2 bg-[#00ff00] rounded-full animate-pulse" />
              <span className="text-[#00ff00] text-sm font-medium">{liveCount.toLocaleString()} LIVE</span>
            </div>
          )}
        </div>
        
        {/* Round indicator - only show during game */}
        {phase !== 'matchmaking' && (
          <div className="flex items-center justify-between px-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">ROUND {round}/4</span>
              <div className="flex gap-1">
                {[1,2,3,4].map(r => (
                  <div 
                    key={r} 
                    className={`w-4 h-1.5 rounded-full ${r <= round ? 'bg-[#00ff00]' : 'bg-gray-700'}`}
                  />
                ))}
              </div>
            </div>
            <span className="text-gray-500 text-sm uppercase tracking-wider">
              {phase === 'deliberation' ? 'DELIBERATION' : 'REVEAL'}
            </span>
          </div>
        )}
      </header>

      <main className="px-4 py-4">
        {/* ==================== MATCHMAKING PHASE ==================== */}
        {phase === 'matchmaking' && (
          <div className="space-y-6 animate-fade-in">
            {/* Matchmaking Icon */}
            <div className="text-center py-8">
              <div className="inline-block mb-4">
                <Wifi className="w-16 h-16 text-[#00ff00] animate-pulse" />
              </div>
              <h1 className="text-3xl font-bold tracking-wider text-[#00ff00] mb-2" style={{ fontFamily: 'monospace' }}>
                MATCHMAKING...
              </h1>
              <p className="text-gray-500 font-mono text-sm">
                SYSTEM.INITIALIZE(MATCH_ID: {matchId})
              </p>
            </div>

            {/* Bots Registered Progress */}
            <div className="card p-4 border border-[#00ff00]/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#00ff00] font-bold text-sm tracking-wider">BOTS REGISTERED</span>
                <span className="font-mono text-lg">
                  <span className="text-white">{botsRegistered}</span>
                  <span className="text-gray-500">/8</span>
                </span>
              </div>
              <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00cc00] to-[#00ff00] rounded-full transition-all duration-500"
                  style={{ width: `${(botsRegistered / 8) * 100}%` }}
                />
              </div>
            </div>

            {/* Roster Status */}
            <div>
              <h3 className="text-[#00ff00] text-xs font-bold tracking-widest mb-3">ROSTER STATUS</h3>
              <div className="grid grid-cols-2 gap-3">
                {DEMO_BOTS.slice(0, botsRegistered).map((bot) => (
                  <div 
                    key={bot.id}
                    className="card p-3 border border-[#00ff00]/30 animate-slide-up"
                  >
                    <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-2 flex items-center justify-center text-4xl">
                      {bot.avatar}
                    </div>
                    <div className="font-bold text-sm">{bot.name.toLowerCase()}</div>
                    <div className="flex items-center gap-1 text-xs text-[#00ff00]">
                      <span className="w-1.5 h-1.5 bg-[#00ff00] rounded-full" />
                      READY
                    </div>
                  </div>
                ))}
                {/* Empty slots */}
                {Array.from({ length: 8 - botsRegistered }).map((_, i) => (
                  <div 
                    key={`empty-${i}`}
                    className="card p-3 border border-gray-800 opacity-30"
                  >
                    <div className="aspect-square bg-gray-900 rounded-lg mb-2 flex items-center justify-center">
                      <span className="text-gray-700 text-2xl">?</span>
                    </div>
                    <div className="font-bold text-sm text-gray-700">WAITING...</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== DELIBERATION PHASE ==================== */}
        {phase === 'deliberation' && (
          <div className="space-y-4 animate-fade-in">
            {/* Item Card */}
            <div className="card overflow-hidden border border-[#00ff00]/30">
              {/* Category Badge */}
              <div className="relative">
                <span className="absolute top-3 left-3 z-10 bg-[#00ff00] text-black text-xs font-bold px-2 py-1 rounded">
                  {DEMO_ITEM.category}
                </span>
                <img 
                  src={DEMO_ITEM.imageUrl}
                  alt={DEMO_ITEM.title}
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-bold mb-1">{DEMO_ITEM.title}</h2>
                <p className="text-gray-500 font-mono text-xs">
                  REF_ID: {DEMO_ITEM.refId} GRADE: {DEMO_ITEM.grade}
                </p>
              </div>
            </div>

            {/* Bot Grid with Speech Bubbles */}
            <div className="grid grid-cols-4 gap-2 relative">
              {DEMO_BOTS.map((bot, idx) => (
                <div key={bot.id} className="relative">
                  {/* Speech Bubble */}
                  {activeSpeakers[bot.id] && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 z-20 animate-fade-in">
                      <div className="bg-[#00ff00] text-black text-xs p-2 rounded-lg rounded-bl-none">
                        <div className="font-bold text-[10px] mb-0.5">{bot.name}</div>
                        {activeSpeakers[bot.id]}
                      </div>
                    </div>
                  )}
                  
                  {/* Bot Avatar */}
                  <div className={`
                    aspect-square rounded-lg border-2 overflow-hidden relative
                    ${activeSpeakers[bot.id] ? 'border-[#00ff00] shadow-[0_0_15px_rgba(0,255,0,0.3)]' : 'border-gray-700'}
                    ${bot.eliminated ? 'opacity-30 grayscale' : ''}
                  `}>
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-2xl">
                      {bot.avatar}
                    </div>
                  </div>
                  <div className="text-[10px] text-center mt-1 text-gray-400 truncate">
                    {bot.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Phase Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[#00ff00] text-xs font-bold tracking-wider">PHASE: DELIBERATION</span>
                  <p className="text-gray-500 text-xs font-mono">BOTS ARE COMPUTING FINAL BIDS...</p>
                </div>
                <span className="font-mono text-xl font-bold">{formatTime(timer)}</span>
              </div>
              <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00cc00] to-[#00ff00] rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* System Feed */}
            <div className="card p-3 border border-gray-800">
              <div className="flex items-center gap-2 text-[#00ff00] text-xs font-bold tracking-wider mb-2">
                <Radio className="w-3 h-3" />
                INCOMING DATA
              </div>
            </div>
          </div>
        )}

        {/* ==================== PRICE REVEAL PHASE ==================== */}
        {phase === 'price-reveal' && (
          <div className="space-y-6 animate-fade-in">
            {/* Price Reveal */}
            <div className="text-center py-6">
              <p className="text-[#00ff00] text-xs font-bold tracking-widest mb-2">ACTUAL MARKET PRICE</p>
              <div className="text-6xl font-bold text-[#00ff00] animate-price-slam" style={{ textShadow: '0 0 30px rgba(0,255,0,0.5)' }}>
                ${DEMO_ITEM.actualPrice.toLocaleString()}
              </div>
            </div>

            {/* Number Line */}
            <div className="px-2">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>$0</span>
                <span>$5k</span>
                <span>$10k</span>
              </div>
              <div className="relative h-8">
                {/* Line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-700 -translate-y-1/2" />
                
                {/* Actual price marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-[#00ff00]"
                  style={{ left: `${(DEMO_ITEM.actualPrice / 10000) * 100}%` }}
                />
                
                {/* Bid markers */}
                {DEMO_BOTS.map((bot) => {
                  const position = ((bot.bid || 0) / 10000) * 100;
                  const distance = Math.abs((bot.bid || 0) - DEMO_ITEM.actualPrice);
                  const isClose = distance < 1000;
                  return (
                    <div
                      key={bot.id}
                      className={`absolute top-1/2 w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                        isClose ? 'bg-[#00ff00]' : 'bg-red-500'
                      }`}
                      style={{ left: `${position}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Elimination Banner */}
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3 flex items-center gap-2">
              <span className="text-yellow-500">⚠</span>
              <span className="text-yellow-500 font-bold text-sm">
                ELIMINATED: GROK-V3 • BARGAIN-9K
              </span>
            </div>

            {/* Bot Grid with Elimination States */}
            <div className="grid grid-cols-4 gap-2">
              {DEMO_BOTS.map((bot) => (
                <div key={bot.id} className="relative">
                  <div className={`
                    aspect-square rounded-lg border-2 overflow-hidden relative
                    ${bot.eliminated 
                      ? 'border-red-500/50 bg-red-500/10' 
                      : 'border-[#00ff00]/30'
                    }
                  `}>
                    <div className={`
                      w-full h-full flex items-center justify-center text-2xl
                      ${bot.eliminated ? 'bg-red-900/30 grayscale' : 'bg-gradient-to-br from-gray-800 to-gray-900'}
                    `}>
                      {bot.avatar}
                    </div>
                    
                    {/* Eliminated overlay */}
                    {bot.eliminated && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                        <span className="text-red-500 text-3xl font-bold">✕</span>
                      </div>
                    )}
                    
                    {/* Surviving checkmark */}
                    {!bot.eliminated && (
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#00ff00] rounded-full flex items-center justify-center">
                        <span className="text-black text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Next Round Status */}
            <div className="text-center py-4">
              <p className="text-gray-400 font-mono text-sm">
                {survivingBots} BOTS REMAIN — ROUND 2 IN 0:{nextRoundIn.toString().padStart(2, '0')}
              </p>
              <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gray-600 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#00ff00]/20 pb-safe">
        <div className="flex justify-around py-2">
          {phase === 'matchmaking' ? (
            <>
              <NavItem icon={<Grid3X3 />} label="LOBBY" active />
              <NavItem icon={<BarChart3 />} label="STATS" />
              <NavItem icon={<Trophy />} label="WAGERS" />
              <NavItem icon={<Settings />} label="CONFIG" />
            </>
          ) : (
            <>
              <NavItem icon={<Home />} label="HOME" active={phase === 'deliberation'} />
              <NavItem icon={<BarChart3 />} label="BOARD" active={phase === 'price-reveal'} />
              <NavItem icon={<Bot />} label="MY BOT" />
              <NavItem icon={<Radio />} label="BETS" />
            </>
          )}
        </div>
      </nav>

      {/* Phase Switcher (dev only) */}
      <div className="fixed bottom-20 left-4 right-4 flex gap-2 z-50">
        <button 
          onClick={() => setPhase('matchmaking')}
          className={`flex-1 py-2 text-xs font-bold rounded ${phase === 'matchmaking' ? 'bg-[#00ff00] text-black' : 'bg-gray-800 text-gray-400'}`}
        >
          QUEUE
        </button>
        <button 
          onClick={() => setPhase('deliberation')}
          className={`flex-1 py-2 text-xs font-bold rounded ${phase === 'deliberation' ? 'bg-[#00ff00] text-black' : 'bg-gray-800 text-gray-400'}`}
        >
          DELIB
        </button>
        <button 
          onClick={() => setPhase('price-reveal')}
          className={`flex-1 py-2 text-xs font-bold rounded ${phase === 'price-reveal' ? 'bg-[#00ff00] text-black' : 'bg-gray-800 text-gray-400'}`}
        >
          REVEAL
        </button>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`flex flex-col items-center gap-1 px-4 py-1 ${active ? 'text-[#00ff00]' : 'text-gray-500'}`}>
      <span className="w-5 h-5">{icon}</span>
      <span className="text-[10px] font-bold tracking-wider">{label}</span>
    </button>
  );
}
