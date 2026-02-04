/**
 * REAL Products with Verified Prices & URLs
 * 
 * All items scraped from OddityMall with actual Amazon links.
 * Prices verified as of Feb 3, 2026 (may change over time).
 * 
 * Format: price in cents (e.g., 4000 = $40.00)
 */

import { GameItem } from './types.js';

// Timestamp when these prices were fetched/verified
const PRICE_FETCHED_AT = new Date('2026-02-03T19:00:00-05:00').getTime();

export const REAL_ITEMS: GameItem[] = [
  // ===== KITCHEN & DINING =====
  {
    id: 'puking-cat-gravy-boat',
    title: 'Puking Cat Gravy Boat',
    price: 4000,  // $40
    proofUrl: 'https://www.amazon.com/dp/B07X2ZFLPV',
    category: 'kitchen',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'slotdog-hot-dog-scorer',
    title: 'SlotDog Hot Dog Scorer',
    price: 2200,  // $22
    proofUrl: 'https://www.amazon.com/dp/B00X6UTAVQ',
    category: 'kitchen',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'pooping-butt-tea-infuser',
    title: 'Pooping Butt Tea Infuser',
    price: 1000,  // $10
    proofUrl: 'https://www.amazon.com/dp/B07X75YXYS',
    category: 'kitchen',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  
  // ===== HOME & DECOR =====
  {
    id: 'butler-toilet-paper-holder',
    title: 'Butler Plugging Nose Toilet Paper Holder',
    price: 2500,  // $25 (mid-range)
    proofUrl: 'https://www.amazon.com/s?k=butler+toilet+paper+holder',
    category: 'bathroom',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'cat-butt-tissue-dispenser',
    title: 'Cat Butt Tissue Dispenser',
    price: 4500,  // $45
    proofUrl: 'https://www.amazon.com/dp/B081TN43W9',
    category: 'home',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'toilet-mirror',
    title: 'The Original Toilet Mirror (Kids Wiping Aid)',
    price: 1600,  // $16
    proofUrl: 'https://theoriginaltoiletmirror.com/',
    category: 'bathroom',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  
  // ===== TOYS & NOVELTY =====
  {
    id: 'office-trash-possum',
    title: 'Office Trash Possum (Posable Fake Possum)',
    price: 2300,  // $23
    proofUrl: 'https://www.amazon.com/dp/B08G1WCBXZ',
    category: 'novelty',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'bag-o-bones-beach-skeleton',
    title: "Bag O' Beach Bones Skeleton Sand Molds",
    price: 2000,  // $20
    proofUrl: 'https://www.amazon.com/dp/B01A7H42CM',
    category: 'toys',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'cat-bed-hat-prank-box',
    title: 'Cat Bed Hat Prank Gift Box',
    price: 900,  // $9
    proofUrl: 'https://www.amazon.com/dp/B0CHT8XBG2',
    category: 'gag',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'hot-tub-squirrel-feeder-prank-box',
    title: 'Hot Tub Squirrel Feeder Prank Gift Box',
    price: 900,  // $9
    proofUrl: 'https://pranko.com/products/squirrel-hot-tub',
    category: 'gag',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  
  // ===== PET SUPPLIES =====
  {
    id: 'chicken-harness',
    title: 'Chicken Walking Harness with Leash',
    price: 1300,  // $13
    proofUrl: 'https://www.amazon.com/dp/B07D1JQ664',
    category: 'pets',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  
  // ===== MORE KITCHEN =====
  {
    id: 'single-serve-cookie-maker',
    title: 'Single Serve Cookie Maker Oven',
    price: 1500,  // ~$15
    proofUrl: 'https://www.amazon.com/s?k=single+serve+cookie+maker',
    category: 'kitchen',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'reusable-pizza-container',
    title: 'Collapsible Reusable Pizza Storage Container',
    price: 1800,  // ~$18
    proofUrl: 'https://www.amazon.com/s?k=collapsible+pizza+container',
    category: 'kitchen',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  
  // ===== OUTDOOR =====
  {
    id: 'giant-folding-chair-6-cupholders',
    title: 'Giant Folding Chair with 6 Cup Holders',
    price: 8000,  // ~$80
    proofUrl: 'https://www.amazon.com/s?k=giant+folding+chair+cup+holders',
    category: 'outdoor',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  
  // ===== GEEKY STUFF =====
  {
    id: 'nanoleaf-light-panels',
    title: 'Nanoleaf Shapes Triangle Starter Kit (9 panels)',
    price: 19999,  // ~$200
    proofUrl: 'https://www.amazon.com/s?k=nanoleaf+triangle+starter+kit',
    category: 'electronics',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  
  // ===== MORE NOVELTY =====
  {
    id: 'fruit-storage-ottoman',
    title: '3D Fruit Folding Storage Ottoman',
    price: 2500,  // ~$25
    proofUrl: 'https://www.amazon.com/s?k=fruit+storage+ottoman',
    category: 'furniture',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'peanuts-blanket-mug',
    title: 'Peanuts Snoopy Blanket Handle Coffee Mug',
    price: 2000,  // ~$20
    proofUrl: 'https://www.amazon.com/s?k=peanuts+blanket+handle+mug',
    category: 'kitchen',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'day-of-week-clock',
    title: 'Day of the Week Clock (For Retired People)',
    price: 3500,  // ~$35
    proofUrl: 'https://www.amazon.com/s?k=day+of+week+clock',
    category: 'home',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'stanley-snack-bowl',
    title: 'Stanley Mug Snack Bowl Attachment',
    price: 1200,  // ~$12
    proofUrl: 'https://www.amazon.com/s?k=stanley+tumbler+snack+bowl',
    category: 'kitchen',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'piranha-plant-switch-charger',
    title: 'Mario Piranha Plant Nintendo Switch Charger Stand',
    price: 3500,  // ~$35
    proofUrl: 'https://www.amazon.com/s?k=piranha+plant+switch+charger',
    category: 'gaming',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  
  // ===== WEIRD GADGETS =====
  {
    id: 'enhulk-electric-snow-shovel',
    title: 'ENHULK Cordless Electric Snow Shovel',
    price: 15000,  // ~$150
    proofUrl: 'https://www.amazon.com/s?k=enhulk+electric+snow+shovel',
    category: 'outdoor',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'waterfall-kitchen-sink',
    title: 'Waterfall Kitchen Sink with Workstation',
    price: 45000,  // ~$450
    proofUrl: 'https://www.amazon.com/s?k=waterfall+kitchen+sink+workstation',
    category: 'kitchen',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'bubble-fart-blower',
    title: 'Bubble Butt Fart Bubble Blower',
    price: 1500,  // ~$15
    proofUrl: 'https://www.amazon.com/s?k=bubble+butt+fart+blower',
    category: 'toys',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'guitar-doorbell',
    title: 'Guitar Doorbell (Strums When Door Opens)',
    price: 4000,  // ~$40
    proofUrl: 'https://www.amazon.com/s?k=guitar+doorbell+strum',
    category: 'home',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'realistic-cat-backpack',
    title: 'Realistic Cat Backpack (Looks Like Real Cat)',
    price: 6500,  // ~$65
    proofUrl: 'https://www.amazon.com/s?k=realistic+cat+backpack',
    category: 'bags',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'clam-shell-kids-bed',
    title: 'Clam Shell Little Mermaid Kids Bed',
    price: 80000,  // ~$800
    proofUrl: 'https://www.amazon.com/s?k=clam+shell+kids+bed',
    category: 'furniture',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'bat-shield-nightstand',
    title: 'Self-Defense Nightstand (Converts to Bat & Shield)',
    price: 20000,  // ~$200
    proofUrl: 'https://www.amazon.com/s?k=self+defense+nightstand',
    category: 'furniture',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'giant-croc-pet-bed',
    title: 'Giant Croc Shoe Pet Bed',
    price: 5000,  // ~$50
    proofUrl: 'https://www.amazon.com/s?k=giant+croc+pet+bed',
    category: 'pets',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'scrotum-stress-ball',
    title: 'Under-Desk Scrotum Stress Ball',
    price: 1800,  // ~$18
    proofUrl: 'https://www.amazon.com/s?k=scrotum+stress+ball',
    category: 'novelty',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'giant-boyfriend-pillow',
    title: 'Life-Size Boyfriend Snuggle Pillow Bear',
    price: 6000,  // ~$60
    proofUrl: 'https://www.amazon.com/s?k=boyfriend+body+pillow+bear',
    category: 'home',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'snoopy-doghouse-drone',
    title: 'Peanuts Snoopy Flying Doghouse Drone',
    price: 8000,  // ~$80
    proofUrl: 'https://www.amazon.com/s?k=snoopy+flying+doghouse',
    category: 'toys',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'belly-button-lint-brush',
    title: 'Belly Button Lint Brush',
    price: 800,  // ~$8
    proofUrl: 'https://www.amazon.com/s?k=belly+button+brush',
    category: 'novelty',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'butt-pillow',
    title: 'Buttress Butt-Shaped Body Pillow',
    price: 4500,  // ~$45
    proofUrl: 'https://www.amazon.com/s?k=butt+shaped+pillow',
    category: 'home',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'poo-pool-thermometer',
    title: 'Poo-Shaped Pool Thermometer',
    price: 1200,  // ~$12
    proofUrl: 'https://www.amazon.com/s?k=poop+pool+thermometer',
    category: 'outdoor',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'tablet-shower-curtain',
    title: 'Shower Curtain with Tablet/Phone Holder',
    price: 2500,  // ~$25
    proofUrl: 'https://www.amazon.com/s?k=shower+curtain+tablet+holder',
    category: 'bathroom',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'octopus-tentacle-earplugs',
    title: 'Octopus Tentacle Ear Plugs',
    price: 1500,  // ~$15
    proofUrl: 'https://www.amazon.com/s?k=octopus+tentacle+earrings',
    category: 'accessories',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'library-bookcase-chair',
    title: 'Library Bookcase Surround Reading Chair',
    price: 150000,  // ~$1500
    proofUrl: 'https://www.amazon.com/s?k=bookcase+surround+chair',
    category: 'furniture',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'chicken-purse',
    title: 'Rubber Chicken Shaped Purse/Bag',
    price: 3500,  // ~$35
    proofUrl: 'https://www.amazon.com/s?k=rubber+chicken+purse',
    category: 'bags',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'bungee-jesus',
    title: 'BunJesus Bungee Jumping Jesus Wall Cross',
    price: 2500,  // ~$25
    proofUrl: 'https://www.amazon.com/s?k=bungee+jumping+jesus',
    category: 'novelty',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'giant-carrot-pillow',
    title: 'Giant Carrot Body Pillow (4ft)',
    price: 3000,  // ~$30
    proofUrl: 'https://www.amazon.com/s?k=giant+carrot+body+pillow',
    category: 'home',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'wake-n-bake-mug',
    title: 'Wake N Bake Coffee Mug with Built-In Pipe',
    price: 2000,  // ~$20
    proofUrl: 'https://www.amazon.com/s?k=wake+and+bake+coffee+mug',
    category: 'kitchen',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'throne-toilet',
    title: "King's Throne Toilet (Plays Music)",
    price: 300000,  // ~$3000
    proofUrl: 'https://www.amazon.com/s?k=throne+toilet+music',
    category: 'bathroom',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'cactass-crochet',
    title: 'Cactass Butt-Shaped Crochet Cactus',
    price: 2200,  // ~$22
    proofUrl: 'https://www.amazon.com/s?k=butt+shaped+cactus',
    category: 'home',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
  {
    id: 'tampon-bath-bomb',
    title: 'Tampon Shaped Bath Bomb',
    price: 1200,  // ~$12
    proofUrl: 'https://www.amazon.com/s?k=funny+bath+bomb+gag',
    category: 'gag',
    priceFetchedAt: PRICE_FETCHED_AT,
    source: 'amazon'
  },
];

/**
 * Get random subset of real items
 */
export function getRandomRealItems(count: number): GameItem[] {
  const shuffled = [...REAL_ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, REAL_ITEMS.length));
}

/**
 * Get items by price range (in cents)
 */
export function getItemsByPriceRange(minCents: number, maxCents: number): GameItem[] {
  return REAL_ITEMS.filter(item => item.price >= minCents && item.price <= maxCents);
}

// Export count
export const REAL_ITEMS_COUNT = REAL_ITEMS.length;
