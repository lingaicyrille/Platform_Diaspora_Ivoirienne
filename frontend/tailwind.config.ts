import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ci: {
          orange: '#F77F00',
          'orange-dark': '#CC6600',
          'orange-light': '#FFF0E0',
          green: '#009A44',
          'green-dark': '#007233',
          'green-light': '#E6F7ED',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.10)',
        orange: '0 4px 20px rgba(247,127,0,0.25)',
        green: '0 4px 20px rgba(0,154,68,0.20)',
      },
      backgroundImage: {
        'hero-dark': 'linear-gradient(135deg, #0D1117 0%, #1A1A2E 100%)',
        'gradient-ci': 'linear-gradient(135deg, #F77F00 0%, #FFBB33 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out both',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
