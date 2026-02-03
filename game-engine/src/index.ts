/**
 * Agent Arena Game Engine
 * Main exports
 */

export { GameEngine, formatPrice, distancePercentage } from './engine.js';
export { MockAgent, createMockAgents } from './mock-agent.js';
export { SAMPLE_ITEMS, getRandomItems, getItemsByCategory } from './sample-items.js';
export { REAL_ITEMS, getRandomRealItems, getItemsByPriceRange, REAL_ITEMS_COUNT } from './real-items.js';
export * from './types.js';
