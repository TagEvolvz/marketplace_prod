/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          neon: '#9CFB63',
          primary: '#22C55E',
          dark: '#15803D',
          ink: '#06140A',
        },
        dark: {
          900: '#020617',
          800: '#0F172A',
          700: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Poppins"', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '28px',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #9CFB63 0%, #22C55E 48%, #15803D 100%)',
        'dark-gradient': 'linear-gradient(180deg, #020617 0%, #0F172A 52%, #111827 100%)',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 18px 50px rgba(15, 23, 42, 0.08)',
        'soft-dark': '0 18px 50px rgba(0, 0, 0, 0.32)',
        lift: '0 20px 60px rgba(15, 23, 42, 0.14)',
        button: '0 10px 24px rgba(15, 23, 42, 0.18)',
        'inner-soft': 'inset 0 1px 0 rgba(255,255,255,0.55)',
      },
      animation: {
        'flow-wave': 'flow-wave 10s infinite linear',
        'logo-reveal': 'logo-reveal 3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'float-slow': 'float-slow 8s infinite ease-in-out',
        shimmer: 'shimmer 1.8s infinite',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'flow-wave': {
          '0%': { transform: 'translateX(-100%) rotate(0deg)' },
          '100%': { transform: 'translateX(100%) rotate(5deg)' },
        },
        'logo-reveal': {
          '0%': { maskSize: '0% 100%', filter: 'brightness(0) blur(20px)' },
          '100%': { maskSize: '100% 100%', filter: 'brightness(1) blur(0px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-20px) scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
};
