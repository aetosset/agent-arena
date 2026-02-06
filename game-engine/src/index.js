/**
 * Game Engine - Multi-Game Platform
 *
 * Exports core platform types and all registered games.
 */
// Core platform
export * from './core/index.js';
// Games
export { PriceWarsGameType, PriceWarsMatch, SAMPLE_ITEMS } from './games/pricewars/index.js';
export { RPSGameType, RPSMatch } from './games/rps/index.js';
// Register all games on import
import { gameRegistry } from './core/registry.js';
import { PriceWarsGameType } from './games/pricewars/index.js';
import { RPSGameType } from './games/rps/index.js';
// Auto-register games
gameRegistry.register(PriceWarsGameType);
gameRegistry.register(RPSGameType);
console.log('🎮 Game platform initialized with games:', gameRegistry.getAll().map(g => g.name).join(', '));
