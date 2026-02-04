'use client';

import { useState, useEffect } from 'react';
import { Home, BarChart3, Bot, Radio } from 'lucide-react';

// Bot avatar images (placeholder URLs - will be replaced with real robot portraits)
const BOT_AVATARS = [
  '/avatars/bot-1.png',
  '/avatars/bot-2.png',
  '/avatars/bot-3.png',
  '/avatars/bot-4.png',
  '/avatars/bot-5.png',
  '/avatars/bot-6.png',
  '/avatars/bot-7.png',
  '/avatars/bot-8.png',
];

// Demo data
const DEMO_BOTS = [
  { id: '1', name: 'Alpha-7', avatar: BOT_AVATARS[0], active: true, eliminated: false },
  { id: '2', name: 'NeuralNet', avatar: BOT_AVATARS[1], active: false, eliminated: false },
  { id: '3', name: 'PriceBot', avatar: BOT_AVATARS[2], active: false, eliminated: false },
  { id: '4', name: 'Sentinel', avatar: BOT_AVATARS[3], active: false, eliminated: false },
  { id: '5', name: 'Cipher', avatar: BOT_AVATARS[4], active: false, eliminated: false },
  { id: '6', name: 'Axiom', avatar: BOT_AVATARS[5], active: false, eliminated: false },
  { id: '7', name: 'Vector', avatar: BOT_AVATARS[6], active: false, eliminated: true },
  { id: '8', name: 'Quantum', avatar: BOT_AVATARS[7], active: false, eliminated: true },
];

const DEMO_ITEM = {
  title: 'Air Jordan 1 Chicago (1985)',
  category: 'HERO ITEM',
  condition: 'Pristine',
  imageUrl: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&h=600&fit=crop',
};

type MatchPhase = 
  | 'queue' 
  | 'intro' 
  | 'item-reveal' 
  | 'deliberation' 
  | 'bid-lock' 
  | 'price-reveal' 
  | 'elimination' 
  | 'final-intro'
  | 'winner' 
  | 'recap';

interface MatchViewProps {
  phase?: MatchPhase;
}

export default function MatchView({ phase: initialPhase = 'deliberation' }: MatchViewProps) {
  const [phase, setPhase] = useState<MatchPhase>(initialPhase);
  const [timer, setTimer] = useState(42.15);
  const [round, setRound] = useState(1);
  const [liveCount, setLiveCount] = useState(1247);
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  const [speechText, setSpeechText] = useState("Classic Chicago 1s, I'm thinking $4,500 range...");
  const [systemMessages, setSystemMessages] = useState([
    'Bot Alpha calculated bias at +2.4%'
  ]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'deliberation') return;
    const interval = setInterval(() => {
      setTimer(t => Math.max(0, t - 0.01));
    }, 10);
    return () => clearInterval(interval);
  }, [phase]);

  // Cycle through speakers (demo)
  useEffect(() => {
    if (phase !== 'deliberation') return;
    const interval = setInterval(() => {
      setCurrentSpeaker(s => (s + 1) % 6); // Only non-eliminated bots
      const speeches = [
        "Classic Chicago 1s, I'm thinking $4,500 range...",
        "Market's been hot lately. Could be higher.",
        "1985 OGs in this condition? Rare find.",
        "I'm seeing $5,200 based on recent sales.",
        "Don't sleep on the wear patterns. Lowers the value.",
        "Bidding conservative this round. Last one hurt.",
      ];
      setSpeechText(speeches[Math.floor(Math.random() * speeches.length)]);
    }, 4000);
    return () => clearInterval(interval);
  }, [phase]);

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const progressPercent = (timer / 45) * 100;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00ff00] rotate-45 flex items-center justify-center">
              <span className="text-black font-bold text-sm -rotate-45">◆</span>
            </div>
            <span className="font-bold text-lg tracking-tight">PRICE WARS</span>
          </div>
          <div className="badge-live flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00ff00] rounded-full animate-pulse" />
            <span>{liveCount.toLocaleString()} LIVE</span>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* Round Badge */}
        <div>
          <span className="badge badge-primary">ROUND {round}/4: VALUATION</span>
        </div>

        {/* Item Display */}
        <div className="card-glow overflow-hidden">
          <div className="aspect-square relative">
            <img 
              src={DEMO_ITEM.imageUrl} 
              alt={DEMO_ITEM.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Item Info */}
        <div className="space-y-2">
          <span className="text-[#00ff00] text-xs font-bold tracking-widest">
            {DEMO_ITEM.category}
          </span>
          <h2 className="text-xl font-bold">{DEMO_ITEM.title}</h2>
          <div className="flex gap-2">
            <span className="badge badge-outline text-xs">{DEMO_ITEM.condition}</span>
          </div>
        </div>

        {/* Active Speech Bubble */}
        {phase === 'deliberation' && (
          <div className="animate-fade-in">
            <div className="speech-bubble inline-block">
              "{speechText}"
            </div>
          </div>
        )}

        {/* Bot Grid */}
        <div className="grid grid-cols-4 gap-2">
          {DEMO_BOTS.map((bot, idx) => (
            <div 
              key={bot.id}
              className={`
                bot-avatar relative
                ${idx === currentSpeaker && phase === 'deliberation' ? 'active' : ''}
                ${bot.eliminated ? 'eliminated' : ''}
              `}
            >
              {/* Placeholder avatar - colored div with emoji for now */}
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-3xl">
                🤖
              </div>
              {/* Bot name overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5 text-[10px] font-medium truncate text-center">
                {bot.name}
              </div>
              {/* Active indicator */}
              {idx === currentSpeaker && phase === 'deliberation' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00ff00] rounded-full animate-pulse" />
              )}
            </div>
          ))}
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="phase-label">DELIBERATION PHASE</span>
            <span className="timer">{formatTime(timer)}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* System Feed */}
        <div className="system-feed">
          <div className="system-feed-label">INCOMING DATA</div>
          {systemMessages.map((msg, idx) => (
            <div key={idx} className="text-gray-400">
              <span className="text-[#00ff00] font-semibold">SYSTEM:</span> {msg}
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="flex justify-around">
          <a href="/" className="bottom-nav-item active">
            <Home className="w-5 h-5" />
            <span>Home</span>
          </a>
          <a href="/leaderboard" className="bottom-nav-item">
            <BarChart3 className="w-5 h-5" />
            <span>Board</span>
          </a>
          <a href="/bot" className="bottom-nav-item">
            <Bot className="w-5 h-5" />
            <span>My Bot</span>
          </a>
          <a href="/bets" className="bottom-nav-item">
            <Radio className="w-5 h-5" />
            <span>Bets</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
