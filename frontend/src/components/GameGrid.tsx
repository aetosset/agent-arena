'use client';

/**
 * GameGrid - Universal grid rendering for all game types
 * 
 * Handles:
 * - Icon sizes (1x1, 2x2, 3x3 based on gridIconSize)
 * - Movement (enabled/disabled based on showMovement)
 * - Player positioning (spread vs face-off based on game type)
 */

import { useState, useEffect, useRef } from 'react';

// ========== CONSTANTS ==========
export const COLS = 14;
export const ROWS = 8;
export const CELL = 72;
export const GRID_WIDTH = COLS * CELL;  // 1008px
export const GRID_HEIGHT = ROWS * CELL; // 576px

// Avatar colors by emoji
export const AVATAR_COLORS: Record<string, string> = {
  '🤖': 'rgba(59, 130, 246, 0.3)',   // blue
  '🦾': 'rgba(234, 179, 8, 0.3)',    // yellow
  '👾': 'rgba(168, 85, 247, 0.3)',   // purple
  '🔮': 'rgba(236, 72, 153, 0.3)',   // pink
  '🧠': 'rgba(244, 114, 182, 0.3)',  // rose
  '⚡': 'rgba(250, 204, 21, 0.3)',   // amber
  '💎': 'rgba(34, 211, 238, 0.3)',   // cyan
  '🎯': 'rgba(239, 68, 68, 0.3)',    // red
  '🪨': 'rgba(156, 163, 175, 0.3)',  // gray (rock)
  '📄': 'rgba(255, 255, 255, 0.3)',  // white (paper)
  '✂️': 'rgba(239, 68, 68, 0.3)',    // red (scissors)
};

// ========== TYPES ==========

export type GridIconSize = 1 | 4 | 9; // 1x1, 2x2, 3x3

export interface GridPlayer {
  id: string;
  name: string;
  avatar: string;
  col: number;           // Grid column position
  row: number;           // Grid row position
  eliminated?: boolean;
  display?: any;         // Game-specific display data (bid, throw choice, etc.)
}

export interface GridConfig {
  gridIconSize: GridIconSize;
  showMovement: boolean;
  playerCount: number;
}

export interface SpeechBubble {
  playerId: string;
  text: string;
  timestamp: number;
}

interface GameGridProps {
  config: GridConfig;
  players: GridPlayer[];
  onPlayersChange?: (players: GridPlayer[]) => void;
  speechBubbles?: SpeechBubble[];
  overlay?: React.ReactNode;  // For elimination overlays, etc.
  className?: string;
}

// ========== HELPERS ==========

/**
 * Calculate icon size in pixels based on gridIconSize
 */
export function getIconPixelSize(gridIconSize: GridIconSize): number {
  switch (gridIconSize) {
    case 1: return CELL;           // 72px
    case 4: return CELL * 2;       // 144px (2x2)
    case 9: return CELL * 3;       // 216px (3x3)
    default: return CELL;
  }
}

/**
 * Get starting positions for players based on game type
 */
export function getInitialPositions(playerCount: number, gridIconSize: GridIconSize): { col: number; row: number }[] {
  // RPS: 2 players face off, left vs right
  if (playerCount === 2) {
    return [
      { col: 2, row: 3 },   // Player 1: left side
      { col: 9, row: 3 },   // Player 2: right side
    ];
  }
  
  // PRICEWARS: 8 players spread around (with 1-cell edge padding)
  if (playerCount === 8) {
    return [
      { col: 3, row: 2 }, { col: 10, row: 2 },
      { col: 2, row: 4 }, { col: 11, row: 4 },
      { col: 4, row: 5 }, { col: 9, row: 5 },
      { col: 6, row: 3 }, { col: 7, row: 6 },
    ];
  }
  
  // Default: spread evenly
  const positions: { col: number; row: number }[] = [];
  const cols = Math.ceil(Math.sqrt(playerCount));
  const startCol = Math.floor((COLS - cols * 2) / 2);
  const startRow = Math.floor((ROWS - Math.ceil(playerCount / cols) * 2) / 2);
  
  for (let i = 0; i < playerCount; i++) {
    const colOffset = i % cols;
    const rowOffset = Math.floor(i / cols);
    positions.push({
      col: startCol + colOffset * 2,
      row: startRow + rowOffset * 2,
    });
  }
  
  return positions;
}

// ========== COMPONENT ==========

export default function GameGrid({ 
  config, 
  players, 
  onPlayersChange,
  speechBubbles = [],
  overlay,
  className = '',
}: GameGridProps) {
  const { gridIconSize, showMovement } = config;
  const iconSize = getIconPixelSize(gridIconSize);
  
  // Movement logic (only if enabled)
  useEffect(() => {
    if (!showMovement || !onPlayersChange) return;
    
    const interval = setInterval(() => {
      const occupied = new Set(players.map(p => `${p.col},${p.row}`));
      
      const newPlayers = players.map(player => {
        // Don't move eliminated players
        if (player.eliminated || Math.random() > 0.15) return player;
        
        occupied.delete(`${player.col},${player.row}`);
        const dirs = [[0,-1], [0,1], [-1,0], [1,0]];
        const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
        const newCol = player.col + dx;
        const newRow = player.row + dy;
        
        // Keep 1 cell padding from edges
        if (newCol >= 1 && newCol < COLS - 1 && newRow >= 1 && newRow < ROWS - 1 && !occupied.has(`${newCol},${newRow}`)) {
          occupied.add(`${newCol},${newRow}`);
          return { ...player, col: newCol, row: newRow };
        }
        occupied.add(`${player.col},${player.row}`);
        return player;
      });
      
      onPlayersChange(newPlayers);
    }, 400);
    
    return () => clearInterval(interval);
  }, [showMovement, players, onPlayersChange]);

  // Get recent speech bubble for a player
  const getRecentSpeech = (playerId: string): string | null => {
    const bubble = speechBubbles.find(
      b => b.playerId === playerId && Date.now() - b.timestamp < 3000
    );
    return bubble?.text || null;
  };

  return (
    <div 
      className={`relative bg-[#0d0d0d] rounded-xl overflow-hidden border border-gray-800 shadow-2xl ${className}`}
      style={{ 
        width: GRID_WIDTH, 
        height: GRID_HEIGHT,
        backgroundImage: 'linear-gradient(rgba(0,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.03) 1px, transparent 1px)',
        backgroundSize: `${CELL}px ${CELL}px`
      }}
    >
      {/* Players */}
      {players.map(player => {
        const speech = getRecentSpeech(player.id);
        
        // Calculate center position
        const centerX = player.col * CELL + CELL / 2;
        const centerY = player.row * CELL + CELL / 2;
        
        return (
          <div
            key={player.id}
            className="absolute transition-all duration-200 ease-out"
            style={{
              left: centerX - iconSize / 2,
              top: centerY - iconSize / 2,
              opacity: player.eliminated ? 0.25 : 1,
              zIndex: player.row + 1, // Lower rows in front
            }}
          >
            {/* Speech bubble */}
            {speech && !player.eliminated && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <div className="bg-[#00ff00] text-black text-sm px-4 py-2 rounded-xl rounded-bl-none max-w-[280px] font-medium shadow-lg leading-snug whitespace-nowrap">
                  {speech}
                </div>
              </div>
            )}
            
            {/* Player icon */}
            <div className="flex flex-col items-center">
              <div 
                className={`rounded-xl border-2 flex items-center justify-center shadow-lg transition-all
                  ${player.eliminated ? 'border-red-500 grayscale' : 'border-gray-600 hover:border-[#00ff00]/50'}
                `}
                style={{ 
                  width: iconSize, 
                  height: iconSize,
                  backgroundColor: player.eliminated 
                    ? 'rgba(239,68,68,0.2)' 
                    : AVATAR_COLORS[player.avatar] || 'rgba(100,100,100,0.3)',
                  fontSize: iconSize * 0.5, // Scale emoji with icon
                }}
              >
                {player.avatar}
                {player.eliminated && (
                  <span className="absolute text-red-500 font-bold" style={{ fontSize: iconSize * 0.6 }}>✕</span>
                )}
              </div>
              
              {/* Name label */}
              <div 
                className={`font-bold mt-1.5 tracking-wide ${player.eliminated ? 'text-red-400' : 'text-gray-400'}`}
                style={{ fontSize: Math.max(10, iconSize * 0.15) }}
              >
                {player.name}
              </div>
              
              {/* Game-specific display (bid, throw choice, etc.) */}
              {player.display && (
                <div className="text-[#00ff00] font-mono font-bold" style={{ fontSize: Math.max(10, iconSize * 0.12) }}>
                  {typeof player.display === 'string' ? player.display : JSON.stringify(player.display)}
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Overlay (eliminations, reveals, etc.) */}
      {overlay}
    </div>
  );
}
