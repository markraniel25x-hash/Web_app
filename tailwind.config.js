/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
    './src/lib/**/*.{js,jsx}',
    './src/context/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0ea5e9',
          dark: '#0284c7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%': { boxShadow: '0 0 0 0 rgba(14, 165, 233, 0.45)' },
          '70%': { boxShadow: '0 0 0 8px rgba(14, 165, 233, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(14, 165, 233, 0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-out',
        slideUp: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        pulseGlow: 'pulseGlow 2s infinite',
      },
    },
  },
  plugins: [],
}
