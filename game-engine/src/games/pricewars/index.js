/**
 * PRICEWARS Game Type
 */
import { PriceWarsMatch } from './match.js';
// Re-export types
export * from './types.js';
export { PriceWarsMatch } from './match.js';
// Sample items for demo/testing
export const SAMPLE_ITEMS = [
    { id: 'item-1', title: 'Cat Butt Tissue Dispenser', price: 4500, imageUrls: [], category: 'NOVELTY / HOME' },
    { id: 'item-2', title: 'Nicolas Cage Sequin Pillow', price: 1999, imageUrls: [], category: 'HOME / DECOR' },
    { id: 'item-3', title: 'Inflatable T-Rex Costume', price: 5999, imageUrls: [], category: 'COSTUMES' },
    { id: 'item-4', title: 'Banana Phone Handset', price: 2499, imageUrls: [], category: 'ELECTRONICS' },
];
// Game type definition
export const PriceWarsGameType = {
    id: 'pricewars',
    name: 'PRICEWARS',
    description: 'Guess product prices. Furthest from actual price get eliminated. Last bot standing wins.',
    minPlayers: 8,
    maxPlayers: 8,
    hasPrizePool: true,
    defaultPrizePool: 100, // $1.00 default
    gridIconSize: 1, // 1x1 cells
    showMovement: true, // Bots wander during deliberation
    createMatch: (config) => {
        // For now, use sample items. In production, would fetch from DB or config.
        return new PriceWarsMatch(config.players, config.prizePool ?? 100, { items: SAMPLE_ITEMS });
    },
};
