/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#edf4ef',
        panel: '#fbfdfb',
        panelAlt: '#f2f7f3',
        line: '#cfddd5',
        text: '#17312d',
        muted: '#657b74',
        white: '#17312d',
        slate: {
          50: '#f7faf8',
          100: '#eef5f1',
          200: '#304d45',
          300: '#46635b',
          400: '#5d756d',
          500: '#71867f',
          600: '#4c625b',
          700: '#3b514b',
          800: '#29413b',
          900: '#1d3530',
          950: '#e8f1ec',
        },
        brand: {
          50: '#edf8f5',
          100: '#245f55',
          200: '#2d7367',
          300: '#3b8779',
          400: '#4d988a',
          500: '#347f73',
          600: '#28685e',
          700: '#24534c',
          800: '#20433e',
          900: '#1c3834'
        },
        accent: {
          50: '#f3f7fa',
          100: '#e4eef4',
          200: '#b9d1df',
          300: '#8fb6ca',
          400: '#679ab4',
          500: '#4d7f99',
          600: '#3e687f',
          700: '#365668',
          800: '#304956',
          900: '#2b3e49'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(52, 127, 115, 0.16), 0 18px 45px rgba(52, 76, 66, 0.14)',
      },
      backgroundImage: {
        'hero-grid':
          'radial-gradient(circle at 20% 20%, rgba(87, 154, 139, 0.18), transparent 0 24%), radial-gradient(circle at 80% 0%, rgba(103, 154, 180, 0.16), transparent 0 22%), linear-gradient(180deg, #f7fbf8, #eaf3ee)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
