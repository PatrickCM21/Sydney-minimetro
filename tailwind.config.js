/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sydney Trains brand overrides for standard Tailwind colors
        'blue': {
          DEFAULT: '#066fb6',
          50: '#ebf6ff',
          100: '#d6edff',
          200: '#b5e0ff',
          300: '#83ceff',
          400: '#21a6df',   // Light blue accent
          500: '#066fb6',   // Brand blue
          600: '#055992',   // Brand blue dark
          700: '#054774',
          800: '#073c60',
          900: '#0b3351',
          950: '#072036',
        },
        'orange': {
          DEFAULT: '#ee7b22',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdb573',
          400: '#f28d21',   // Light orange accent
          500: '#ee7b22',   // Brand orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        'green': {
          DEFAULT: '#5ab342',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#5ab342',   // Green
          500: '#5ab342',   // Green
          600: '#4fa336',
          700: '#3e802a',
          800: '#316421',
          900: '#29511c',
          950: '#142d0b',
        },
        // Sydney Trains line colors (official NSW palette)
        't1': '#F99D1C',   // T1 North Shore & Western Line - Orange
        't2': '#0098CD',   // T2 Inner West & Leppington - Blue
        't3': '#DC3B14',   // T3 Bankstown Line - Orange/Amber
        't4': '#005AA3',   // T4 Eastern Suburbs & Illawarra - Dark Blue
        't5': '#C4258F',   // T5 Cumberland Line - Gold
        't6': '#456CAA',   // T6 Carlingford Line - Purple
        't7': '#6F818E',   // T7 Olympic Park Line - Teal
        't8': '#00954C',   // T8 Airport & South Line - Red
        't9': '#D11F2F',   // T9 Northern Line - Cyan
        'm1': '#168388',   // M1 Metro Northwest & City & Southwest - Green
        'm2': '#00AEEF',   // M2 Metro - Light Blue
        'game': {
          'bg': 'var(--game-bg)',
          'surface': 'var(--game-surface)',
          'panel': 'var(--game-panel)',
          'border': 'var(--game-border)',
          'muted': 'var(--game-muted)',
          'text': 'var(--game-text)',
          'text-muted': 'var(--game-text-muted)',
          'accent': '#21a6df',   // Light blue accent
          'glow': '#21a6df',
          'success': '#5ab342',  // Brand Green
          'danger': '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'draw-line': 'drawLine 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
      },
      keyframes: {
        drawLine: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px currentColor)' },
          '50%': { filter: 'drop-shadow(0 0 12px currentColor)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(33, 166, 223, 0.3)',
        'glow-green': '0 0 20px rgba(90, 179, 66, 0.3)',
        'glow-orange': '0 0 20px rgba(238, 123, 34, 0.3)',
        'panel': '0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
}
