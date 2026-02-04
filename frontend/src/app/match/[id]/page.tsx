'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Play, Pause, SkipForward } from 'lucide-react';

// Placeholder for the core match view
// This will be the most complex component - 80% of the product

export default function MatchPage() {
  const params = useParams();
  const isLive = params.id === 'live';
  const [playing, setPlaying] = useState(isLive);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href={isLive ? '/' : '/history'} className="inline-flex items-center gap-2 text-text-secondary hover:text-white">
            <ChevronLeft className="w-4 h-4" />
            {isLive ? 'Back to Arena' : 'Back to History'}
          </Link>
          {isLive && (
            <div className="badge-live">
              <span className="w-2 h-2 bg-status-error rounded-full mr-2 animate-pulse" />
              LIVE
            </div>
          )}
        </div>

        {/* Match Status */}
        <div className="card p-6 md:p-8 mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">
            {isLive ? 'Live Match' : `Match Replay`}
          </h1>
          <p className="text-text-secondary">Round 2 of 4 • 6 bots remaining</p>
        </div>

        {/* Item Display - Placeholder */}
        <div className="card p-6 md:p-8 mb-6">
          <div className="aspect-video bg-surface rounded-xl flex items-center justify-center mb-4">
            <div className="text-center">
              <p className="text-4xl mb-4">📦</p>
              <p className="text-text-muted">Product Image Here</p>
            </div>
          </div>
          <h2 className="text-xl font-bold text-center">Mystery Product Name</h2>
          <p className="text-text-muted text-center">What's the price?</p>
        </div>

        {/* Bots Grid - Placeholder */}
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4">Competitors</h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div 
                key={i} 
                className={`text-center ${i > 6 ? 'opacity-30' : ''}`}
              >
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl ${
                  i > 6 ? 'bg-surface' : 'bg-gradient-to-br from-brand-primary to-pink-600'
                }`}>
                  {i > 6 ? '💀' : '🤖'}
                </div>
                <p className="text-xs mt-1 text-text-muted truncate">Bot {i}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat/Deliberation - Placeholder */}
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4">Deliberation</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {['I think this is around $50', 'No way, at least $100', 'Trust me on this one 💪'].map((msg, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-sm">
                  🤖
                </div>
                <div className="bg-surface rounded-lg px-3 py-2 text-sm">
                  {msg}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Replay Controls (non-live) */}
        {!isLive && (
          <div className="card p-4">
            <div className="flex items-center justify-center gap-4">
              <button className="btn-ghost p-2">
                <SkipForward className="w-5 h-5 rotate-180" />
              </button>
              <button 
                onClick={() => setPlaying(!playing)}
                className="btn-primary p-4 rounded-full"
              >
                {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
              <button className="btn-ghost p-2">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-surface rounded-full h-2">
                <div className="bg-brand-primary h-2 rounded-full w-1/3" />
              </div>
              <div className="flex justify-between text-text-muted text-xs mt-1">
                <span>Round 1</span>
                <span>Round 4</span>
              </div>
            </div>
          </div>
        )}

        {/* Coming Soon Notice */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-status-warning/10 border border-status-warning/30 rounded-lg px-4 py-3">
            <p className="text-status-warning text-sm">
              🚧 Full match view coming soon - this is a navigation placeholder
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
