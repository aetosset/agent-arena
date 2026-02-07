/**
 * Theme Configuration
 * 
 * Change these values to quickly retheme the entire platform.
 * Colors, fonts, and visual elements are centralized here.
 * 
 * To apply a new theme:
 * 1. Update the values below
 * 2. Run the app - CSS variables will update automatically
 */

export const THEME = {
  // ============ COLOR PALETTE ============
  colors: {
    // Primary accent color (the signature color)
    primary: '#00ff00',           // Bright green
    primaryDim: '#00cc00',        // Darker green for hover states
    primaryGlow: 'rgba(0, 255, 0, 0.15)',
    primaryBorder: 'rgba(0, 255, 0, 0.3)',
    
    // Background colors (dark theme)
    bg: '#0a0a0a',                // Main background
    bgElevated: '#111111',        // Cards, modals
    bgCard: '#161616',            // Card backgrounds
    surface: '#1a1a1a',           // Input backgrounds, etc.
    
    // Text colors
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    textMuted: '#666666',
    
    // Status colors
    danger: '#ff3333',
    warning: '#ffaa00',
    success: '#00ff00',           // Usually same as primary
    
    // Border colors
    border: 'rgba(255, 255, 255, 0.1)',
    borderHover: 'rgba(255, 255, 255, 0.2)',
  },
  
  // ============ TYPOGRAPHY ============
  fonts: {
    // Main font stack
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    // Monospace for timers, code, technical elements
    mono: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
    // Display font for headings (optional - falls back to sans)
    display: "inherit",
  },
  
  // ============ BORDER RADIUS ============
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  // ============ SHADOWS ============
  shadows: {
    glow: '0 0 20px var(--color-primary-glow), 0 0 40px var(--color-primary-glow)',
    card: '0 4px 6px rgba(0, 0, 0, 0.3)',
    elevated: '0 8px 16px rgba(0, 0, 0, 0.4)',
  },
  
  // ============ TRANSITIONS ============
  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
  
  // ============ LOGO ============
  logo: {
    // The diamond icon - can be swapped for an image
    type: 'icon' as const,  // 'icon' | 'image' | 'text'
    icon: '◆',              // Unicode character for icon type
    imageSrc: '/logo.png',  // Path for image type
    size: 32,               // Size in pixels
    rotation: 45,           // Rotation in degrees (for diamond effect)
  },
} as const;

/**
 * Generate CSS variables from theme config
 * This is used in globals.css via :root
 */
export function generateCSSVariables(): string {
  const { colors } = THEME;
  return `
    --color-primary: ${colors.primary};
    --color-primary-dim: ${colors.primaryDim};
    --color-primary-glow: ${colors.primaryGlow};
    --color-primary-border: ${colors.primaryBorder};
    
    --color-bg: ${colors.bg};
    --color-bg-elevated: ${colors.bgElevated};
    --color-bg-card: ${colors.bgCard};
    --color-surface: ${colors.surface};
    
    --color-text: ${colors.text};
    --color-text-secondary: ${colors.textSecondary};
    --color-text-muted: ${colors.textMuted};
    
    --color-danger: ${colors.danger};
    --color-warning: ${colors.warning};
    --color-success: ${colors.success};
    
    --color-border: ${colors.border};
    --color-border-hover: ${colors.borderHover};
    
    --font-sans: ${THEME.fonts.sans};
    --font-mono: ${THEME.fonts.mono};
    --font-display: ${THEME.fonts.display};
    
    --radius-sm: ${THEME.radius.sm};
    --radius-md: ${THEME.radius.md};
    --radius-lg: ${THEME.radius.lg};
    --radius-xl: ${THEME.radius.xl};
  `;
}

/**
 * Tailwind color config (for tailwind.config.js)
 */
export const tailwindColors = {
  primary: THEME.colors.primary,
  'primary-dim': THEME.colors.primaryDim,
  bg: {
    DEFAULT: THEME.colors.bg,
    elevated: THEME.colors.bgElevated,
    card: THEME.colors.bgCard,
  },
  surface: THEME.colors.surface,
};

export type ThemeConfig = typeof THEME;
