/**
 * Scrape real products from OddityMall
 * Each article links to actual Amazon products with real prices
 */

const ODDITY_MALL_URLS = [
  'https://odditymall.com/puking-cat-gravy-boat/',
  'https://odditymall.com/toilet-mirror/',
  'https://odditymall.com/hot-tub-squirrel-feeder/',
  'https://odditymall.com/butler-toilet-paper-holder/',
  'https://odditymall.com/cat-bed-hat/',
  'https://odditymall.com/plant-stroller/',
  'https://odditymall.com/slot-dog-hot-dog-scorer/',
  'https://odditymall.com/day-clock/',
  'https://odditymall.com/volkswagen-slow-cookers/',
  'https://odditymall.com/ground-fridge/',
  'https://odditymall.com/bag-o-bones-beach-skeleton/',
  'https://odditymall.com/waterfall-kitchen-sink/',
  'https://odditymall.com/camping-crocs-with-survival-tools/',
  'https://odditymall.com/stuffed-animal-taxidermy/',
  'https://odditymall.com/mario-planters/',
  'https://odditymall.com/single-serve-cookie-maker-oven/',
  'https://odditymall.com/reusable-leftover-pizza-container/',
  'https://odditymall.com/3d-fruit-folding-storage-ottoman/',
  'https://odditymall.com/heavy-equipment-recliners/',
  'https://odditymall.com/backpack-bed/',
  'https://odditymall.com/water-vortex-coffee-tables/',
  'https://odditymall.com/inflatable-pool-bars/',
  'https://odditymall.com/enhulk-cordless-powered-snow-shovel/',
  'https://odditymall.com/grinch-pancake-pan/',
  'https://odditymall.com/stanley-mug-snack-bowl/',
];

interface ScrapedProduct {
  title: string;
  price: number;  // cents
  proofUrl: string;
  sourceUrl: string;
  category?: string;
}

async function scrapeOddityMall(url: string): Promise<ScrapedProduct | null> {
  try {
    const res = await fetch(url);
    const html = await res.text();
    
    // Extract title from URL
    const titleMatch = url.match(/odditymall\.com\/([^\/]+)\/?$/);
    const title = titleMatch ? titleMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown';
    
    // Find Amazon link
    const amazonMatch = html.match(/https:\/\/www\.amazon\.com\/[^\s"'<>]+/);
    const proofUrl = amazonMatch ? amazonMatch[0].split('?')[0] : '';
    
    // Find price in text (look for $XX pattern)
    const priceMatch = html.match(/\$(\d{1,4}(?:\.\d{2})?)\s*(?:bucks?|dollars?)?/i);
    const price = priceMatch ? Math.round(parseFloat(priceMatch[1]) * 100) : 0;
    
    if (!proofUrl || !price) {
      console.log(`Skipping ${title}: no Amazon URL or price found`);
      return null;
    }
    
    return {
      title,
      price,
      proofUrl,
      sourceUrl: url
    };
  } catch (e) {
    console.error(`Error scraping ${url}:`, e);
    return null;
  }
}

async function main() {
  console.log('Scraping products from OddityMall...\n');
  
  const products: ScrapedProduct[] = [];
  
  for (const url of ODDITY_MALL_URLS) {
    const product = await scrapeOddityMall(url);
    if (product) {
      products.push(product);
      console.log(`✓ ${product.title}: $${(product.price / 100).toFixed(2)}`);
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\nScraped ${products.length} products`);
  console.log(JSON.stringify(products, null, 2));
}

main();
