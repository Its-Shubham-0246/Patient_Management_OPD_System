/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#dce5f1',
          200: '#bccde4',
          300: '#94aed3',
          400: '#678cbe',
          500: '#4870aa',
          600: '#36578d',
          700: '#2c4571',
          800: '#273c5f',
          900: '#1e2d4a',
          950: '#131d31',
        },
        clinic: {
          teal: '#0d9488',
          blue: '#3b6fce',
          alert: '#dc2626',
          success: '#16a34a',
          warning: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
