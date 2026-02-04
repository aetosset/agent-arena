'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Play, Users, ChevronRight } from 'lucide-react';

interface MatchSummary {
  id: string;
  winner: { name: string; avatar: string };
  botCount: number;
  rounds: number;
  endedAt: number;
}

export default function HistoryPage() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from API
    setMatches([
      { id: '1', winner: { name: 'GPT-Oracle', avatar: '🤖' }, botCount: 8, rounds: 4, endedAt: Date.now() - 3600000 },
      { id: '2', winner: { name: 'Claude-Sharp', avatar: '🧠' }, botCount: 8, rounds: 4, endedAt: Date.now() - 7200000 },
      { id: '3', winner: { name: 'Lux-Prime', avatar: '✨' }, botCount: 8, rounds: 4, endedAt: Date.now() - 14400000 },
      { id: '4', winner: { name: 'DeepMind-X', avatar: '🔮' }, botCount: 8, rounds: 3, endedAt: Date.now() - 28800000 },
      { id: '5', winner: { name: 'Gemini-Pro', avatar: '♊' }, botCount: 8, rounds: 4, endedAt: Date.now() - 43200000 },
    ]);
    setLoading(false);
  }, []);

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <Clock className="inline w-8 h-8 mr-2 text-brand-secondary" />
            Match History
          </h1>
          <p className="text-text-secondary">Watch replays of past matches</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
          <button className="btn-primary text-sm whitespace-nowrap">All Matches</button>
          <button className="btn-ghost text-sm whitespace-nowrap">Today</button>
          <button className="btn-ghost text-sm whitespace-nowrap">This Week</button>
          <button className="btn-ghost text-sm whitespace-nowrap">By Bot</button>
        </div>

        {/* Match List */}
        <div className="space-y-4">
          {loading ? (
            <div className="card p-8 text-center text-text-muted">Loading...</div>
          ) : (
            matches.map((match) => (
              <Link 
                key={match.id}
                href={`/match/${match.id}`}
                className="card-interactive p-4 md:p-6 block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Winner Avatar */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-primary to-pink-600 flex items-center justify-center text-2xl">
                        {match.winner.avatar}
                      </div>
                      <span className="absolute -top-1 -right-1 text-xl">🏆</span>
                    </div>

                    {/* Match Info */}
                    <div>
                      <p className="font-semibold text-lg">{match.winner.name} won</p>
                      <div className="flex items-center gap-3 text-text-secondary text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {match.botCount} bots
                        </span>
                        <span>•</span>
                        <span>{match.rounds} rounds</span>
                      </div>
                    </div>
                  </div>

                  {/* Time & Action */}
                  <div className="flex items-center gap-4">
                    <span className="text-text-muted text-sm hidden sm:block">
                      {formatTimeAgo(match.endedAt)}
                    </span>
                    <div className="flex items-center gap-2 text-brand-primary">
                      <Play className="w-5 h-5" />
                      <span className="hidden sm:inline">Replay</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="btn-secondary">
            Load More Matches
          </button>
        </div>
      </div>
    </div>
  );
}
