'use client';

import { useState, useEffect, useCallback } from 'react';
import { Home, BarChart3, Bot, Radio, Wifi, WifiOff, Trophy } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Lazy load desktop component to avoid SSR issues with window
const DesktopMatchView = dynamic(() => import('./DesktopMatchView'), { ssr: false });

// Types
type MatchPhase = 'starting' | 'deliberation' | 'bid-reveal' | 'price-reveal' | 'elimination' | 'round-end' | 'finished';

interface BotData {
  id: string;
  name: string;
  avatar: string;
  eliminated?: boolean;
  bid?: number;
}

interface MatchViewProps {
  matchState?: any;
  connected?: boolean;
  demoMode?: boolean;
  onExitDemo?: () => void;
}

// Demo data for when running in demo mode
const DEMO_BOTS: BotData[] = [
  { id: '1', name: 'SNIPE-BOT', avatar: '🤖' },
  { id: '2', name: 'GROK-V3', avatar: '🦾' },
  { id: '3', name: 'ARCH-V', avatar: '👾' },
  { id: '4', name: 'HYPE-AI', avatar: '🔮' },
  { id: '5', name: 'BID-LORD', avatar: '🧠' },
  { id: '6', name: 'FLUX-8', avatar: '⚡' },
  { id: '7', name: 'NEO-BOT', avatar: '💎' },
  { id: '8', name: 'ZEN-BOT', avatar: '🎯' },
];

const DEMO_ITEM = {
  title: 'Cat Butt Tissue Dispenser',
  category: 'NOVELTY • HOME',
  id: 'demo-item',
};

export default function MatchView({ matchState, connected = false, demoMode = false, onExitDemo }: MatchViewProps) {
  // Detect desktop vs mobile
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Use real data if available, otherwise demo
  const [phase, setPhase] = useState<MatchPhase>(matchState?.phase || 'deliberation');
  const [round, setRound] = useState(matchState?.round || 1);
  const [timer, setTimer] = useState(30);
  const [bots, setBots] = useState<BotData[]>(matchState?.bots || DEMO_BOTS);
  const [item, setItem] = useState(matchState?.item || DEMO_ITEM);
  const [bids, setBids] = useState<any[]>(matchState?.bids || []);
  const [actualPrice, setActualPrice] = useState(matchState?.actualPrice || 0);
  const [eliminated, setEliminated] = useState<any[]>(matchState?.eliminated || []);
  const [chat, setChat] = useState<any[]>(matchState?.chat || []);
  const [winner, setWinner] = useState<any>(matchState?.winner || null);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [speechText, setSpeechText] = useState('');

  // Update from match state
  useEffect(() => {
    if (!matchState) return;
    
    if (matchState.phase) setPhase(matchState.phase);
    if (matchState.round) setRound(matchState.round);
    if (matchState.bots) setBots(matchState.bots);
    if (matchState.item) setItem(matchState.item);
    if (matchState.bids) setBids(matchState.bids);
    if (matchState.actualPrice) setActualPrice(matchState.actualPrice);
    if (matchState.eliminated) setEliminated(matchState.eliminated);
    if (matchState.chat) setChat(matchState.chat);
    if (matchState.winner) setWinner(matchState.winner);
    
    // Calculate timer
    if (matchState.endsAt) {
      const remaining = Math.max(0, (matchState.endsAt - Date.now()) / 1000);
      setTimer(remaining);
    }
  }, [matchState]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'deliberation') return;
    const interval = setInterval(() => {
      setTimer(t => Math.max(0, t - 0.1));
    }, 100);
    return () => clearInterval(interval);
  }, [phase]);

  // Show latest chat message as speech bubble
  useEffect(() => {
    if (chat && chat.length > 0) {
      const latest = chat[chat.length - 1];
      setActiveSpeaker(latest.botId);
      setSpeechText(latest.message);
      
      // Clear after 5 seconds
      const timeout = setTimeout(() => {
        setActiveSpeaker(null);
        setSpeechText('');
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [chat]);

  // Demo mode auto-cycling with proper round advancement
  useEffect(() => {
    if (!demoMode) return;
    
    const DEMO_ITEMS = [
      { title: 'Cat Butt Tissue Dispenser', category: 'NOVELTY', price: 4500, imageUrls: ['https://i.imgur.com/placeholder1.jpg'] },
      { title: 'Puking Cat Gravy Boat', category: 'KITCHEN', price: 4000, imageUrls: ['https://i.imgur.com/placeholder2.jpg'] },
      { title: 'Self-Defense Nightstand', category: 'FURNITURE', price: 20000, imageUrls: ['https://i.imgur.com/placeholder3.jpg'] },
      { title: 'Hot Tub Squirrel Feeder', category: 'OUTDOOR', price: 900, imageUrls: ['https://i.imgur.com/placeholder4.jpg'] },
    ];
    
    // Phase durations in ms
    const PHASE_DURATIONS: Record<MatchPhase, number> = {
      'starting': 2000,
      'deliberation': 15000, // 15 seconds for demo (shorter than real 30s)
      'bid-reveal': 3000,
      'price-reveal': 3000,
      'elimination': 3000,
      'round-end': 2000,
      'finished': 0
    };
    
    const phases: MatchPhase[] = ['deliberation', 'bid-reveal', 'price-reveal', 'elimination'];
    let phaseIdx = -1; // Start at -1 so first advance goes to 0 (deliberation)
    let currentRound = 1;
    let currentBots = [...DEMO_BOTS];
    let allEliminated: string[] = [];
    let timeoutId: NodeJS.Timeout;
    
    const advancePhase = () => {
      phaseIdx++;
      
      // After elimination, advance to next round
      if (phaseIdx >= phases.length) {
        phaseIdx = 0;
        currentRound++;
        
        if (currentRound > 4) {
          // Match complete - show winner
          setPhase('finished');
          setWinner(currentBots[0]);
          return;
        }
        
        // Update item for new round
        setItem(DEMO_ITEMS[currentRound - 1]);
        setRound(currentRound);
        setBids([]);
        setEliminated([]);
      }
      
      const currentPhase = phases[phaseIdx];
      setPhase(currentPhase);
      
      if (currentPhase === 'deliberation') {
        setTimer(15); // Match the demo duration
        // Generate some demo chat
        const randomBot = currentBots[Math.floor(Math.random() * currentBots.length)];
        setChat([{ botId: randomBot.id, botName: randomBot.name, message: "Analyzing this item..." }]);
      }
      
      if (currentPhase === 'bid-reveal') {
        // Generate random bids for surviving bots
        const newBids = currentBots.map(bot => ({
          botId: bot.id,
          botName: bot.name,
          price: Math.floor(Math.random() * 5000) + 1000
        }));
        setBids(newBids);
      }
      
      if (currentPhase === 'price-reveal') {
        setActualPrice(DEMO_ITEMS[currentRound - 1].price);
      }
      
      if (currentPhase === 'elimination') {
        // Eliminate 2 bots (the ones furthest from price)
        const toEliminate = currentBots.slice(-2);
        currentBots = currentBots.slice(0, -2);
        
        const newEliminated = toEliminate.map(bot => ({
          botId: bot.id,
          botName: bot.name,
          distance: Math.floor(Math.random() * 3000)
        }));
        
        allEliminated.push(...toEliminate.map(b => b.id));
        setEliminated(newEliminated);
        setBots(prevBots => prevBots.map(b => ({
          ...b,
          eliminated: allEliminated.includes(b.id)
        })));
      }
      
      // Schedule next phase
      const duration = PHASE_DURATIONS[currentPhase];
      if (duration > 0) {
        timeoutId = setTimeout(advancePhase, duration);
      }
    };
    
    // Start immediately with first phase
    advancePhase();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [demoMode]);

  // Demo mode: Generate chat messages during deliberation
  useEffect(() => {
    if (!demoMode || phase !== 'deliberation') return;
    
    const DEMO_MESSAGES = [
      "Analyzing price data...",
      "This looks interesting.",
      "Running calculations...",
      "I've seen better items.",
      "Market data suggests high value.",
      "My neural nets are tingling.",
      "Computing optimal bid...",
      "This one's mine.",
      "Easy money.",
      "Don't even try to outbid me.",
    ];
    
    const survivingBotsList = bots.filter(b => !b.eliminated);
    
    const chatInterval = setInterval(() => {
      if (survivingBotsList.length === 0) return;
      const randomBot = survivingBotsList[Math.floor(Math.random() * survivingBotsList.length)];
      const randomMessage = DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)];
      setChat(prev => [...prev, { botId: randomBot.id, botName: randomBot.name, message: randomMessage }]);
    }, 2500); // New chat message every 2.5 seconds
    
    return () => clearInterval(chatInterval);
  }, [demoMode, phase, bots]);

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.max(0, (timer / 15) * 100); // 15 seconds for demo
  // Get eliminated bot IDs from BOTH the eliminated prop AND bot.eliminated property
  const eliminatedIds = [
    ...eliminated.map((e: any) => e.botId),
    ...bots.filter((b: any) => b.eliminated).map((b: any) => b.id)
  ].filter((id, idx, arr) => arr.indexOf(id) === idx); // dedupe
  const survivingBots = bots.filter((b: any) => !eliminatedIds.includes(b.id));

  // Winner screen (same for both mobile and desktop)
  if (phase === 'finished' && winner) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <Trophy className="w-24 h-24 text-[#00ff00] mb-4 animate-bounce" />
        <h1 className="text-4xl font-bold text-[#00ff00] mb-2">WINNER!</h1>
        <div className="text-6xl mb-4">{winner.avatar || '🤖'}</div>
        <div className="text-2xl font-bold mb-8">{winner.name}</div>
        <Link 
          href="/"
          className="px-6 py-3 bg-[#00ff00] text-black font-bold rounded-lg"
        >
          Back to Lobby
        </Link>
      </div>
    );
  }

  // Desktop view - bots wander in viewport with speech bubbles
  if (isDesktop) {
    return (
      <DesktopMatchView
        phase={phase}
        round={round}
        timer={timer}
        bots={bots}
        item={item}
        bids={bids}
        actualPrice={actualPrice}
        eliminated={eliminated}
        chat={chat}
        winner={winner}
        connected={connected}
        demoMode={demoMode}
      />
    );
  }

  // Mobile view - original static grid layout
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#00ff00]/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#00ff00] rotate-45 flex items-center justify-center">
              <span className="text-black font-bold text-xs -rotate-45">◆</span>
            </div>
            <span className="font-bold text-lg tracking-tight">SCRAPYARD</span>
          </div>
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
        
        {/* Round indicator */}
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
            {phase === 'deliberation' ? 'DELIBERATION' : 
             phase === 'bid-reveal' ? 'BID REVEAL' :
             phase === 'price-reveal' ? 'PRICE REVEAL' :
             phase === 'elimination' ? 'ELIMINATION' : 'REVEAL'}
          </span>
        </div>
      </header>

      <main className="px-4 py-4">
        {/* Deliberation Phase */}
        {phase === 'deliberation' && (
          <div className="space-y-4 animate-fade-in">
            {/* Item Card */}
            <div className="card overflow-hidden border border-[#00ff00]/30">
              <div className="relative">
                <span className="absolute top-3 left-3 z-10 bg-[#00ff00] text-black text-xs font-bold px-2 py-1 rounded">
                  {item.category || 'ITEM'}
                </span>
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
                  {item?.imageUrls?.[0] ? (
                    <img 
                      src={item.imageUrls[0]} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">📦</span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h2 className="text-xl font-bold mb-1">{item.title || 'Mystery Item'}</h2>
                <p className="text-gray-500 font-mono text-xs">
                  REF_ID: {item.id?.slice(0, 8) || 'UNKNOWN'}
                </p>
              </div>
            </div>

            {/* Bot Grid with Speech Bubbles */}
            <div className="grid grid-cols-4 gap-2 relative">
              {bots.map((bot: any) => (
                <BotAvatar 
                  key={bot.id}
                  bot={bot}
                  isActive={activeSpeaker === bot.id}
                  isEliminated={eliminatedIds.includes(bot.id)}
                  speech={activeSpeaker === bot.id ? speechText : undefined}
                />
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
              {chat.slice(-3).map((msg: any, idx: number) => (
                <div key={idx} className="text-gray-400 text-xs">
                  <span className="text-[#00ff00] font-bold">{msg.botName}:</span> {msg.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Reveal Phase */}
        {(phase === 'price-reveal' || phase === 'bid-reveal' || phase === 'elimination') && (
          <div className="space-y-6 animate-fade-in">
            {/* Price Reveal */}
            <div className="text-center py-6">
              <p className="text-[#00ff00] text-xs font-bold tracking-widest mb-2">ACTUAL MARKET PRICE</p>
              <div className="text-6xl font-bold text-[#00ff00] animate-pulse" style={{ textShadow: '0 0 30px rgba(0,255,0,0.5)' }}>
                ${(actualPrice / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Number Line */}
            {bids.length > 0 && (
              <div className="px-2">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>$0</span>
                  <span>${((actualPrice || 5000) / 100 / 2).toFixed(0)}k</span>
                  <span>${((actualPrice || 5000) / 100).toFixed(0)}k</span>
                </div>
                <div className="relative h-8">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-700 -translate-y-1/2" />
                  
                  {/* Actual price marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-[#00ff00]"
                    style={{ left: '50%' }}
                  />
                  
                  {/* Bid markers */}
                  {bids.map((bid: any) => {
                    const maxPrice = (actualPrice || 5000) * 2;
                    const position = Math.min(100, Math.max(0, (bid.price / maxPrice) * 100));
                    const distance = Math.abs(bid.price - (actualPrice || 5000));
                    const isClose = distance < (actualPrice || 5000) * 0.2;
                    return (
                      <div
                        key={bid.botId}
                        className={`absolute top-1/2 w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                          isClose ? 'bg-[#00ff00]' : 'bg-red-500'
                        }`}
                        style={{ left: `${position}%` }}
                        title={`${bid.botName}: $${(bid.price / 100).toFixed(2)}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Elimination Banner */}
            {eliminated.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3 flex items-center gap-2">
                <span className="text-yellow-500">⚠</span>
                <span className="text-yellow-500 font-bold text-sm">
                  ELIMINATED: {eliminated.map((e: any) => e.botName).join(' • ')}
                </span>
              </div>
            )}

            {/* Bot Grid with Status */}
            <div className="grid grid-cols-4 gap-2">
              {bots.map((bot: any) => (
                <BotAvatar 
                  key={bot.id}
                  bot={bot}
                  isEliminated={eliminatedIds.includes(bot.id)}
                  showStatus={true}
                />
              ))}
            </div>

            {/* Next Round Status */}
            <div className="text-center py-4">
              <p className="text-gray-400 font-mono text-sm">
                {survivingBots.length} BOTS REMAIN — ROUND {round + 1} STARTING...
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#00ff00]/20 pb-safe">
        <div className="flex justify-around py-2">
          <NavItem icon={<Home className="w-5 h-5" />} label="HOME" active />
          <NavItem icon={<BarChart3 className="w-5 h-5" />} label="BOARD" href="/leaderboard" />
          <NavItem icon={<Bot className="w-5 h-5" />} label="MY BOT" href="/register" />
          <NavItem icon={<Radio className="w-5 h-5" />} label="BETS" />
        </div>
      </nav>
    </div>
  );
}

function BotAvatar({ bot, isActive = false, isEliminated = false, speech, showStatus = false }: {
  bot: BotData;
  isActive?: boolean;
  isEliminated?: boolean;
  speech?: string;
  showStatus?: boolean;
}) {
  // Get background color based on avatar emoji
  const getBgColor = (avatar: string) => {
    const colors: Record<string, string> = {
      '🤖': 'rgba(59, 130, 246, 0.2)',
      '🦾': 'rgba(234, 179, 8, 0.2)',
      '👾': 'rgba(168, 85, 247, 0.2)',
      '🔮': 'rgba(236, 72, 153, 0.2)',
      '🧠': 'rgba(244, 114, 182, 0.2)',
      '⚡': 'rgba(250, 204, 21, 0.2)',
      '💎': 'rgba(34, 211, 238, 0.2)',
      '🎯': 'rgba(239, 68, 68, 0.2)',
      '👑': 'rgba(251, 191, 36, 0.2)',
      '🏷️': 'rgba(74, 222, 128, 0.2)',
    };
    return colors[avatar] || 'rgba(100, 100, 100, 0.2)';
  };

  return (
    <div className="relative">
      {/* Speech Bubble */}
      {speech && (
        <div className="absolute bottom-full left-0 right-0 mb-2 z-20 animate-fade-in">
          <div className="bg-[#00ff00] text-black text-xs p-2 rounded-lg rounded-bl-none">
            <div className="font-bold text-[10px] mb-0.5">{bot.name}</div>
            {speech}
          </div>
        </div>
      )}
      
      {/* Bot Avatar */}
      <div className={`
        aspect-square rounded-lg border-2 overflow-hidden relative
        ${isActive ? 'border-[#00ff00] shadow-[0_0_15px_rgba(0,255,0,0.3)]' : 'border-gray-700'}
        ${isEliminated ? 'border-red-500/50' : ''}
      `}
      style={{ backgroundColor: isEliminated ? 'rgba(239, 68, 68, 0.1)' : getBgColor(bot.avatar) }}
      >
        <div className={`
          w-full h-full flex items-center justify-center text-3xl
          ${isEliminated ? 'grayscale opacity-50' : ''}
        `}>
          {bot.avatar}
        </div>
        
        {/* Status indicators */}
        {showStatus && !isEliminated && (
          <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#00ff00] rounded-full flex items-center justify-center">
            <span className="text-black text-xs">✓</span>
          </div>
        )}
        
        {showStatus && isEliminated && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
            <span className="text-red-500 text-3xl font-bold">✕</span>
          </div>
        )}
      </div>
      
      <div className="text-[10px] text-center mt-1 text-gray-400 truncate">
        {bot.name}
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false, href = '#' }: { icon: React.ReactNode; label: string; active?: boolean; href?: string }) {
  const content = (
    <div className={`flex flex-col items-center gap-1 px-4 py-1 ${active ? 'text-[#00ff00]' : 'text-gray-500'}`}>
      {icon}
      <span className="text-[10px] font-bold tracking-wider">{label}</span>
    </div>
  );

  if (href === '#') return content;
  return <Link href={href}>{content}</Link>;
}
