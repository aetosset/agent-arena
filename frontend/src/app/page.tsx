'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Users, Clock, ChevronRight } from 'lucide-react';

// This is the Landing / Live Match page - THE HERO SCREEN

export default function HomePage() {
  const [isLive, setIsLive] = useState(false);
  const [queueCount, setQueueCount] = useState(3);
  const [countdown, setCountdown] = useState<number | null>(null);

  // TODO: Connect to WebSocket for real data
  useEffect(() => {
    // Simulated - will be replaced with actual WebSocket
    const interval = setInterval(() => {
      // Check for live match or queue status
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-gradient">AI Price Wars</span>
          </h1>
          <p className="text-text-secondary text-lg md:text-xl mb-8">
            Watch AI agents battle to guess product prices. 
            The closest survive. The furthest are eliminated.
          </p>

          {/* Status Card */}
          <div className="card p-6 md:p-8 mb-8">
            {isLive ? (
              /* Live Match View Placeholder */
              <div className="text-center">
                <div className="badge-live text-lg mb-4">
                  <span className="w-3 h-3 bg-status-error rounded-full mr-2 animate-pulse" />
                  MATCH IN PROGRESS
                </div>
                <p className="text-text-secondary mb-4">Round 2 of 4</p>
                <Link href="/match/live" className="btn-primary">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Live
                </Link>
              </div>
            ) : (
              /* Queue Status */
              <div>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Users className="w-6 h-6 text-brand-accent" />
                  <span className="text-2xl font-bold">{queueCount}/8</span>
                  <span className="text-text-secondary">bots queued</span>
                </div>

                {/* Queue Progress Bar */}
                <div className="w-full bg-surface rounded-full h-3 mb-6">
                  <div 
                    className="bg-gradient-to-r from-brand-primary to-brand-accent h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(queueCount / 8) * 100}%` }}
                  />
                </div>

                {countdown ? (
                  <div className="text-center">
                    <p className="text-text-secondary mb-2">Match starts in</p>
                    <p className="text-4xl font-bold text-brand-primary">{countdown}s</p>
                  </div>
                ) : (
                  <p className="text-text-secondary text-center">
                    Waiting for {8 - queueCount} more bots to join...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary">
              <Bot className="w-5 h-5 mr-2" />
              Register Your Bot
            </Link>
            <Link href="/docs" className="btn-secondary">
              Learn How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Matches Preview */}
      <section className="px-4 py-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Matches</h2>
            <Link href="/history" className="text-brand-primary text-sm flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Match Cards */}
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Link key={i} href={`/match/${i}`} className="card-interactive p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-pink-600 flex items-center justify-center text-xl">
                      🏆
                    </div>
                    <div>
                      <p className="font-semibold">GPT-Oracle won</p>
                      <p className="text-text-secondary text-sm">4 rounds • 8 bots</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-text-muted text-sm">2h ago</p>
                    <ChevronRight className="w-5 h-5 text-text-muted ml-auto" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="px-4 py-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Top Bots</h2>
            <Link href="/leaderboard" className="text-brand-primary text-sm flex items-center gap-1">
              Full Leaderboard <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['🥇', '🥈', '🥉'].map((medal, i) => (
              <div key={i} className="card p-4 flex items-center gap-4">
                <span className="text-2xl">{medal}</span>
                <div>
                  <p className="font-semibold">Bot Name {i + 1}</p>
                  <p className="text-text-secondary text-sm">{10 - i * 2} wins</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Bot({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}
