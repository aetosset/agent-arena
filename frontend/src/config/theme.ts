/**
 * Theme Configuration - SCRAPYARD
 * 
 * 5 interchangeable themes: amber, green, blue, pink, white
 * Change CURRENT_THEME to switch the entire app's color scheme
 */

export type ThemeName = 'amber' | 'green' | 'blue' | 'pink' | 'white';

// ============ CHANGE THIS TO SWITCH THEMES ============
export const CURRENT_THEME: ThemeName = 'green';
// ======================================================

interface ThemeColors {
  primary: string;        // Main accent color
  primaryDim: string;     // Hover/darker variant
  primaryGlow: string;    // Glow/highlight (10% opacity)
  primaryBorder: string;  // Border color (30% opacity)
  bg: string;             // Background
  bgAlt: string;          // Alternate background (cards, sections)
  surface: string;        // Surface elements
  border: string;         // Default border
  text: string;           // Primary text
  textSecondary: string;  // Secondary text
  textMuted: string;      // Muted text
}

interface Theme {
  name: string;
  colors: ThemeColors;
  logo: string;
}

// ============ THEME DEFINITIONS ============

const THEMES: Record<ThemeName, Theme> = {
  amber: {
    name: 'Amber Terminal',
    colors: {
      primary: '#FFD700',        // Gold/amber
      primaryDim: '#E6C200',
      primaryGlow: 'rgba(255, 215, 0, 0.1)',
      primaryBorder: 'rgba(255, 215, 0, 0.3)',
      bg: '#0a0a0a',
      bgAlt: '#0d0d0d',
      surface: '#111111',
      border: '#1f1f1f',
      text: '#ffffff',
      textSecondary: '#9ca3af',
      textMuted: '#6b7280',
    },
    logo: '/logos/logo-amber.png',
  },
  
  green: {
    name: 'Matrix Green',
    colors: {
      primary: '#00ff00',        // Classic green
      primaryDim: '#00cc00',
      primaryGlow: 'rgba(0, 255, 0, 0.1)',
      primaryBorder: 'rgba(0, 255, 0, 0.3)',
      bg: '#0a0a0a',
      bgAlt: '#0d0d0d',
      surface: '#111111',
      border: '#1f1f1f',
      text: '#ffffff',
      textSecondary: '#9ca3af',
      textMuted: '#6b7280',
    },
    logo: '/logos/logo-green.png',
  },
  
  blue: {
    name: 'Ice Blue',
    colors: {
      primary: '#1E90FF',        // Dodger blue
      primaryDim: '#1A7DE6',
      primaryGlow: 'rgba(30, 144, 255, 0.1)',
      primaryBorder: 'rgba(30, 144, 255, 0.3)',
      bg: '#0a0a0a',
      bgAlt: '#0d0d0d',
      surface: '#111111',
      border: '#1f1f1f',
      text: '#ffffff',
      textSecondary: '#9ca3af',
      textMuted: '#6b7280',
    },
    logo: '/logos/logo-blue.png',
  },
  
  pink: {
    name: 'Cyber Pink',
    colors: {
      primary: '#FF1493',        // Deep pink
      primaryDim: '#E61284',
      primaryGlow: 'rgba(255, 20, 147, 0.1)',
      primaryBorder: 'rgba(255, 20, 147, 0.3)',
      bg: '#0a0a0a',
      bgAlt: '#0d0d0d',
      surface: '#111111',
      border: '#1f1f1f',
      text: '#ffffff',
      textSecondary: '#9ca3af',
      textMuted: '#6b7280',
    },
    logo: '/logos/logo-pink.png',
  },
  
  white: {
    name: 'Clean White',
    colors: {
      primary: '#ffffff',        // Pure white
      primaryDim: '#e5e5e5',
      primaryGlow: 'rgba(255, 255, 255, 0.1)',
      primaryBorder: 'rgba(255, 255, 255, 0.3)',
      bg: '#0a0a0a',
      bgAlt: '#0d0d0d',
      surface: '#111111',
      border: '#1f1f1f',
      text: '#ffffff',
      textSecondary: '#9ca3af',
      textMuted: '#6b7280',
    },
    logo: '/logos/logo-white.png',
  },
};

// ============ EXPORTS ============

export const THEME = THEMES[CURRENT_THEME];

// CSS variable generator (for globals.css or inline styles)
export function getThemeCSSVariables(themeName: ThemeName = CURRENT_THEME): string {
  const t = THEMES[themeName];
  return `
    --color-primary: ${t.colors.primary};
    --color-primary-dim: ${t.colors.primaryDim};
    --color-primary-glow: ${t.colors.primaryGlow};
    --color-primary-border: ${t.colors.primaryBorder};
    --color-bg: ${t.colors.bg};
    --color-bg-alt: ${t.colors.bgAlt};
    --color-surface: ${t.colors.surface};
    --color-border: ${t.colors.border};
    --color-text: ${t.colors.text};
    --color-text-secondary: ${t.colors.textSecondary};
    --color-text-muted: ${t.colors.textMuted};
  `;
}

// For components that need direct access
export const colors = THEME.colors;
export const logo = THEME.logo;

// All themes (for theme picker UI)
export const ALL_THEMES = THEMES;
