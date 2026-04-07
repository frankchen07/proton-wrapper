import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        primary: '#1F6FEB',
        accent: '#7C3AED',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        brand: {
          text: '#0F172A',
          success: '#15803D',
          warning: '#B45309',
          error: '#B91C1C',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config
