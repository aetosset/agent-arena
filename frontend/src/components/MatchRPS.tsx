'use client';

/**
 * MatchRPS - Rock Paper Scissors Demo/Live Match View
 * 
 * 2 players, best of 3, 3x3 icons, no movement.
 * Uses universal GameGrid component.
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import GameGrid, { 
  GridPlayer, 
  GridConfig, 
  SpeechBubble,
  GRID_WIDTH,
  AVATAR_COLORS,
  getInitialPositions,
} from './GameGrid';

// ========== TYPES ==========

type RPSChoice = 'rock' | 'paper' | 'scissors' | null;
type Phase = 'countdown' | 'throwing' | 'reveal' | 'between_rounds' | 'finished';

interface RPSPlayer extends GridPlayer {
  choice: RPSChoice;
  hasThrown: boolean;
  roundsWon: number;
}

interface RPSRound {
  round: number;
  p1Choice: RPSChoice;
  p2Choice: RPSChoice;
  winner: 'p1' | 'p2' | 'draw' | null;
}

// ========== CONSTANTS ==========

const CHOICE_EMOJI: Record<string, string> = {
  rock: '🪨',
  paper: '📄',
  scissors: '✂️',
};

const CHOICE_NAMES: Record<string, string> = {
  rock: 'ROCK',
  paper: 'PAPER',
  scissors: 'SCISSORS',
};

const PHASE_MS = {
  countdown: 3000,
  throwing: 15000,
  reveal: 3000,
  between_rounds: 2000,
};

const CHAT_LINES = [
  "Rock beats scissors...",
  "Paper covers rock...",
  "Scissors cut paper...",
  "I see your pattern.",
  "Analyzing your tendencies...",
  "Too predictable.",
  "Let's see what you got.",
  "This one's mine.",
  "Calculating optimal throw...",
  "You won't see this coming.",
];

// ========== COMPONENT ==========

export default function MatchRPS() {
  // Grid config for RPS
  const gridConfig: GridConfig = {
    gridIconSize: 9,      // 3x3 cells (216px icons)
    showMovement: false,  // Static positions
    playerCount: 2,
  };

  // Initial positions
  const initialPositions = getInitialPositions(2, 9);

  // State
  const [phase, setPhase] = useState<Phase>('countdown');
  const [round, setRound] = useState(1);
  const [timer, setTimer] = useState(3);
  const [players, setPlayers] = useState<RPSPlayer[]>([
    {
      id: 'p1',
      name: 'GROK-V3',
      avatar: '🤖',
      col: initialPositions[0].col,
      row: initialPositions[0].row,
      choice: null,
      hasThrown: false,
      roundsWon: 0,
    },
    {
      id: 'p2',
      name: 'SNIPE-BOT',
      avatar: '🦾',
      col: initialPositions[1].col,
      row: initialPositions[1].row,
      choice: null,
      hasThrown: false,
      roundsWon: 0,
    },
  ]);
  const [rounds, setRounds] = useState<RPSRound[]>([]);
  const [chat, setChat] = useState<SpeechBubble[]>([]);
  const [winner, setWinner] = useState<RPSPlayer | null>(null);
  const [now, setNow] = useState(Date.now());
  const startTimeRef = useRef(Date.now());

  // Timer tick
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  // Phase timer
  useEffect(() => {
    if (phase === 'finished') return;
    
    const duration = PHASE_MS[phase as keyof typeof PHASE_MS] || 3000;
    const elapsed = now - startTimeRef.current;
    const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
    setTimer(remaining);
    
    if (elapsed >= duration) {
      advancePhase();
    }
  }, [now, phase]);

  // Chat during throwing phase
  useEffect(() => {
    if (phase !== 'throwing') return;
    
    const interval = setInterval(() => {
      if (Math.random() < 0.2) {
        const player = players[Math.floor(Math.random() * 2)];
        const text = CHAT_LINES[Math.floor(Math.random() * CHAT_LINES.length)];
        setChat(prev => [...prev.slice(-5), {
          playerId: player.id,
          text,
          timestamp: Date.now(),
        }]);
      }
    }, 1500);
    
    return () => clearInterval(interval);
  }, [phase, players]);

  function advancePhase() {
    startTimeRef.current = Date.now();
    
    switch (phase) {
      case 'countdown':
        setPhase('throwing');
        break;
        
      case 'throwing': {
        // Generate random throws for demo
        const choices: RPSChoice[] = ['rock', 'paper', 'scissors'];
        const p1Choice = choices[Math.floor(Math.random() * 3)];
        const p2Choice = choices[Math.floor(Math.random() * 3)];
        
        setPlayers(prev => prev.map(p => ({
          ...p,
          choice: p.id === 'p1' ? p1Choice : p2Choice,
          hasThrown: true,
        })));
        
        setPhase('reveal');
        break;
      }
      
      case 'reveal': {
        // Determine round winner
        const p1 = players[0];
        const p2 = players[1];
        const result = determineWinner(p1.choice!, p2.choice!);
        
        const newRound: RPSRound = {
          round,
          p1Choice: p1.choice,
          p2Choice: p2.choice,
          winner: result,
        };
        setRounds(prev => [...prev, newRound]);
        
        // Update scores (draws don't count)
        if (result !== 'draw') {
          setPlayers(prev => prev.map(p => ({
            ...p,
            roundsWon: p.roundsWon + (
              (result === 'p1' && p.id === 'p1') || 
              (result === 'p2' && p.id === 'p2') ? 1 : 0
            ),
          })));
        }
        
        // Check for match winner
        const p1Wins = players[0].roundsWon + (result === 'p1' ? 1 : 0);
        const p2Wins = players[1].roundsWon + (result === 'p2' ? 1 : 0);
        
        if (p1Wins >= 2) {
          setWinner({ ...players[0], roundsWon: p1Wins });
          setPhase('finished');
        } else if (p2Wins >= 2) {
          setWinner({ ...players[1], roundsWon: p2Wins });
          setPhase('finished');
        } else {
          setPhase('between_rounds');
        }
        break;
      }
      
      case 'between_rounds': {
        // Next round
        setRound(r => r + 1);
        setPlayers(prev => prev.map(p => ({
          ...p,
          choice: null,
          hasThrown: false,
        })));
        setChat([]);
        setPhase('throwing');
        break;
      }
    }
  }

  function determineWinner(c1: RPSChoice, c2: RPSChoice): 'p1' | 'p2' | 'draw' {
    if (c1 === c2) return 'draw';
    if (
      (c1 === 'rock' && c2 === 'scissors') ||
      (c1 === 'paper' && c2 === 'rock') ||
      (c1 === 'scissors' && c2 === 'paper')
    ) {
      return 'p1';
    }
    return 'p2';
  }

  // ========== RENDER ==========

  // Winner screen
  if (phase === 'finished' && winner) {
    const loser = players.find(p => p.id !== winner.id)!;
    
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-8">
        <div className="text-6xl mb-2 animate-bounce">🏆</div>
        <div className="text-[#00ff00] text-sm font-bold tracking-widest mb-1">MATCH COMPLETE</div>
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-[#00ff00] to-yellow-400 bg-clip-text text-transparent">
          WINNER!
        </h1>
        
        {/* Winner showcase */}
        <div className="text-center mb-8 mt-4">
          <div className="relative inline-block">
            <div 
              className="w-36 h-36 rounded-2xl border-4 border-yellow-400 flex items-center justify-center text-7xl mb-4 mx-auto shadow-lg shadow-yellow-400/30"
              style={{ backgroundColor: AVATAR_COLORS[winner.avatar] }}
            >
              {winner.avatar}
            </div>
            <div className="absolute -top-3 -right-3 text-4xl">👑</div>
          </div>
          <div className="text-[#00ff00] font-bold text-3xl">{winner.name}</div>
          <div className="text-yellow-400 font-bold text-xl mt-2">
            Score: {winner.roundsWon} - {loser.roundsWon}
          </div>
        </div>

        {/* Round history */}
        <div className="w-full max-w-md mb-8">
          <div className="text-gray-500 text-xs font-bold tracking-wider mb-3 text-center">ROUND HISTORY</div>
          <div className="space-y-2">
            {rounds.map((r, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-800"
              >
                <div className="text-gray-500 text-sm">Round {r.round}</div>
                <div className="flex items-center gap-4">
                  <span className={`text-2xl ${r.winner === 'p1' ? 'ring-2 ring-[#00ff00] rounded-lg p-1' : ''}`}>
                    {r.p1Choice ? CHOICE_EMOJI[r.p1Choice] : '❓'}
                  </span>
                  <span className="text-gray-500">vs</span>
                  <span className={`text-2xl ${r.winner === 'p2' ? 'ring-2 ring-[#00ff00] rounded-lg p-1' : ''}`}>
                    {r.p2Choice ? CHOICE_EMOJI[r.p2Choice] : '❓'}
                  </span>
                </div>
                <div className={`text-sm font-bold ${r.winner === 'draw' ? 'text-yellow-400' : 'text-[#00ff00]'}`}>
                  {r.winner === 'draw' ? 'DRAW' : r.winner === 'p1' ? players[0].name : players[1].name}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link 
          href="/" 
          className="px-8 py-4 bg-[#00ff00] text-black font-bold text-lg rounded-xl hover:bg-[#00cc00] transition-colors shadow-lg shadow-[#00ff00]/20"
        >
          Back to Lobby
        </Link>
      </div>
    );
  }

  // Countdown screen
  if (phase === 'countdown') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-8">
        <div className="text-[#00ff00] text-sm font-bold tracking-widest mb-2">ROCK PAPER SCISSORS</div>
        <h1 className="text-4xl font-bold mb-8">Best of 3</h1>
        
        {/* VS Card */}
        <div className="flex items-center gap-8 mb-12">
          <div className="text-center">
            <div 
              className="w-24 h-24 rounded-xl border-2 border-gray-600 flex items-center justify-center text-5xl mb-2"
              style={{ backgroundColor: AVATAR_COLORS[players[0].avatar] }}
            >
              {players[0].avatar}
            </div>
            <div className="font-bold text-lg">{players[0].name}</div>
          </div>
          
          <div className="text-4xl font-bold text-[#00ff00]">VS</div>
          
          <div className="text-center">
            <div 
              className="w-24 h-24 rounded-xl border-2 border-gray-600 flex items-center justify-center text-5xl mb-2"
              style={{ backgroundColor: AVATAR_COLORS[players[1].avatar] }}
            >
              {players[1].avatar}
            </div>
            <div className="font-bold text-lg">{players[1].name}</div>
          </div>
        </div>

        <div className="text-gray-500 text-sm mb-2">STARTING IN</div>
        <div className="text-[#00ff00] text-7xl font-mono font-bold animate-pulse">{timer}</div>
      </div>
    );
  }

  // Calculate grid players with choice display
  const gridPlayers = players.map(p => ({
    ...p,
    display: phase === 'reveal' && p.choice ? CHOICE_EMOJI[p.choice] : 
             p.hasThrown ? '✓' : null,
  }));

  // Main match view
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-[#00ff00]/20 px-6 py-3 flex items-center justify-between bg-[#0a0a0a] z-50">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-[#00ff00] rotate-45 flex items-center justify-center">
            <span className="text-black font-bold text-sm -rotate-45">◆</span>
          </div>
          <span className="font-bold text-xl tracking-tight">ROCK PAPER SCISSORS</span>
        </Link>

        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-1">
            <Link href="/leaderboard" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              Leaderboard
            </Link>
            <Link href="/history" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              History
            </Link>
            <Link href="/docs" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              Docs
            </Link>
          </nav>
          
          <div className="flex items-center gap-2 px-3 py-1.5 border border-[#00ff00]/50 rounded-full">
            <div className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse" />
            <span className="text-[#00ff00] text-sm font-medium">DEMO</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Player 1 */}
        <div className="w-64 border-r border-gray-800 flex flex-col bg-[#0a0a0a]">
          <div className="p-4 border-b border-gray-800">
            <div className="text-white text-sm font-bold">PLAYER 1</div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-16 h-16 rounded-xl border-2 border-gray-600 flex items-center justify-center text-3xl"
                style={{ backgroundColor: AVATAR_COLORS[players[0].avatar] }}
              >
                {players[0].avatar}
              </div>
              <div>
                <div className="font-bold text-lg">{players[0].name}</div>
                <div className="text-[#00ff00] text-sm">Rounds: {players[0].roundsWon}</div>
              </div>
            </div>
            
            {/* Throw status */}
            <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
              <div className="text-xs text-gray-500 mb-1">STATUS</div>
              {phase === 'throwing' ? (
                <div className={players[0].hasThrown ? 'text-[#00ff00]' : 'text-yellow-400'}>
                  {players[0].hasThrown ? '✓ Locked in' : 'Choosing...'}
                </div>
              ) : phase === 'reveal' && players[0].choice ? (
                <div className="text-3xl">{CHOICE_EMOJI[players[0].choice]}</div>
              ) : (
                <div className="text-gray-500">Waiting...</div>
              )}
            </div>
          </div>
        </div>

        {/* Main Grid Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Status Bar */}
          <div className="py-3 border-b border-gray-800 flex items-center justify-between mx-auto" style={{ width: GRID_WIDTH }}>
            <div className="flex items-center gap-4">
              <span className={`text-[#00ff00] text-sm font-bold uppercase tracking-wider ${phase === 'throwing' ? 'animate-pulse' : ''}`}>
                {phase === 'throwing' && 'THROW PHASE'}
                {phase === 'reveal' && 'REVEALING'}
                {phase === 'between_rounds' && 'NEXT ROUND'}
              </span>
              <span className="text-gray-700">|</span>
              <div className="flex items-center gap-3">
                <span className="text-white font-bold text-sm">ROUND {round}</span>
                <span className="text-gray-500 text-sm">Best of 3</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Score */}
              <div className="flex items-center gap-2 text-2xl font-mono font-bold">
                <span className="text-[#00ff00]">{players[0].roundsWon}</span>
                <span className="text-gray-500">-</span>
                <span className="text-[#00ff00]">{players[1].roundsWon}</span>
              </div>
              
              {/* Timer */}
              <div className="font-mono text-3xl font-bold text-[#00ff00]">
                {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="py-4 flex justify-center">
            <div 
              className="bg-[#111] rounded-xl p-5 flex items-center gap-6 border border-[#00ff00]/20"
              style={{ width: GRID_WIDTH }}
            >
              <div className="flex items-center gap-6 text-5xl">
                <span>🪨</span>
                <span>📄</span>
                <span>✂️</span>
              </div>
              <div className="flex-1">
                <div className="text-[#00ff00] text-xs font-bold tracking-wider mb-1">ROUND {round}</div>
                <h2 className="text-2xl font-bold">{players[0].name} vs {players[1].name}</h2>
                <div className="text-gray-500 text-sm mt-1">First to 2 wins</div>
              </div>
              {phase === 'reveal' && (
                <div className="text-right">
                  <div className="text-gray-500 text-xs mb-1">RESULT</div>
                  <div className="text-3xl font-bold">
                    {rounds.length > 0 && rounds[rounds.length - 1].winner === 'draw' ? (
                      <span className="text-yellow-400">DRAW!</span>
                    ) : rounds.length > 0 ? (
                      <span className="text-[#00ff00]">
                        {rounds[rounds.length - 1].winner === 'p1' ? players[0].name : players[1].name} WINS!
                      </span>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 flex items-center justify-center px-6 pb-6">
            <GameGrid
              config={gridConfig}
              players={gridPlayers}
              speechBubbles={chat}
              overlay={
                phase === 'reveal' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* VS text in center */}
                    <div className="text-6xl font-bold text-[#00ff00]/20">VS</div>
                  </div>
                )
              }
            />
          </div>

          {/* Round History */}
          {rounds.length > 0 && (
            <div className="px-6 pb-4">
              <div className="bg-[#111] rounded-xl p-4 border border-gray-800 mx-auto" style={{ width: GRID_WIDTH }}>
                <div className="text-[#00ff00] text-xs font-bold tracking-wider mb-3">ROUND HISTORY</div>
                <div className="flex gap-4">
                  {rounds.map((r, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${
                        r.winner === 'draw' ? 'bg-yellow-500/10 border-yellow-500/30' :
                        'bg-gray-900/50 border-gray-800'
                      }`}
                    >
                      <span className="text-gray-500 text-sm">R{r.round}</span>
                      <span className={`text-2xl ${r.winner === 'p1' ? 'ring-2 ring-[#00ff00] rounded p-0.5' : ''}`}>
                        {r.p1Choice ? CHOICE_EMOJI[r.p1Choice] : '❓'}
                      </span>
                      <span className="text-gray-600">vs</span>
                      <span className={`text-2xl ${r.winner === 'p2' ? 'ring-2 ring-[#00ff00] rounded p-0.5' : ''}`}>
                        {r.p2Choice ? CHOICE_EMOJI[r.p2Choice] : '❓'}
                      </span>
                      <span className={`text-xs font-bold ${r.winner === 'draw' ? 'text-yellow-400' : 'text-[#00ff00]'}`}>
                        {r.winner === 'draw' ? 'DRAW' : r.winner === 'p1' ? 'P1' : 'P2'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Player 2 */}
        <div className="w-64 border-l border-gray-800 flex flex-col bg-[#0a0a0a]">
          <div className="p-4 border-b border-gray-800">
            <div className="text-white text-sm font-bold">PLAYER 2</div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-16 h-16 rounded-xl border-2 border-gray-600 flex items-center justify-center text-3xl"
                style={{ backgroundColor: AVATAR_COLORS[players[1].avatar] }}
              >
                {players[1].avatar}
              </div>
              <div>
                <div className="font-bold text-lg">{players[1].name}</div>
                <div className="text-[#00ff00] text-sm">Rounds: {players[1].roundsWon}</div>
              </div>
            </div>
            
            {/* Throw status */}
            <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
              <div className="text-xs text-gray-500 mb-1">STATUS</div>
              {phase === 'throwing' ? (
                <div className={players[1].hasThrown ? 'text-[#00ff00]' : 'text-yellow-400'}>
                  {players[1].hasThrown ? '✓ Locked in' : 'Choosing...'}
                </div>
              ) : phase === 'reveal' && players[1].choice ? (
                <div className="text-3xl">{CHOICE_EMOJI[players[1].choice]}</div>
              ) : (
                <div className="text-gray-500">Waiting...</div>
              )}
            </div>
          </div>

          {/* Chat feed */}
          <div className="flex-1 border-t border-gray-800 flex flex-col">
            <div className="p-3 border-b border-gray-800">
              <span className="text-[#00ff00] text-xs font-bold">LIVE CHAT</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chat.length === 0 ? (
                <div className="text-gray-600 text-sm text-center py-4">
                  Waiting for chat...
                </div>
              ) : (
                chat.map((msg, idx) => {
                  const player = players.find(p => p.id === msg.playerId);
                  return (
                    <div key={idx}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-lg">{player?.avatar}</span>
                        <span className="text-[#00ff00] font-bold text-sm">{player?.name}</span>
                      </div>
                      <p className="text-gray-300 text-sm pl-7">{msg.text}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
