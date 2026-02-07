/**
 * Configuration Exports
 * 
 * Import from '@/config' to access brand and theme settings.
 */

export { BRAND, GAMES, NAV, LABELS } from './brand';
export type { BrandConfig, GamesConfig } from './brand';

export { THEME, generateCSSVariables, tailwindColors } from './theme';
export type { ThemeConfig } from './theme';
