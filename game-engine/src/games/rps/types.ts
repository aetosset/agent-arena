/**
 * Rock Paper Scissors Game Types
 */

export type RPSChoice = 'rock' | 'paper' | 'scissors';

export type RPSPhase = 
  | 'throwing'           // Players picking their throw
  | 'reveal'             // Show both throws
  | 'between_rounds';    // Transition to next round

export interface RPSThrow {
  playerId: string;
  choice: RPSChoice;
  timestamp: number;
}

export interface RPSRound {
  roundNumber: number;
  throws: { [playerId: string]: RPSChoice };
  winner: string | null;   // null = draw
  isDraw: boolean;
  startedAt: number;
  endedAt: number;
}

export interface RPSConfig {
  roundsToWin?: number;           // Default 2 (best of 3)
  throwDurationMs?: number;       // Default 15000
  revealDurationMs?: number;      // Default 3000
  betweenRoundsDurationMs?: number; // Default 2000
}

// Actions
export interface RPSThrowAction {
  type: 'throw';
  choice: RPSChoice;
}

export interface RPSChatAction {
  type: 'chat';
  message: string;
}

export type RPSAction = RPSThrowAction | RPSChatAction;

// Public state for spectators
export interface RPSPublicState {
  phase: RPSPhase;
  currentRound: number;       // Display round (1, 2, 3...)
  roundsToWin: number;
  scores: { [playerId: string]: number };  // Rounds won
  currentThrows: { 
    [playerId: string]: {
      hasThrown: boolean;
      choice: RPSChoice | null;  // Only shown after reveal
    }
  };
  lastRoundWinner: string | null;
  lastRoundDraw: boolean;
  roundEndsAt: number | null;
}

// Helper
export function getWinner(choice1: RPSChoice, choice2: RPSChoice): 'player1' | 'player2' | 'draw' {
  if (choice1 === choice2) return 'draw';
  
  const wins: Record<RPSChoice, RPSChoice> = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper',
  };
  
  return wins[choice1] === choice2 ? 'player1' : 'player2';
}
