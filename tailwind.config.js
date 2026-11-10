/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#000000',
          dark: '#111111',
          charcoal: '#1F2937',
          gray: {
            light: '#F3F4F6',
            medium: '#9CA3AF',
            border: '#E5E7EB'
          },
          surface: '#F9FAFB',
          white: '#FFFFFF'
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#2563EB'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

