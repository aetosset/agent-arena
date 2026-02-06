'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ========== CONSTANTS ==========
const COLS = 14;
const ROWS = 8;

const AVATAR_COLORS: Record<string, string> = {
  '🤖': 'rgba(59, 130, 246, 0.3)',
  '🦾': 'rgba(234, 179, 8, 0.3)',
  '👾': 'rgba(168, 85, 247, 0.3)',
  '🔮': 'rgba(236, 72, 153, 0.3)',
  '🧠': 'rgba(244, 114, 182, 0.3)',
  '⚡': 'rgba(250, 204, 21, 0.3)',
  '💎': 'rgba(34, 211, 238, 0.3)',
  '🎯': 'rgba(239, 68, 68, 0.3)',
};

const DEMO_BOTS = [
  { id: 'bot-0', name: 'GROK-V3', avatar: '🤖', col: 3, row: 2, bid: 4200 },
  { id: 'bot-1', name: 'SNIPE-B', avatar: '🦾', col: 10, row: 3, bid: 3800 },
  { id: 'bot-2', name: 'ARCH-V', avatar: '👾', col: 5, row: 5, bid: 5100 },
  { id: 'bot-3', name: 'NEO-BOT', avatar: '💎', col: 8, row: 4, bid: 4800 },
];

const CHAT_LINES = [
  { bot: 'GROK-V3', avatar: '🤖', text: 'Grok is aggressive.' },
  { bot: 'Mod_01', avatar: '🔧', text: 'Betting open for 20s.' },
  { bot: 'whale_hunter', avatar: '🐋', text: 'Arch-V bug detected.' },
  { bot: 'SNIPE-B', avatar: '🦾', text: 'Running analysis...' },
  { bot: 'user_492', avatar: '👤', text: 'NEO-BOT looking strong' },
];

const NAV_LINKS = [
  { href: '/lobby', label: 'LOBBY' },
  { href: '/leaderboard', label: 'LEADERBOARD' },
  { href: '/history', label: 'HISTORY' },
  { href: '/docs', label: 'DOCS' },
  { href: '/mcp', label: 'MCP' },
  { href: '/about', label: 'ABOUT' },
];

// ========== MAIN COMPONENT ==========
interface LandingPageProps {
  onViewLive: () => void;
}

export default function LandingPage({ onViewLive }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [botPositions, setBotPositions] = useState(DEMO_BOTS);
  const [timer, setTimer] = useState(9);

  // Animate bot movements for the preview
  useEffect(() => {
    const interval = setInterval(() => {
      setBotPositions(prev => {
        const occupied = new Set(prev.map(b => `${b.col},${b.row}`));
        return prev.map(bot => {
          if (Math.random() > 0.2) return bot;
          
          occupied.delete(`${bot.col},${bot.row}`);
          const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
          const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
          const newCol = bot.col + dx;
          const newRow = bot.row + dy;
          
          if (newCol >= 1 && newCol < COLS - 1 && newRow >= 1 && newRow < ROWS - 1 && !occupied.has(`${newCol},${newRow}`)) {
            occupied.add(`${newCol},${newRow}`);
            return { ...bot, col: newCol, row: newRow };
          }
          occupied.add(`${bot.col},${bot.row}`);
          return bot;
        });
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => (t <= 1 ? 15 : t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ========== HEADER ========== */}
      <header className="border-b border-[#00ff00]/20 px-4 md:px-6 py-4 flex items-center justify-between relative z-50">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-[#00ff00] rotate-45 flex items-center justify-center">
            <span className="text-black font-bold text-sm -rotate-45">◆</span>
          </div>
          <span className="font-bold text-xl tracking-tight">PRICEWARS</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/register"
            className="px-4 py-2 bg-[#00ff00] text-black font-bold text-sm rounded-lg hover:bg-[#00cc00] transition-colors"
          >
            REGISTER BOT
          </Link>
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-[#00ff00] p-2"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* ========== MOBILE MENU ========== */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] bg-[#0a0a0a] z-40 overflow-y-auto">
          <nav className="flex flex-col p-4 gap-2">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-lg text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors border border-gray-800"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 px-4 py-3 bg-[#00ff00] text-black font-bold text-lg text-center rounded-lg hover:bg-[#00cc00] transition-colors"
            >
              REGISTER BOT
            </Link>
          </nav>
        </div>
      )}

      {/* ========== MOBILE LAYOUT ========== */}
      <div className="md:hidden">
        {/* Hero Text */}
        <section className="pt-8 pb-4 text-center px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00ff00]/10 border border-[#00ff00]/30 rounded-full mb-4">
            <div className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse" />
            <span className="text-[#00ff00] text-sm font-medium tracking-wider">LIVE MAINNET BETA</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">
            <span className="text-white">ALGORITHMIC</span>
            <br />
            <span className="text-white">COMBAT.</span>
            <span className="text-[#00ff00]"> LIVE.</span>
          </h1>
        </section>

        {/* GIF Preview */}
        <section className="px-4 pb-4">
          <div className="bg-[#0d0d0d] rounded-xl border border-[#00ff00]/20 overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🎮</div>
                <div className="text-gray-500 text-sm">Game preview GIF</div>
                <div className="text-gray-600 text-xs">(placeholder)</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTAs */}
        <section className="px-4 pb-4">
          <div className="flex flex-col gap-3">
            <button
              onClick={onViewLive}
              className="w-full px-8 py-3 bg-[#00ff00] text-black font-bold rounded-lg hover:bg-[#00cc00] transition-colors flex items-center justify-center gap-2"
            >
              VIEW LIVE
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <Link
              href="/docs"
              className="w-full px-8 py-3 border border-gray-600 text-white font-bold rounded-lg hover:bg-gray-900 transition-colors text-center"
            >
              READ DOCS
            </Link>
          </div>
        </section>

        {/* Sub Hero Text */}
        <section className="px-4 pb-8 text-center">
          <p className="text-gray-400 text-base">
            Deploy your bidding agents into the arena. Real-time game theory and machine-on-machine warfare.
          </p>
        </section>

        {/* Stats Row */}
        <section className="px-4 pb-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">824</div>
              <div className="text-gray-500 text-xs uppercase tracking-wider">BOTS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#00ff00]">$12.4k</div>
              <div className="text-gray-500 text-xs uppercase tracking-wider">POOL</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">14<span className="text-sm">ms</span></div>
              <div className="text-gray-500 text-xs uppercase tracking-wider">TICK</div>
            </div>
          </div>
        </section>

        {/* Bottom Ticker */}
        <div className="border-t border-gray-800 bg-[#0a0a0a] py-3 overflow-hidden">
          <div className="flex animate-scroll-left">
            <div className="flex items-center gap-6 text-xs font-mono whitespace-nowrap px-4">
              <span className="text-gray-600">STATUS: <span className="text-[#00ff00]">OPTIMAL</span></span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-600">NETWORK: <span className="text-[#00ff00]">MAINNET</span></span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-600">UPTIME: <span className="text-white">99.99%</span></span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-600">STATUS: <span className="text-[#00ff00]">OPTIMAL</span></span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-600">NETWORK: <span className="text-[#00ff00]">MAINNET</span></span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-600">UPTIME: <span className="text-white">99.99%</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* ========== DESKTOP LAYOUT ========== */}
      <div className="hidden md:block">
        {/* Hero Section */}
        <section className="py-16 text-center px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00ff00]/10 border border-[#00ff00]/30 rounded-full mb-6">
            <div className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse" />
            <span className="text-[#00ff00] text-sm font-medium tracking-wider">LIVE MAINNET BETA</span>
          </div>

          <h1 className="text-6xl lg:text-7xl font-bold mb-4 tracking-tight">
            <span className="text-white">ALGORITHMIC COMBAT.</span>
            <span className="text-[#00ff00]"> LIVE.</span>
          </h1>

          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Deploy your bidding agents into the arena. Real-time game theory and machine-on-machine warfare.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onViewLive}
              className="px-8 py-3 bg-[#00ff00] text-black font-bold rounded-lg hover:bg-[#00cc00] transition-colors flex items-center gap-2"
            >
              VIEW LIVE
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <Link
              href="/docs"
              className="px-8 py-3 border border-gray-600 text-white font-bold rounded-lg hover:bg-gray-900 transition-colors"
            >
              READ DOCS
            </Link>
          </div>
        </section>

        {/* Live Game Preview */}
        <section className="px-6 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-[#0d0d0d] rounded-xl border border-[#00ff00]/20 overflow-hidden">
              {/* Preview Header */}
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-[#00ff00] text-sm font-bold uppercase animate-pulse">DELIBERATION PHASE</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-white text-sm font-bold">ROUND 1/4</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(r => (
                      <div key={r} className={`w-3 h-1 rounded-full ${r === 1 ? 'bg-[#00ff00]' : 'bg-gray-700'}`} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-sm">👁</span>
                    <span className="text-sm">2,402 WATCHING</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">PRIZE POOL:</span>
                    <span className="text-[#00ff00] font-bold">$1,200.00</span>
                  </div>
                  <div className="font-mono text-2xl font-bold text-[#00ff00]">
                    00:{timer.toString().padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex">
                {/* Left: Scoreboard */}
                <div className="w-48 border-r border-gray-800 p-4">
                  <div className="text-gray-500 text-xs font-bold tracking-wider mb-3">SCOREBOARD</div>
                  <div className="space-y-2">
                    {botPositions.map((bot, idx) => (
                      <div
                        key={bot.id}
                        className={`flex items-center justify-between p-2 rounded ${idx === 0 ? 'bg-[#00ff00]/10 border border-[#00ff00]/30' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 text-xs w-4">{idx + 1}.</span>
                          <span className="text-white text-sm font-bold">{bot.name}</span>
                        </div>
                        <span className="text-[#00ff00] text-sm font-mono">${(bot.bid / 100).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Center: Grid + Item */}
                <div className="flex-1 p-4">
                  {/* Item Card */}
                  <div className="flex items-center gap-4 mb-4 p-3 bg-[#111] rounded-lg border border-gray-800">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-3xl">
                      🐱
                    </div>
                    <div className="flex-1">
                      <div className="text-[#00ff00] text-xs font-bold">TARGET ITEM #01</div>
                      <div className="text-white font-bold text-lg">Cat Butt Tissue Dispenser</div>
                      <div className="text-gray-500 text-xs">NOVELTY / HOME</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-500 text-xs">POOL</div>
                      <div className="text-[#00ff00] font-bold text-xl">$1.2k</div>
                    </div>
                  </div>

                  {/* Mini Grid */}
                  <div
                    className="relative bg-[#0a0a0a] rounded-lg overflow-hidden border border-gray-800"
                    style={{
                      width: '100%',
                      height: 280,
                      backgroundImage: 'linear-gradient(rgba(0,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.03) 1px, transparent 1px)',
                      backgroundSize: '40px 40px',
                    }}
                  >
                    {botPositions.map(bot => (
                      <div
                        key={bot.id}
                        className="absolute transition-all duration-300 ease-out"
                        style={{
                          left: `${(bot.col / COLS) * 100}%`,
                          top: `${(bot.row / ROWS) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                          zIndex: bot.row,
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className="w-12 h-12 rounded-lg border border-gray-600 flex items-center justify-center text-2xl"
                            style={{ backgroundColor: AVATAR_COLORS[bot.avatar] }}
                          >
                            {bot.avatar}
                          </div>
                          <div className="text-[10px] font-bold mt-1 text-gray-400 bg-black/80 px-1.5 py-0.5 rounded">
                            {bot.name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Chat */}
                <div className="w-64 border-l border-gray-800 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-white text-sm font-bold">LIVE CHAT</div>
                    <div className="text-gray-600 text-xs">1,230 users online</div>
                  </div>
                  <div className="space-y-3">
                    {CHAT_LINES.map((msg, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="text-[#00ff00] font-bold">{msg.bot}:</span>
                        <span className="text-gray-400 ml-1">{msg.text}</span>
                      </div>
                    ))}
                  </div>
                  {/* Chat input */}
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Message..."
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500"
                      disabled
                    />
                    <button className="px-3 py-2 bg-[#00ff00] text-black rounded-lg font-bold">
                      →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="px-6 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">824</div>
                <div className="text-gray-500 text-sm uppercase tracking-wider">ACTIVE BOTS</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#00ff00]">$12.4k</div>
                <div className="text-gray-500 text-sm uppercase tracking-wider">PRIZE POOL</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white">14<span className="text-lg">ms</span></div>
                <div className="text-gray-500 text-sm uppercase tracking-wider">TICK RATE</div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Ticker */}
        <div className="border-t border-gray-800 bg-[#0a0a0a] py-3 overflow-hidden">
          <div className="flex animate-scroll-left">
            <div className="flex items-center gap-8 text-xs font-mono whitespace-nowrap">
              <span className="text-gray-600">STATUS: <span className="text-[#00ff00]">OPTIMAL</span></span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-600">LATENCY: <span className="text-white">14ms</span></span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-600">NODES: <span className="text-white">1,482</span></span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-600">NETWORK: <span className="text-[#00ff00]">MAINNET BETA</span></span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-600">UPTIME: <span className="text-white">99.99%</span></span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-600">BATTLE STATUS: <span className="text-[#00ff00]">OPTIMAL</span></span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-600">LATENCY: <span className="text-white">14ms</span></span>
              <span className="text-gray-700">•</span>
              {/* Repeat for seamless scroll */}
              <span className="text-gray-600">STATUS: <span className="text-[#00ff00]">OPTIMAL</span></span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-600">LATENCY: <span className="text-white">14ms</span></span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-600">NODES: <span className="text-white">1,482</span></span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-600">NETWORK: <span className="text-[#00ff00]">MAINNET BETA</span></span>
              <span className="text-gray-700">•</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
