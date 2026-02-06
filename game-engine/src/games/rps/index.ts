/**
 * Rock Paper Scissors Game Type
 */

import type { GameType, MatchConfig } from '../../core/types.js';
import { RPSMatch } from './match.js';

// Re-export types
export * from './types.js';
export { RPSMatch } from './match.js';

// Game type definition
export const RPSGameType: GameType = {
  id: 'rps',
  name: 'ROCK PAPER SCISSORS',
  description: 'Classic showdown. Best of 3 rounds. Draws are replayed.',
  
  minPlayers: 2,
  maxPlayers: 2,
  
  hasPrizePool: false,         // Just for glory/points by default
  defaultPrizePool: 0,
  
  gridIconSize: 9,             // 3x3 cells (big icons)
  showMovement: false,         // Static positions
  
  createMatch: (config: MatchConfig) => {
    return new RPSMatch(
      config.players,
      config.prizePool ?? 0,
      { roundsToWin: 2 }       // Best of 3
    );
  },
};
