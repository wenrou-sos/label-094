/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      gridTemplateColumns: {
        '24': 'repeat(24, minmax(0, 1fr))',
        '48': 'repeat(48, minmax(0, 1fr))'
      },
      gridColumn: {
        'span-13': 'span 13 / span 13',
        'span-14': 'span 14 / span 14',
        'span-15': 'span 15 / span 15',
        'span-16': 'span 16 / span 16',
        'span-17': 'span 17 / span 17',
        'span-18': 'span 18 / span 18',
        'span-19': 'span 19 / span 19',
        'span-20': 'span 20 / span 20',
        'span-21': 'span 21 / span 21',
        'span-22': 'span 22 / span 22',
        'span-23': 'span 23 / span 23',
        'span-24': 'span 24 / span 24'
      },
      colors: {
        customer: {
          50:  '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
          950: '#3B0764'
        },
        admin: {
          50:  '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49'
        },
        accent: {
          rose: '#F472B6',
          hotpink: '#EC4899',
          amber: '#FBBF24',
          emerald: '#34D399',
          indigo: '#818CF8'
        }
      },
      boxShadow: {
        'customer-glow': '0 0 40px rgba(147, 51, 234, 0.35)',
        'admin-glow': '0 0 40px rgba(14, 165, 233, 0.3)',
        'inner-glow': 'inset 0 2px 4px rgba(255,255,255,0.08)'
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease forwards',
        'slide-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-ring': 'pulseRing 2.4s ease-out infinite',
        'shimmer': 'shimmer 1.8s infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite'
      },
      keyframes: {
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        }
      },
      backdropBlur: {
        'xs': '2px'
      }
    },
  },
  plugins: [],
};
