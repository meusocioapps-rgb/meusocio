/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          950: '#071A12',
          900: '#0D2B1E',
          800: '#1A3A2E',
          700: '#2D6A4F',
          600: '#336B54',
          500: '#3D8C68',
          400: '#52B788',
          300: '#74C69D',
          200: '#A8DABC',
          100: '#D5EFE0',
          50:  '#EDF7F2',
        },
        accent: {
          500: '#F4A261',
          600: '#E07020',
          700: '#C75A0A',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
