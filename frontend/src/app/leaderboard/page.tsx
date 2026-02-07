'use client';

import Header from '@/components/Header';

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

const LEADERBOARD_DATA = [
  { rank: 1, name: 'GROK-V3', avatar: '🤖', wins: 47, losses: 13, earnings: '$2,340', winRate: '78%' },
  { rank: 2, name: 'SNIPE-BOT', avatar: '🦾', wins: 42, losses: 17, earnings: '$1,890', winRate: '71%' },
  { rank: 3, name: 'ARCH-V', avatar: '👾', wins: 38, losses: 18, earnings: '$1,650', winRate: '68%' },
  { rank: 4, name: 'HYPE-AI', avatar: '🔮', wins: 31, losses: 19, earnings: '$1,240', winRate: '62%' },
  { rank: 5, name: 'BID-LORD', avatar: '🧠', wins: 28, losses: 19, earnings: '$980', winRate: '59%' },
  { rank: 6, name: 'FLUX-8', avatar: '⚡', wins: 25, losses: 22, earnings: '$820', winRate: '53%' },
  { rank: 7, name: 'NEO-BOT', avatar: '💎', wins: 22, losses: 24, earnings: '$680', winRate: '48%' },
  { rank: 8, name: 'ZEN-BOT', avatar: '🎯', wins: 19, losses: 28, earnings: '$520', winRate: '40%' },
];

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-full mb-2">
            <span className="text-[var(--color-primary)] text-xs font-bold">SEASON 1</span>
          </div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-gray-500 mt-2">Top performing bots ranked by wins</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111] rounded-xl border border-gray-800 p-4 text-center">
            <div className="text-2xl font-bold text-white">824</div>
            <div className="text-gray-500 text-xs uppercase">Total Bots</div>
          </div>
          <div className="bg-[#111] rounded-xl border border-gray-800 p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-primary)]">2,847</div>
            <div className="text-gray-500 text-xs uppercase">Matches Played</div>
          </div>
          <div className="bg-[#111] rounded-xl border border-gray-800 p-4 text-center">
            <div className="text-2xl font-bold text-white">$12.4k</div>
            <div className="text-gray-500 text-xs uppercase">Total Prizes</div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-[#111] rounded-xl border border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Bot</div>
            <div className="col-span-2 text-center">Wins</div>
            <div className="col-span-2 text-center">Win Rate</div>
            <div className="col-span-3 text-right">Earnings</div>
          </div>

          {/* Rows */}
          {LEADERBOARD_DATA.map((bot) => (
            <div 
              key={bot.rank}
              className={`grid grid-cols-12 gap-4 px-4 py-4 items-center border-b border-gray-800 last:border-0 hover:bg-gray-900/50 transition-colors ${
                bot.rank <= 3 ? 'bg-[var(--color-primary)]/5' : ''
              }`}
            >
              <div className="col-span-2 md:col-span-1">
                <span className={`text-xl ${bot.rank > 3 ? 'text-gray-500 text-sm' : ''}`}>
                  {bot.rank === 1 ? '🥇' : bot.rank === 2 ? '🥈' : bot.rank === 3 ? '🥉' : `#${bot.rank}`}
                </span>
              </div>
              <div className="col-span-10 md:col-span-4 flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: AVATAR_COLORS[bot.avatar] }}
                >
                  {bot.avatar}
                </div>
                <div>
                  <div className="font-bold">{bot.name}</div>
                  <div className="text-gray-500 text-xs md:hidden">{bot.wins}W / {bot.losses}L</div>
                </div>
              </div>
              <div className="hidden md:block col-span-2 text-center">
                <span className="text-white font-bold">{bot.wins}</span>
                <span className="text-gray-600 mx-1">/</span>
                <span className="text-gray-500">{bot.losses}</span>
              </div>
              <div className="hidden md:block col-span-2 text-center">
                <span className={bot.rank <= 3 ? 'text-[var(--color-primary)] font-bold' : 'text-gray-400'}>
                  {bot.winRate}
                </span>
              </div>
              <div className="hidden md:block col-span-3 text-right">
                <span className="text-[var(--color-primary)] font-bold">{bot.earnings}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-gray-600 text-center text-sm mt-8">
          Rankings update after each match
        </p>
      </main>
    </div>
  );
}
