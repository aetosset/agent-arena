'use client';

import { useEffect } from 'react';
import { THEME, CURRENT_THEME, colors } from '@/config/theme';

/**
 * ThemeProvider - Injects CSS variables based on current theme
 * 
 * Add this to your layout.tsx to enable theming:
 * <ThemeProvider />
 */
export default function ThemeProvider() {
  useEffect(() => {
    const root = document.documentElement;
    
    // Set all CSS variables from current theme
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-dim', colors.primaryDim);
    root.style.setProperty('--color-primary-glow', colors.primaryGlow);
    root.style.setProperty('--color-primary-border', colors.primaryBorder);
    root.style.setProperty('--color-bg', colors.bg);
    root.style.setProperty('--color-bg-alt', colors.bgAlt);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-text-muted', colors.textMuted);
    
    // Also update theme-color meta tag for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', colors.primary);
    }
    
    console.log(`[Theme] Applied: ${THEME.name} (${CURRENT_THEME})`);
  }, []);

  return null;
}

/**
 * Helper hook to get current theme colors in components
 */
export function useTheme() {
  return {
    theme: THEME,
    themeName: CURRENT_THEME,
    colors,
    logo: THEME.logo,
  };
}
