/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        giraffe: {
          yellow: '#FCD34D',
          orange: '#F97316',
          navy: '#1E3A8A',
          dark: '#0F172A',
        }
      },
      boxShadow: {
        'brutal': '6px 6px 0px #000000',
        'brutal-hover': '4px 4px 0px #000000',
        'brutal-active': '2px 2px 0px #000000',
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
}