/**
 * Configuration Exports
 * 
 * Import from '@/config' to access brand and theme settings.
 */

export { BRAND, GAMES, NAV, LABELS, SECTIONS } from './brand';
export type { BrandConfig, GamesConfig } from './brand';

export { 
  THEME, 
  CURRENT_THEME,
  colors, 
  logo,
  getThemeCSSVariables,
  ALL_THEMES,
} from './theme';
export type { ThemeName } from './theme';
