import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      colors: {
        bg: {
          DEFAULT: '#0a0f1e',
          card: '#0f1729',
          elevated: '#162035',
        },
        accent: {
          DEFAULT: '#00d4ff',
          dim: '#00d4ff33',
          hover: '#00eeff',
        },
        success: '#00ff88',
        warning: '#ffaa00',
        danger: '#ff4466',
        muted: '#4a5568',
        subtle: '#1e2d4a',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'scan-line': 'scanLine 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px #00d4ff44' },
          '50%': { boxShadow: '0 0 24px #00d4ff88' },
        },
      },
    },
  },
  plugins: [],
}
export default config
