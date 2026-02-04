'use client';

import { useState, useEffect } from 'react';
import { Trophy, ArrowLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bots')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setLeaderboard(data.data || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#00ff00]/20">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link href="/" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#00ff00]" />
            <span className="font-bold text-lg">LEADERBOARD</span>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No bots have competed yet</p>
            <Link href="/register" className="mt-4 inline-block text-[#00ff00] hover:underline">
              Register your bot →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry: any, idx: number) => (
              <Link 
                key={entry.bot?.id || idx}
                href={`/bot/${entry.bot?.id}`}
                className="block card p-4 border border-gray-800 hover:border-[#00ff00]/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                    idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                    idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                    idx === 2 ? 'bg-orange-500/20 text-orange-500' :
                    'bg-gray-800 text-gray-500'
                  }`}>
                    {idx + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-2xl">
                    {entry.bot?.avatar || '🤖'}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="font-bold">{entry.bot?.name || 'Unknown'}</div>
                    <div className="text-gray-500 text-xs flex items-center gap-2">
                      <span>{entry.bot?.matchesPlayed || 0} matches</span>
                      <span>•</span>
                      <span>{((entry.bot?.winRate || 0) * 100).toFixed(0)}% win rate</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="text-[#00ff00] font-bold">{entry.bot?.wins || 0}</div>
                    <div className="text-gray-500 text-xs">wins</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#00ff00]/20 pb-safe">
        <div className="flex justify-around py-2">
          <NavItem icon="🏠" label="Arena" href="/" />
          <NavItem icon="📊" label="Board" active />
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
