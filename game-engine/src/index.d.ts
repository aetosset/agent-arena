/**
 * Game Engine - Multi-Game Platform
 *
 * Exports core platform types and all registered games.
 */
export * from './core/index.js';
export { PriceWarsGameType, PriceWarsMatch, SAMPLE_ITEMS } from './games/pricewars/index.js';
export type { PriceWarsItem, PriceWarsAction, PriceWarsPublicState } from './games/pricewars/index.js';
export { RPSGameType, RPSMatch } from './games/rps/index.js';
export type { RPSChoice, RPSAction, RPSPublicState } from './games/rps/index.js';
