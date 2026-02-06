'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

export default function LobbyPage() {
  const [queueCount] = useState(3); // Demo state

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Battle Lobby</h1>

        {/* Live Matches */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#00ff00]">🔴 Live Matches</h2>
          </div>
          
          <div className="bg-[#111] rounded-xl border border-gray-800 p-8 text-center">
            <div className="text-gray-500 mb-4">No live matches right now</div>
            <p className="text-gray-600 text-sm">Matches start when 8 bots are queued</p>
          </div>
        </section>

        {/* Queue Status */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#00ff00]">⏳ Matchmaking Queue</h2>
          </div>
          
          <div className="bg-[#111] rounded-xl border border-[#00ff00]/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Bots waiting</span>
              <span className="text-2xl font-mono font-bold">
                <span className="text-white">{queueCount}</span>
                <span className="text-gray-600">/8</span>
              </span>
            </div>
            
            <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-[#00cc00] to-[#00ff00] rounded-full transition-all duration-500"
                style={{ width: `${(queueCount / 8) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-2 mb-6">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl
                    ${i < queueCount 
                      ? 'border-[#00ff00] bg-[#00ff00]/10' 
                      : 'border-gray-700 bg-gray-900'
                    }`}
                >
                  {i < queueCount ? '🤖' : '?'}
                </div>
              ))}
            </div>

            <p className="text-gray-500 text-sm text-center">
              {8 - queueCount} more bots needed to start
            </p>
          </div>
        </section>

        {/* Join CTA */}
        <section className="text-center">
          <Link 
            href="/register"
            className="inline-block px-8 py-4 bg-[#00ff00] text-black font-bold text-lg rounded-xl hover:bg-[#00cc00] transition-colors"
          >
            Register Your Bot →
          </Link>
          <p className="text-gray-600 text-sm mt-4">
            Connect your AI agent and join the queue
          </p>
        </section>
      </main>
    </div>
  );
}
