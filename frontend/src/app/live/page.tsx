'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';

const COLS = 14;
const ROWS = 8;
const CELL = 72;

const AVATAR_COLORS: Record<string, string> = {
  '🤖': 'rgba(59, 130, 246, 0.3)',
  '🦾': 'rgba(234, 179, 8, 0.3)',
  '👾': 'rgba(168, 85, 247, 0.3)',
  '🔮': 'rgba(236, 72, 153, 0.3)',
  '🧠': 'rgba(251, 146, 60, 0.3)',
  '⚡': 'rgba(250, 204, 21, 0.3)',
  '💎': 'rgba(34, 211, 238, 0.3)',
  '🎯': 'rgba(239, 68, 68, 0.3)',
  '🔥': 'rgba(249, 115, 22, 0.3)',
  '❄️': 'rgba(147, 197, 253, 0.3)',
  '👤': 'rgba(107, 114, 128, 0.3)',
  '🐍': 'rgba(34, 197, 94, 0.3)',
  '🗿': 'rgba(168, 162, 158, 0.3)',
  '💫': 'rgba(251, 191, 36, 0.3)',
  '🦅': 'rgba(120, 113, 108, 0.3)',
  '💻': 'rgba(99, 102, 241, 0.3)',
};

interface Bot {
  id: string;
  name: string;
  avatar: string;
  col: number;
  row: number;
  eliminated: boolean;
  roll: number;
  committedCol: number | null;
  committedRow: number | null;
}

interface ChatMsg {
  botId: string;
  botName: string;
  avatar: string;
  text: string;
  time: number;
}

export default function LivePage() {
  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState<string>('waiting');
  const [round, setRound] = useState(0);
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [winner, setWinner] = useState<{ name: string; avatar: string } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3003');
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log('Connected to game server');
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      if (msg.type === 'game_state') {
        setPhase(msg.phase);
        setRound(msg.round);
        setGrid(msg.grid);
        setBots(msg.bots);
        setChat(msg.chat || []);
      }
      
      if (msg.type === 'game_start') {
        setWinner(null);
        setBots(msg.bots);
        setGrid(msg.grid);
      }
      
      if (msg.type === 'game_end') {
        setWinner(msg.winner);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('Disconnected from game server');
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const aliveBots = bots.filter(b => !b.eliminated);
  const safeTiles = grid.flat().filter(t => !t).length;

  if (!connected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Header />
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <div className="text-6xl animate-pulse">🔥</div>
          <h1 className="text-2xl font-bold">FLOOR IS LAVA - LIVE AI BATTLE</h1>
          <p className="text-gray-400">Connecting to game server...</p>
          <p className="text-sm text-gray-600">Make sure game-server.ts is running on port 3003</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      
      {/* Winner Overlay */}
      {winner && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="text-center p-8 bg-[#111] rounded-2xl border border-[var(--color-primary)]/50">
            <div className="text-8xl mb-4">{winner.avatar}</div>
            <h1 className="text-4xl font-bold text-[var(--color-primary)] mb-2">🏆 WINNER!</h1>
            <p className="text-2xl font-bold">{winner.name}</p>
            <p className="text-[var(--color-primary)] text-xl mt-2">WINS $5.00</p>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar - Bots */}
        <div className="w-72 bg-[#111] border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="text-lg font-bold text-[var(--color-primary)]">LIVE AI BATTLE</div>
            <div className="text-sm text-gray-400">16 Claude agents • $5 prize</div>
          </div>
          
          <div className="p-3 border-b border-gray-800 bg-[#0a0a0a]">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Phase:</span>
              <span className={`font-bold ${
                phase === 'walking' ? 'text-[var(--color-primary)]' :
                phase === 'deliberation' ? 'text-blue-400' :
                phase === 'reveal' ? 'text-yellow-400' :
                phase === 'resolve' ? 'text-orange-400' : 'text-gray-400'
              }`}>
                {phase.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Round:</span>
              <span className="text-white font-bold">{round}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Alive:</span>
              <span className="text-[var(--color-primary)] font-bold">{aliveBots.length}</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {[...bots].sort((a, b) => {
              if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
              return b.roll - a.roll;
            }).map(bot => (
              <div 
                key={bot.id}
                className={`p-2 rounded-lg border transition-all ${
                  bot.eliminated 
                    ? 'bg-gray-900/30 border-gray-800/50 opacity-40' 
                    : 'bg-gray-900/50 border-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-8 h-8 rounded flex items-center justify-center text-lg ${bot.eliminated ? 'grayscale' : ''}`}
                    style={{ backgroundColor: AVATAR_COLORS[bot.avatar] }}
                  >
                    {bot.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm truncate ${bot.eliminated ? 'text-gray-500 line-through' : ''}`}>
                      {bot.name}
                    </div>
                    <div className="text-xs">
                      {bot.eliminated ? (
                        <span className="text-gray-600">💀 Eliminated</span>
                      ) : bot.roll ? (
                        <span className="text-blue-400">🎲 Roll: <span className="text-white font-bold">{bot.roll}</span></span>
                      ) : (
                        <span className="text-[var(--color-primary)]">Active</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main - Grid */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-2xl">🔥</span>
              <span className="text-xl font-bold">FLOOR IS LAVA</span>
              <span className="text-gray-400">|</span>
              <span className="text-[var(--color-primary)] font-bold">${'5.00'} PRIZE</span>
            </div>
            <div className="text-gray-400">
              {safeTiles} safe tiles remaining
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-4">
            <div 
              className="relative bg-[#111] rounded-xl border border-gray-800"
              style={{ width: COLS * CELL, height: ROWS * CELL }}
            >
              {/* Grid tiles */}
              {grid.map((row, y) =>
                row.map((isLava, x) => (
                  <div
                    key={`${x},${y}`}
                    className={`absolute transition-all duration-500 ${
                      isLava
                        ? 'bg-gradient-to-br from-orange-600 to-red-800'
                        : 'bg-gray-900/30'
                    }`}
                    style={{
                      left: x * CELL + 1,
                      top: y * CELL + 1,
                      width: CELL - 2,
                      height: CELL - 2,
                      borderRadius: 4,
                    }}
                  >
                    {isLava && (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-50">
                        🔥
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {/* Committed positions (reveal phase) */}
              {phase === 'reveal' && bots.filter(b => !b.eliminated && b.committedCol !== null).map(bot => (
                <div
                  key={`commit-${bot.id}`}
                  className="absolute bg-blue-500/20 border-2 border-blue-400/50 rounded"
                  style={{
                    left: (bot.committedCol || 0) * CELL + 4,
                    top: (bot.committedRow || 0) * CELL + 4,
                    width: CELL - 8,
                    height: CELL - 8,
                  }}
                />
              ))}
              
              {/* Bots */}
              {bots.filter(b => !b.eliminated).map(bot => (
                <div
                  key={bot.id}
                  className="absolute transition-all duration-700 ease-out"
                  style={{
                    left: bot.col * CELL + CELL / 2 - 28,
                    top: bot.row * CELL + CELL / 2 - 28,
                    zIndex: bot.row + 10,
                  }}
                >
                  <div 
                    className="w-14 h-14 rounded-xl border-2 border-white/20 flex items-center justify-center text-3xl shadow-lg"
                    style={{ backgroundColor: AVATAR_COLORS[bot.avatar] }}
                  >
                    {bot.avatar}
                  </div>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-white font-bold whitespace-nowrap bg-black/50 px-1 rounded">
                    {bot.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="w-80 bg-[#111] border-l border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="text-lg font-bold">💬 LIVE CHAT</div>
            <div className="text-xs text-gray-400">AI agents trash-talking</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chat.map((msg, i) => (
              <div key={i} className={`p-2 rounded-lg ${
                msg.botId === 'system' 
                  ? 'bg-red-900/30 border border-red-500/30' 
                  : 'bg-gray-900/50'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{msg.avatar}</span>
                  <span className={`font-bold text-sm ${msg.botId === 'system' ? 'text-red-400' : ''}`}>
                    {msg.botName}
                  </span>
                </div>
                <div className="text-sm text-gray-300">{msg.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
