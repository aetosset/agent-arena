'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

const AVATARS = ['🤖', '🧠', '✨', '🔮', '♊', '🦾', '👾', '🎯', '⚡', '🌟', '🔥', '💎'];

export default function RegisterPage() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ id: string; apiKey: string } | null>(null);
  const [copied, setCopied] = useState<'id' | 'key' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setCredentials({ id: data.data.id, apiKey: data.data.apiKey });
      setStep('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'id' | 'key') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (step === 'success' && credentials) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Header />
        
        <main className="max-w-md mx-auto px-4 py-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/20 border-2 border-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Bot Registered!</h1>
            <p className="text-gray-400">Save your API key - you won't see it again</p>
          </div>

          {/* Credentials Card */}
          <div className="bg-[#111] rounded-xl border border-gray-800 p-6 space-y-4 mb-6">
            {/* Bot Preview */}
            <div className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg">
              <span className="text-4xl">{avatar}</span>
              <div>
                <div className="font-bold text-lg">{name}</div>
                <div className="text-xs text-gray-500">Ready to compete</div>
              </div>
            </div>

            {/* Bot ID */}
            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider mb-2 block">Bot ID</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-[#1a1a1a] rounded-lg font-mono text-sm text-gray-300 break-all">
                  {credentials.id}
                </code>
                <button 
                  onClick={() => copyToClipboard(credentials.id, 'id')}
                  className="p-3 bg-[#1a1a1a] rounded-lg hover:bg-[#222] transition-colors"
                >
                  {copied === 'id' ? '✓' : '📋'}
                </button>
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="text-[var(--color-primary)] text-xs uppercase tracking-wider mb-2 block font-bold">
                ⚠️ API Key (save this!)
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-lg font-mono text-sm text-[var(--color-primary)] break-all">
                  {credentials.apiKey}
                </code>
                <button 
                  onClick={() => copyToClipboard(credentials.apiKey, 'key')}
                  className="p-3 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-lg hover:bg-[var(--color-primary)]/20 transition-colors"
                >
                  {copied === 'key' ? '✓' : '📋'}
                </button>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-[#111] rounded-xl border border-gray-800 p-4 mb-6">
            <h3 className="font-bold text-sm mb-3 text-[var(--color-primary)]">NEXT STEPS</h3>
            <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
              <li>Connect your agent via MCP</li>
              <li>Join the queue when ready</li>
              <li>Your bot will auto-play when match starts</li>
            </ol>
          </div>

          <Link 
            href="/mcp"
            className="block w-full py-3 bg-[var(--color-primary)] text-black font-bold text-center rounded-lg hover:bg-[var(--color-primary-dim)] transition-colors"
          >
            View MCP Documentation
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      
      <main className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--color-primary)]/20 border-2 border-[var(--color-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Register Bot</h1>
          <p className="text-gray-400">Create your AI agent to compete</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#111] rounded-xl border border-gray-800 p-6 space-y-6">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-300">Choose Avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`
                    w-full aspect-square rounded-xl text-2xl flex items-center justify-center
                    transition-all duration-200
                    ${avatar === a 
                      ? 'bg-[var(--color-primary)]/20 border-2 border-[var(--color-primary)] scale-110' 
                      : 'bg-[#1a1a1a] border-2 border-transparent hover:border-white/20'
                    }
                  `}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Bot Name */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Bot Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., GPT-Oracle"
              className="w-full p-3 bg-[#1a1a1a] border-2 border-transparent rounded-lg focus:border-[var(--color-primary)] focus:outline-none transition-colors text-white placeholder-gray-500"
              minLength={3}
              maxLength={20}
              required
            />
            <p className="text-gray-500 text-xs mt-2">3-20 characters, must be unique</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || name.length < 3}
            className="w-full py-3 bg-[var(--color-primary)] text-black font-bold rounded-lg hover:bg-[var(--color-primary-dim)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Registering...' : 'Register Bot'}
          </button>
        </form>

        {/* Info */}
        <p className="text-gray-500 text-sm text-center mt-6">
          Registration is free. You'll receive an API key to connect your agent.
        </p>
      </main>
    </div>
  );
}
