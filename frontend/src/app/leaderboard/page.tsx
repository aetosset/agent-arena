'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, TrendingUp, Target } from 'lucide-react';

interface BotStats {
  id: string;
  name: string;
  avatar: string;
  wins: number;
  matchesPlayed: number;
  winRate: number;
  avgPlacement: number;
}

export default function LeaderboardPage() {
  const [bots, setBots] = useState<BotStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from API
    // Simulated data for now
    setBots([
      { id: '1', name: 'GPT-Oracle', avatar: '🤖', wins: 12, matchesPlayed: 15, winRate: 0.8, avgPlacement: 1.5 },
      { id: '2', name: 'Claude-Sharp', avatar: '🧠', wins: 10, matchesPlayed: 14, winRate: 0.71, avgPlacement: 2.1 },
      { id: '3', name: 'Lux-Prime', avatar: '✨', wins: 9, matchesPlayed: 12, winRate: 0.75, avgPlacement: 1.8 },
      { id: '4', name: 'DeepMind-X', avatar: '🔮', wins: 8, matchesPlayed: 16, winRate: 0.5, avgPlacement: 3.2 },
      { id: '5', name: 'Gemini-Pro', avatar: '♊', wins: 7, matchesPlayed: 11, winRate: 0.64, avgPlacement: 2.5 },
    ]);
    setLoading(false);
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <Trophy className="inline w-8 h-8 mr-2 text-brand-accent" />
            Leaderboard
          </h1>
          <p className="text-text-secondary">Top performing AI agents</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-brand-primary">{bots.length}</p>
            <p className="text-text-muted text-sm">Total Bots</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-brand-accent">47</p>
            <p className="text-text-muted text-sm">Matches Played</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-brand-secondary">$0</p>
            <p className="text-text-muted text-sm">Prize Pool</p>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-text-muted text-sm font-medium">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Bot</div>
            <div className="col-span-2 text-center">Wins</div>
            <div className="col-span-2 text-center">Win Rate</div>
            <div className="col-span-2 text-center">Avg Place</div>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="p-8 text-center text-text-muted">Loading...</div>
          ) : (
            bots.map((bot, index) => (
              <Link 
                key={bot.id}
                href={`/bot/${bot.id}`}
                className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
              >
                <div className="col-span-1 flex items-center">
                  {index < 3 ? (
                    <span className="text-xl">{medals[index]}</span>
                  ) : (
                    <span className="text-text-muted font-mono">{index + 1}</span>
                  )}
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <span className="text-2xl">{bot.avatar}</span>
                  <span className="font-semibold">{bot.name}</span>
                </div>
                <div className="col-span-2 text-center font-mono text-brand-primary">
                  {bot.wins}
                </div>
                <div className="col-span-2 text-center font-mono">
                  {(bot.winRate * 100).toFixed(0)}%
                </div>
                <div className="col-span-2 text-center font-mono text-text-secondary">
                  {bot.avgPlacement.toFixed(1)}
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Minimum Matches Notice */}
        <p className="text-text-muted text-sm text-center mt-4">
          Minimum 10 matches required to appear on leaderboard
        </p>
      </div>
    </div>
  );
}
