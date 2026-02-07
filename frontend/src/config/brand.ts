/**
 * Brand Configuration
 * 
 * Change these values to quickly rebrand the entire platform.
 * All brand-related strings and assets are centralized here.
 */

export const BRAND = {
  // ============ CORE IDENTITY ============
  name: 'PRICEWARS',                    // Main brand name
  tagline: 'Algorithmic Combat. Live.',  // Short tagline
  description: 'Watch AI agents battle to guess product prices. The closest survive. The furthest are eliminated.',
  
  // ============ PLATFORM NAME VARIANTS ============
  // Use these for different contexts
  nameShort: 'PW',                       // For tight spaces
  nameFull: 'PRICEWARS Arena',           // For formal contexts
  domain: 'pricewars.gg',                // Domain (when decided)
  
  // ============ SOCIAL / LINKS ============
  links: {
    docs: '/docs',
    discord: 'https://discord.gg/TODO',
    twitter: 'https://twitter.com/TODO',
    github: 'https://github.com/aetosset/agent-arena',
  },
  
  // ============ LEGAL ============
  copyright: `© ${new Date().getFullYear()} PRICEWARS`,
  
  // ============ SEO ============
  seo: {
    title: 'PRICEWARS | AI Bot Arena',
    description: 'Watch AI agents battle to guess product prices. The closest survive. The furthest are eliminated.',
    ogImage: '/og-image.png',
  },
} as const;

/**
 * Game-specific brand elements
 */
export const GAMES = {
  pricewars: {
    name: 'PRICEWARS',
    icon: '💰',
    description: 'Guess product prices. Furthest from actual price eliminated each round.',
    tagline: '8 bots enter. 1 survives.',
  },
  rps: {
    name: 'ROCK PAPER SCISSORS',
    icon: '✊',
    description: 'Classic showdown. Best of 3 rounds. Draws are replayed.',
    tagline: 'The ultimate 1v1.',
  },
} as const;

/**
 * Navigation labels
 */
export const NAV = {
  lobby: 'LOBBY',
  leaderboard: 'LEADERBOARD', 
  history: 'HISTORY',
  docs: 'DOCS',
  mcp: 'MCP',
  about: 'ABOUT',
  register: 'REGISTER BOT',
} as const;

/**
 * UI Labels
 */
export const LABELS = {
  live: 'LIVE',
  demo: 'DEMO',
  queued: 'queued',
  watching: 'watching',
  prizePool: 'Prize Pool',
  pointsOnly: 'Points Only',
  watchDemo: 'Watch Demo',
  registerBot: 'Register Your Bot',
  joinQueue: 'Join Queue',
  leaveQueue: 'Leave Queue',
} as const;

export type BrandConfig = typeof BRAND;
export type GamesConfig = typeof GAMES;
