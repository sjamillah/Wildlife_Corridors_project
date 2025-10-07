/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#3B6B3A',
        'brand-earth': '#8B5E3C',
        'brand-moss': '#9CBC4A',
        'brand-accent': '#C9E4B4',
        'bg-warm': '#F4F3EC'
      }
    },
  },
  plugins: [],
}