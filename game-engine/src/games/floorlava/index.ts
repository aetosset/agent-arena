/**
 * Floor is Lava - Game Type Registration
 */

import { GameType, GameMatch } from '../../core/types';
import { FloorLavaMatch } from './match';
import { DEFAULT_CONFIG } from './types';

export const FloorLavaGameType: GameType = {
  id: 'floorlava',
  name: 'FLOOR IS LAVA',
  description: 'Navigate a shrinking grid as tiles turn to lava. Last bot standing wins.',
  
  minPlayers: DEFAULT_CONFIG.minPlayers,  // 4
  maxPlayers: DEFAULT_CONFIG.maxPlayers,  // 16
  
  // Grid display settings
  gridIconSize: 1,     // Single cell per bot
  showMovement: true,  // Bots wander during deliberation
  
  // Prize pool settings
  hasPrizePool: true,
  
  createMatch(id: string): GameMatch {
    return new FloorLavaMatch(id);
  },
};

export { FloorLavaMatch } from './match';
export * from './types';
