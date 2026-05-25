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
        // Sydney Trains line colors (official NSW palette)
        't1': '#F7941D',   // T1 North Shore & Western Line - Orange
        't2': '#0098CD',   // T2 Inner West & Leppington - Blue
        't3': '#F4871F',   // T3 Bankstown Line - Orange/Amber
        't4': '#005AA3',   // T4 Eastern Suburbs & Illawarra - Dark Blue
        't5': '#C4A000',   // T5 Cumberland Line - Gold
        't6': '#6D2077',   // T6 Carlingford Line - Purple
        't7': '#009B77',   // T7 Olympic Park Line - Teal
        't8': '#D50032',   // T8 Airport & South Line - Red
        't9': '#00B2A9',   // T9 Northern Line - Cyan
        'm1': '#009B77',   // M1 Metro Northwest & City & Southwest - Green
        'm2': '#00AEEF',   // M2 Metro - Light Blue
        // Game UI palette
        'game': {
          'bg': '#0a0c12',
          'surface': '#111827',
          'panel': '#141a24',
          'border': '#1e2a3a',
          'muted': '#374151',
          'accent': '#3b82f6',
          'glow': '#60a5fa',
          'success': '#22c55e',
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
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-orange': '0 0 20px rgba(247, 148, 29, 0.3)',
        'panel': '0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
}
