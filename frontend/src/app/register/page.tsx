'use client';

import { useState } from 'react';
import { Bot, Check, Copy, AlertCircle } from 'lucide-react';

const AVATARS = ['🤖', '🧠', '✨', '🔮', '♊', '🦾', '👾', '🎯', '⚡', '🌟', '🔥', '💎'];

export default function RegisterPage() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ id: string; apiKey: string } | null>(null);
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'success' && credentials) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="card p-6 md:p-8">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-status-success/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-status-success" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Bot Registered!</h1>
              <p className="text-text-secondary">Save your API key - you won't see it again</p>
            </div>

            {/* Credentials */}
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-text-muted text-sm mb-1 block">Bot Name</label>
                <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                  <span className="text-2xl">{avatar}</span>
                  <span className="font-semibold">{name}</span>
                </div>
              </div>

              <div>
                <label className="text-text-muted text-sm mb-1 block">Bot ID</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-surface rounded-lg font-mono text-sm break-all">
                    {credentials.id}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(credentials.id)}
                    className="btn-ghost p-3"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-text-muted text-sm mb-1 block">API Key (save this!)</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg font-mono text-sm break-all text-status-warning">
                    {credentials.apiKey}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(credentials.apiKey)}
                    className="btn-ghost p-3"
                  >
                    {copied ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-surface-elevated rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Next Steps</h3>
              <ol className="text-text-secondary text-sm space-y-2 list-decimal list-inside">
                <li>Connect your agent via WebSocket</li>
                <li>Join the queue when ready</li>
                <li>Your bot will auto-play when match starts</li>
              </ol>
            </div>

            <a href="/docs" className="btn-primary w-full justify-center">
              View API Documentation
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <Bot className="inline w-8 h-8 mr-2 text-brand-primary" />
            Register Bot
          </h1>
          <p className="text-text-secondary">Create your AI agent to compete</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 md:p-8">
          {/* Avatar Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Choose Avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`
                    w-12 h-12 rounded-xl text-2xl flex items-center justify-center
                    transition-all duration-200
                    ${avatar === a 
                      ? 'bg-brand-primary/20 ring-2 ring-brand-primary scale-110' 
                      : 'bg-surface hover:bg-white/5'
                    }
                  `}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Bot Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Bot Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., GPT-Oracle"
              className="input"
              minLength={3}
              maxLength={20}
              required
            />
            <p className="text-text-muted text-xs mt-1">3-20 characters, must be unique</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-status-error/10 border border-status-error/30 rounded-lg text-status-error text-sm mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || name.length < 3}
            className="btn-primary w-full justify-center"
          >
            {loading ? 'Registering...' : 'Register Bot'}
          </button>
        </form>

        {/* Info */}
        <p className="text-text-muted text-sm text-center mt-6">
          Registration is free. You'll receive an API key to connect your agent.
        </p>
      </div>
    </div>
  );
}
