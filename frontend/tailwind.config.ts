import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        surface: {
          DEFAULT: '#f0f4ff',
          card:    '#ffffff',
          elevated:'#f8faff',
        },
        ink: {
          DEFAULT: '#1e293b',
          muted:   '#64748b',
          subtle:  '#94a3b8',
          faint:   '#cbd5e1',
        },
      },
      boxShadow: {
        'soft':   '0 4px 24px rgba(59,130,246,0.10)',
        'medium': '0 8px 32px rgba(59,130,246,0.15)',
        'card':   '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(59,130,246,0.08)',
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'scan-line':  'scanLine 1.8s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
