/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
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

