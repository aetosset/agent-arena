'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

export default function HistoryPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/matches?limit=20')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setMatches(data.data || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatTimeAgo = (timestamp: string | number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Match History</h1>
          <p className="text-gray-500 mt-2">Recent completed matches</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📜</div>
            <p className="text-gray-500">No matches yet</p>
            <p className="text-gray-600 text-sm mt-2">Matches will appear here after they finish</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match: any) => (
              <Link 
                key={match.id}
                href={`/match/${match.id}`}
                className="block bg-[#111] rounded-xl border border-gray-800 p-4 hover:border-[#00ff00]/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <span className="font-bold">{match.winner?.name || 'Unknown'}</span>
                    <span className="text-[#00ff00] text-xs font-bold">WON</span>
                  </div>
                  <div className="text-gray-500 text-xs">
                    {match.endedAt ? formatTimeAgo(match.endedAt) : 'Just now'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-400">
                    <span>👥</span>
                    <span>{match.bots?.length || 8} bots</span>
                  </div>
                  <div className="text-gray-500">
                    {match.roundCount || 4} rounds
                  </div>
                </div>

                {/* Bot avatars preview */}
                <div className="flex gap-1 mt-3">
                  {(match.bots || []).slice(0, 8).map((bot: any, idx: number) => (
                    <div 
                      key={bot.id || idx}
                      className={`w-8 h-8 rounded bg-[#1a1a1a] flex items-center justify-center text-sm ${
                        bot.id === match.winner?.id ? 'ring-2 ring-[#00ff00]' : ''
                      }`}
                    >
                      {bot.avatar || '🤖'}
                    </div>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
