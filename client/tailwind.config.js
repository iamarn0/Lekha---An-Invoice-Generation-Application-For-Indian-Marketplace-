/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F7F5',
        sand: '#F1F1EE',
        navy: {
          950: '#171717',
          900: '#171717',
          800: '#262626',
          700: '#404040',
        },
        ink: '#171717',
        muted: '#6B7280',
        faint: '#9CA3AF',
        mist: '#F1F1EE',
        line: '#E5E5E0',
        accent: {
          DEFAULT: '#4338CA',
          hover: '#3730A3',
          soft: '#F0EFFD',
        },
        saffron: '#D97706',
        success: '#15803D',
        warning: '#B45309',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(23, 23, 23, 0.04)',
        lift: '0 16px 40px -28px rgba(23, 23, 23, 0.45)',
      },
    },
  },
  plugins: [],
};
