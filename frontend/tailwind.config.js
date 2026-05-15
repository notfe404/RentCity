/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deepBlack: '#0a0a0a',
        graphite: '#1e1e1e',
        gold: '#d4af37',
        electricBlue: '#0ba8e6',
      },
      fontFamily: {
        sans: ['Montserrat', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
