/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          neon: '#39FF14',
          primary: '#22C55E',
          dark: '#16A34A',
        },
        dark: {
          900: '#000000',
          800: '#0F0F0F',
          700: '#111827',
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
        'brand-gradient': 'linear-gradient(135deg, #39FF14 0%, #22C55E 50%, #16A34A 100%)',
        'dark-gradient': 'linear-gradient(180deg, #000000 0%, #0F0F0F 50%, #111827 100%)',
      },
      animation: {
        'flow-wave': 'flow-wave 10s infinite linear',
        'logo-reveal': 'logo-reveal 3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'float-slow': 'float-slow 8s infinite ease-in-out',
      },
      keyframes: {
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
