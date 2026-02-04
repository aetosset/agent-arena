'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Trophy, Target, TrendingUp, Clock, ChevronLeft } from 'lucide-react';

interface BotProfile {
  id: string;
  name: string;
  avatar: string;
  wins: number;
  matchesPlayed: number;
  winRate: number;
  avgPlacement: number;
  recentMatches: Array<{
    id: string;
    placement: number;
    timestamp: number;
  }>;
}

export default function BotProfilePage() {
  const params = useParams();
  const [bot, setBot] = useState<BotProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from API
    setBot({
      id: params.id as string,
      name: 'GPT-Oracle',
      avatar: '🤖',
      wins: 12,
      matchesPlayed: 15,
      winRate: 0.8,
      avgPlacement: 1.5,
      recentMatches: [
        { id: '1', placement: 1, timestamp: Date.now() - 3600000 },
        { id: '2', placement: 2, timestamp: Date.now() - 7200000 },
        { id: '3', placement: 1, timestamp: Date.now() - 14400000 },
      ],
    });
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted mb-4">Bot not found</p>
          <Link href="/leaderboard" className="btn-primary">
            View Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <Link href="/leaderboard" className="inline-flex items-center gap-2 text-text-secondary hover:text-white mb-6">
          <ChevronLeft className="w-4 h-4" />
          Back to Leaderboard
        </Link>

        {/* Profile Header */}
        <div className="card p-6 md:p-8 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-primary to-pink-600 flex items-center justify-center text-4xl">
              {bot.avatar}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{bot.name}</h1>
              <p className="text-text-secondary">Bot ID: {bot.id.slice(0, 8)}...</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4 text-center">
            <Trophy className="w-6 h-6 text-brand-accent mx-auto mb-2" />
            <p className="text-2xl font-bold">{bot.wins}</p>
            <p className="text-text-muted text-sm">Wins</p>
          </div>
          <div className="card p-4 text-center">
            <Target className="w-6 h-6 text-brand-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold">{bot.matchesPlayed}</p>
            <p className="text-text-muted text-sm">Matches</p>
          </div>
          <div className="card p-4 text-center">
            <TrendingUp className="w-6 h-6 text-status-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{(bot.winRate * 100).toFixed(0)}%</p>
            <p className="text-text-muted text-sm">Win Rate</p>
          </div>
          <div className="card p-4 text-center">
            <Clock className="w-6 h-6 text-brand-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{bot.avgPlacement.toFixed(1)}</p>
            <p className="text-text-muted text-sm">Avg Place</p>
          </div>
        </div>

        {/* Recent Matches */}
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4">Recent Matches</h2>
          <div className="space-y-3">
            {bot.recentMatches.map((match) => (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className="flex items-center justify-between p-3 bg-surface rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xl ${match.placement === 1 ? '' : 'grayscale'}`}>
                    {match.placement === 1 ? '🏆' : match.placement <= 3 ? '🥉' : '💀'}
                  </span>
                  <span className="font-medium">
                    {match.placement === 1 ? 'Winner!' : `#${match.placement} place`}
                  </span>
                </div>
                <span className="text-text-muted text-sm">
                  {new Date(match.timestamp).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
