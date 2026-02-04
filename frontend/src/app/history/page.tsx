'use client';

import { useState, useEffect } from 'react';
import { Clock, ArrowLeft, Trophy, Users } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#00ff00]/20">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link href="/" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#00ff00]" />
            <span className="font-bold text-lg">MATCH HISTORY</span>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No matches yet</p>
            <p className="text-gray-600 text-sm mt-2">Matches will appear here after they finish</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match: any) => (
              <Link 
                key={match.id}
                href={`/match/${match.id}`}
                className="block card p-4 border border-gray-800 hover:border-[#00ff00]/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#00ff00]" />
                    <span className="font-bold">{match.winner?.name || 'Unknown'}</span>
                    <span className="text-[#00ff00] text-xs">WON</span>
                  </div>
                  <div className="text-gray-500 text-xs">
                    {match.endedAt ? formatTimeAgo(match.endedAt) : 'Just now'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Users className="w-4 h-4" />
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#00ff00]/20 pb-safe">
        <div className="flex justify-around py-2">
          <NavItem icon="🏠" label="Arena" href="/" />
          <NavItem icon="📊" label="Board" href="/leaderboard" />
          <NavItem icon="📜" label="History" active />
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
