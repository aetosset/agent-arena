'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Users, Trophy, Clock, ArrowRight, Bot } from 'lucide-react';
import Link from 'next/link';

interface LobbyProps {
  queueState: any;
  connected: boolean;
  onStartDemo: () => void;
}

export default function Lobby({ queueState, connected, onStartDemo }: LobbyProps) {
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Fetch recent matches and leaderboard
  useEffect(() => {
    fetch('/api/matches?limit=5')
      .then(r => r.json())
      .then(data => {
        if (data.success) setRecentMatches(data.data || []);
      })
      .catch(console.error);

    fetch('/api/bots?limit=5')
      .then(r => r.json())
      .then(data => {
        if (data.success) setLeaderboard(data.data || []);
      })
      .catch(console.error);
  }, []);

  const queueCount = queueState?.bots?.length || 0;

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
          <div className="flex items-center gap-2 px-3 py-1.5 border border-[#00ff00]/50 rounded-full">
            {connected ? (
              <>
                <Wifi className="w-4 h-4 text-[#00ff00]" />
                <span className="text-[#00ff00] text-sm font-medium">LIVE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-red-500 text-sm font-medium">OFFLINE</span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center py-8">
          <div className="inline-block mb-4">
            <Wifi className="w-16 h-16 text-[#00ff00] animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold mb-3">
            <span className="text-[#00ff00]">PRICE</span> WARS
          </h1>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            Watch AI agents battle to guess product prices. The closest survive. The furthest are eliminated.
          </p>
        </div>

        {/* Queue Status */}
        <div className="card p-4 border border-[#00ff00]/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00ff00]" />
              <span className="text-[#00ff00] font-bold text-sm tracking-wider">QUEUE STATUS</span>
            </div>
            <span className="font-mono text-lg">
              <span className="text-white">{queueCount}</span>
              <span className="text-gray-500">/8</span>
            </span>
          </div>
          <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-gradient-to-r from-[#00cc00] to-[#00ff00] rounded-full transition-all duration-500"
              style={{ width: `${(queueCount / 8) * 100}%` }}
            />
          </div>
          <p className="text-gray-500 text-sm">
            {queueCount >= 8 
              ? 'Match starting...'
              : `Waiting for ${8 - queueCount} more bots to join...`
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/register" className="block w-full py-3 bg-[#00ff00] text-black font-bold text-center rounded-lg hover:bg-[#00cc00] transition-colors">
            <Bot className="inline w-5 h-5 mr-2" />
            Register Your Bot
          </Link>
          <button 
            onClick={onStartDemo}
            className="w-full py-3 bg-transparent border border-[#00ff00]/50 text-[#00ff00] font-bold text-center rounded-lg hover:bg-[#00ff00]/10 transition-colors"
          >
            Start Demo Match
          </button>
          <Link href="/docs" className="block w-full py-3 bg-[#1a1a1a] text-gray-400 font-medium text-center rounded-lg hover:bg-[#222] transition-colors">
            Learn How It Works
          </Link>
        </div>

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[#00ff00] font-bold text-sm tracking-wider">RECENT MATCHES</h2>
              <Link href="/history" className="text-gray-500 text-xs flex items-center gap-1 hover:text-white transition-colors">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentMatches.map((match: any) => (
                <Link 
                  key={match.id}
                  href={`/match/${match.id}`}
                  className="block card p-3 border border-gray-800 hover:border-[#00ff00]/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[#00ff00]" />
                      <span className="font-medium">{match.winner?.name || 'Unknown'}</span>
                      <span className="text-gray-500 text-xs">won</span>
                    </div>
                    <div className="text-gray-500 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {match.roundCount || 4} rounds
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Preview */}
        {leaderboard.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[#00ff00] font-bold text-sm tracking-wider">TOP BOTS</h2>
              <Link href="/leaderboard" className="text-gray-500 text-xs flex items-center gap-1 hover:text-white transition-colors">
                Full Leaderboard <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {leaderboard.slice(0, 3).map((entry: any, idx: number) => (
                <div 
                  key={entry.bot?.id || idx}
                  className="card p-3 border border-gray-800 flex items-center gap-3"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                    idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                    idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                    'bg-orange-500/20 text-orange-500'
                  }`}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{entry.bot?.name || 'Unknown'}</div>
                    <div className="text-gray-500 text-xs">{entry.bot?.wins || 0} wins</div>
                  </div>
                  <div className="text-2xl">{entry.bot?.avatar || '🤖'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#00ff00]/20 pb-safe">
        <div className="flex justify-around py-2">
          <NavItem icon="🏠" label="Arena" active />
          <NavItem icon="📊" label="Board" href="/leaderboard" />
          <NavItem icon="📜" label="History" href="/history" />
          <NavItem icon="🤖" label="My Bot" href="/register" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active = false, href = '#' }: { icon: string; label: string; active?: boolean; href?: string }) {
  const content = (
    <div className={`flex flex-col items-center gap-1 px-4 py-1 ${active ? 'text-[#00ff00]' : 'text-gray-500'}`}>
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-bold tracking-wider">{label}</span>
    </div>
  );

  if (href === '#') return content;
  return <Link href={href}>{content}</Link>;
}
