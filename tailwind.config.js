/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './03_Scripts/**/*.{js,mjs,jsx,ts,tsx}',
    './04_Visuals/**/*.{js,mjs,jsx,ts,tsx,html}',
    './api/**/*.{js,ts}',
    './utils/**/*.{js,mjs}',
    './index.html'
  ],
  theme: {
    extend: {
      colors: {
        tuscan_sun: '#F5A623',
        'tuscan_sun-light': '#FFC72C',
        'tuscan_sun-dark': '#D48806',
        obsidian: '#0B0C10',
        charcoal: '#161B22',
        'charcoal-light': '#21262D',
        electric_cyan: '#00F2FE',
        signal_crimson: '#FF3B30',
        emerald_growth: '#10B981',
        platinum: '#E0E6ED',
        pure_white: '#FFFFFF',
        muted_gray: '#8B949E'
      },
      fontFamily: {
        bebas: ['"Bebas Neue"', 'sans-serif'],
        'space-grotesk': ['"Space Grotesk"', 'sans-serif'],
        'display-caption': ['"Bebas Neue"', '"Space Grotesk"', 'sans-serif'],
        caption: ['"Bebas Neue"', '"Space Grotesk"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        'plus-jakarta': ['"Plus Jakarta Sans"', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
        jetbrains: ['"JetBrains Mono"', 'monospace'],
        'clash-display': ['"Clash Display"', 'sans-serif']
      }
    }
  },
  plugins: []
};
