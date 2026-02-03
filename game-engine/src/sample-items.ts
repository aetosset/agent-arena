/**
 * Sample game items for testing
 * Prices in cents (e.g., 9999 = $99.99)
 */

import { GameItem } from './types.js';

export const SAMPLE_ITEMS: GameItem[] = [
  {
    id: 'item-1',
    title: 'Apple AirPods Pro 2nd Gen',
    price: 24999,  // $249.99
    proofUrl: 'https://www.apple.com/shop/product/MQD83AM/A/airpods-pro',
    category: 'electronics'
  },
  {
    id: 'item-2',
    title: 'Nintendo Switch OLED',
    price: 34999,  // $349.99
    proofUrl: 'https://www.nintendo.com/store/products/nintendo-switch-oled-model-white-set/',
    category: 'electronics'
  },
  {
    id: 'item-3',
    title: 'Dyson V15 Detect Vacuum',
    price: 74999,  // $749.99
    proofUrl: 'https://www.dyson.com/vacuum-cleaners/cordless/v15/detect',
    category: 'home'
  },
  {
    id: 'item-4',
    title: 'Rolex Submariner (Retail)',
    price: 1015000,  // $10,150.00
    proofUrl: 'https://www.rolex.com/watches/submariner',
    category: 'luxury'
  },
  {
    id: 'item-5',
    title: 'Tesla Model 3 (Base)',
    price: 4299000,  // $42,990.00
    proofUrl: 'https://www.tesla.com/model3',
    category: 'automotive'
  },
  {
    id: 'item-6',
    title: 'Big Mac Meal',
    price: 1299,  // $12.99
    proofUrl: 'https://www.mcdonalds.com/us/en-us/product/big-mac.html',
    category: 'food'
  },
  {
    id: 'item-7',
    title: 'Starbucks Grande Latte',
    price: 595,  // $5.95
    proofUrl: 'https://www.starbucks.com/menu/product/407/hot',
    category: 'food'
  },
  {
    id: 'item-8',
    title: 'iPhone 15 Pro Max 256GB',
    price: 119900,  // $1,199.00
    proofUrl: 'https://www.apple.com/shop/buy-iphone/iphone-15-pro',
    category: 'electronics'
  },
  {
    id: 'item-9',
    title: 'PS5 Console',
    price: 49999,  // $499.99
    proofUrl: 'https://direct.playstation.com/en-us/ps5',
    category: 'electronics'
  },
  {
    id: 'item-10',
    title: 'Hermes Birkin 25 (Retail)',
    price: 1050000,  // $10,500.00
    proofUrl: 'https://www.hermes.com',
    category: 'luxury'
  }
];

/**
 * Get a random subset of items for a game
 */
export function getRandomItems(count: number): GameItem[] {
  const shuffled = [...SAMPLE_ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get items by category
 */
export function getItemsByCategory(category: string): GameItem[] {
  return SAMPLE_ITEMS.filter(item => item.category === category);
}
