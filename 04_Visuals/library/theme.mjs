/**
 * FUTURE DESK OS - REMOTION & REACT VISUAL THEME CONFIGURATION
 * Direct React inline style tokens, colors, and typography for video generation.
 */

// 1. CORE COLOR PALETTE
export const COLORS = {
  tuscan_sun: '#F5A623',
  tuscan_sun_light: '#FFC72C',
  tuscan_sun_dark: '#D48806',
  obsidian: '#0B0C10',
  charcoal: '#161B22',
  charcoal_light: '#21262D',
  electric_cyan: '#00F2FE',
  signal_crimson: '#FF3B30',
  emerald_growth: '#10B981',
  platinum: '#E0E6ED',
  pure_white: '#FFFFFF',
  muted_gray: '#8B949E'
};

// 2. CURATED TYPOGRAPHY STYLES
export const FONT_FAMILIES = {
  bebas: '"Bebas Neue", sans-serif',
  spaceGrotesk: '"Space Grotesk", sans-serif',
  displayCaption: '"Bebas Neue", "Space Grotesk", sans-serif',
  inter: 'Inter, sans-serif',
  montserrat: 'Montserrat, sans-serif',
  plusJakarta: '"Plus Jakarta Sans", sans-serif',
  syne: 'Syne, sans-serif',
  outfit: 'Outfit, sans-serif',
  jetBrainsMono: '"JetBrains Mono", monospace',
  clashDisplay: '"Clash Display", sans-serif'
};

// 3. REMOTION & KALLAWAY PROTOCOL SYSTEM DEFAULTS
export const PRIMARY_HIGHLIGHT = COLORS.tuscan_sun;
export const DEFAULT_CAPTION_FONT = FONT_FAMILIES.bebas;
export const DEFAULT_DISPLAY_FONT = FONT_FAMILIES.displayCaption;

export const THEME = {
  colors: COLORS,
  fonts: FONT_FAMILIES,
  primaryHighlight: PRIMARY_HIGHLIGHT,
  defaultCaptionFont: DEFAULT_CAPTION_FONT,
  defaultDisplayFont: DEFAULT_DISPLAY_FONT
};

export default THEME;
